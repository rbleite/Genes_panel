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

function calcConfidence(matched) {
  const goals = matched.goals || 0;
  const ctx   = matched.context || 0;
  if (goals >= 2 || (goals >= 1 && ctx >= 1)) return "alta";
  if (goals >= 1 || ctx >= 2)                  return "moderada";
  return "baixa";
}

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

  // Tumor match is required — no match → rule is irrelevant
  if (tumor) {
    const tumorAlias = normAlias(clinicalInput.tumor);
    const hit = ruleTumors.some(
      (t) => tumor.includes(t) || t.includes(tumor) ||
             (tumorAlias !== tumor && (tumorAlias.includes(t) || t.includes(tumorAlias)))
    );
    if (!hit) return { score: 0, matched, matchedContext, matchedGoals, confidence: "baixa" };
    score += 10;
    matched.tumor = true;
  }

  context.forEach((item) => {
    if (ruleContext.some((r) => r.includes(item) || item.includes(r))) {
      score += 3;
      matched.context++;
      matchedContext.push(item);
    }
  });

  goals.forEach((goal) => {
    const goalAlias = normAlias(goal);
    const hit = ruleGoals.some(
      (r) => r.includes(goal) || goal.includes(r) ||
             (goalAlias !== goal && (r.includes(goalAlias) || goalAlias.includes(r)))
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

  const ranked = rules
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
  return {
    rule: best,
    panels: panels.filter((p) => best.recommendedPanels.includes(p.id)),
    alternatives: ranked.slice(1, 4),
    message: null,
  };
}
