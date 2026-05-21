import { resolveGeneAlias } from "./geneAliases.js";

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normAlias(term) {
  return normalizeText(resolveGeneAlias(term));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Safe substring match. The guard uses the SHORTER of the two strings:
// if the shorter is < 4 chars (e.g. "lma", "io", "ret") it must appear as
// a whole word/token to avoid "pulmao".includes("lma") = true false positives.
function termMatches(haystack, needle) {
  if (haystack === needle) return true;
  const minLen = Math.min(haystack.length, needle.length);
  if (minLen >= 4) return haystack.includes(needle) || needle.includes(haystack);
  // short term — the shorter string must stand alone as a token
  const short = haystack.length <= needle.length ? haystack : needle;
  const long  = haystack.length <= needle.length ? needle   : haystack;
  return new RegExp(
    `(?:^|[\\s/\\-])${escapeRegExp(short)}(?:$|[\\s/\\-])`
  ).test(` ${long} `);
}

function calcConfidence(matched) {
  const goals = matched.goals || 0;
  const ctx   = matched.context || 0;
  if (goals >= 2 || (goals >= 1 && ctx >= 1)) return "alta";
  if (goals >= 1 || ctx >= 2)                  return "moderada";
  return "baixa";
}

// Minimum score for a rule to appear as an alternative (tumor-only = 10 pts,
// which is too weak to recommend without any context/goal signal).
const MIN_ALTERNATIVE_SCORE = 14;

export function scoreRule(rule, clinicalInput) {
  const tumor   = normalizeText(clinicalInput.tumor);
  const context = (clinicalInput.context || []).map(normalizeText);
  const goals   = (clinicalInput.goals   || []).map(normalizeText);

  let score = 0;
  const matched = { tumor: false, context: 0, goals: 0 };
  const matchedContext = [];
  const matchedGoals   = [];

  const ruleTumors  = (rule.tumor   || []).map(normalizeText);
  const ruleContext = (rule.context || []).map(normalizeText);
  const ruleGoals   = (rule.goals   || []).map(normalizeText);

  // Tumor match is required — uses termMatches to prevent short-token false positives
  if (tumor) {
    const tumorAlias = normAlias(clinicalInput.tumor);
    const hit = ruleTumors.some(
      (t) => termMatches(t, tumor) || termMatches(tumor, t) ||
             (tumorAlias !== tumor &&
               (termMatches(t, tumorAlias) || termMatches(tumorAlias, t)))
    );
    if (!hit) return { score: 0, matched, matchedContext, matchedGoals, confidence: "baixa" };
    score += 10;
    matched.tumor = true;
  }

  context.forEach((item) => {
    if (ruleContext.some((r) => termMatches(r, item) || termMatches(item, r))) {
      score += 3;
      matched.context++;
      matchedContext.push(item);
    }
  });

  goals.forEach((goal) => {
    const goalAlias = normAlias(goal);
    const hit = ruleGoals.some(
      (r) => termMatches(r, goal) || termMatches(goal, r) ||
             (goalAlias !== goal && (termMatches(r, goalAlias) || termMatches(goalAlias, r)))
    );
    if (hit) {
      score += 4;
      matched.goals++;
      matchedGoals.push(goal);
    }
  });

  return { score, matched, matchedContext, matchedGoals, confidence: calcConfidence(matched) };
}

export function recommendByRules(clinicalInput, rules, panels) {
  if (!clinicalInput.tumor?.trim()) {
    return {
      rule: null, panels: [], alternatives: [],
      message: "Introduz o tipo tumoral para obter recomendação.",
    };
  }

  // Domain filter: when the user selects a domain, restrict to that domain only.
  // This prevents haematology rules from surfacing for solid-tumour inputs and vice-versa.
  const inputDomain = clinicalInput.domain?.trim();

  const ranked = rules
    .filter((r) => !inputDomain || r.domain === inputDomain)
    .map((rule) => {
      const { score, matched, matchedContext, matchedGoals, confidence } =
        scoreRule(rule, clinicalInput);
      return { ...rule, _score: score, _matched: matched, _matchedContext: matchedContext, _matchedGoals: matchedGoals, _confidence: confidence };
    })
    .filter((r) => r._score > 0)
    .sort((a, b) => b._score - a._score);

  if (!ranked.length) {
    return {
      rule: null, panels: [], alternatives: [],
      message: "Sem regra clínica correspondente. Revê os critérios ou consulta o catálogo de painéis.",
    };
  }

  const best = ranked[0];

  // Alternatives only surface if they have context/goal signal beyond tumor alone
  const alternatives = ranked
    .slice(1)
    .filter((r) => r._score >= MIN_ALTERNATIVE_SCORE)
    .slice(0, 3);

  return {
    rule: best,
    panels: panels.filter((p) => best.recommendedPanels.includes(p.id)),
    alternatives,
    message: null,
  };
}
