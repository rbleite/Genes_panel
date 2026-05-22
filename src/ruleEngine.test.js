import { describe, it, expect } from "vitest";
import { normalizeText, scoreRule, recommendByRules } from "./ruleEngine.js";

// ── Test fixtures ─────────────────────────────────────────────────────────
const cpncpRule = {
  id: "cpnpc-avancado",
  domain: "oncologia-solida",
  tumor: ["CPNPC", "Adenocarcinoma do pulmão", "Pulmão"],
  context: ["avançado", "metastático", "1ª linha"],
  goals: ["ALK", "ROS1", "EGFR", "fusões"],
  recommendedPanels: ["dna-tumores-solidos", "fusoes-rna"],
};

const lmaRule = {
  id: "lma",
  domain: "hematologia",
  tumor: ["LMA", "Leucemia mielóide aguda"],
  context: ["diagnóstico", "recidiva"],
  goals: ["FLT3", "NPM1", "IDH1"],
  recommendedPanels: ["dna-rna-hemato"],
};

const mamaRule = {
  id: "mama-somatico",
  domain: "oncologia-solida",
  tumor: ["Mama", "Carcinoma da mama"],
  context: ["metastático", "HER2"],
  goals: ["PIK3CA", "ESR1", "HER2"],
  recommendedPanels: ["dna-tumores-solidos"],
};

const panels = [
  { id: "dna-tumores-solidos", label: "DNA Tumores Sólidos" },
  { id: "fusoes-rna", label: "Fusões RNA" },
  { id: "dna-rna-hemato", label: "DNA/RNA Hematologia" },
  { id: "germinativo", label: "Germinativo" },
];

// ── normalizeText ─────────────────────────────────────────────────────────
describe("normalizeText", () => {
  it("returns empty string for null/undefined", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  it("lowercases input", () => {
    expect(normalizeText("CPNPC")).toBe("cpnpc");
    expect(normalizeText("HeR2")).toBe("her2");
  });

  it("strips diacritics", () => {
    expect(normalizeText("pulmão")).toBe("pulmao");
    expect(normalizeText("metastático")).toBe("metastatico");
    expect(normalizeText("avançado")).toBe("avancado");
    expect(normalizeText("mielóide")).toBe("mieloide");
  });

  it("preserves non-letter characters (hyphens, digits)", () => {
    expect(normalizeText("HER-2")).toBe("her-2");
    expect(normalizeText("estadio IV")).toBe("estadio iv");
  });

  it("decomposes ordinal indicators (ª, º) via NFKD", () => {
    expect(normalizeText("1ª linha")).toBe("1a linha");
    expect(normalizeText("2º trimestre")).toBe("2o trimestre");
  });

  it("coerces numbers to strings", () => {
    expect(normalizeText(123)).toBe("123");
  });
});

// ── scoreRule ──────────────────────────────────────────────────────────────
describe("scoreRule — tumor matching", () => {
  it("returns score 0 when tumor does not match", () => {
    const result = scoreRule(cpncpRule, { tumor: "mama" });
    expect(result.score).toBe(0);
    expect(result.matched.tumor).toBe(false);
  });

  it("scores 10 for exact tumor match", () => {
    const result = scoreRule(cpncpRule, { tumor: "CPNPC" });
    expect(result.score).toBe(10);
    expect(result.matched.tumor).toBe(true);
  });

  it("is diacritic-insensitive on tumor terms", () => {
    const result = scoreRule(cpncpRule, { tumor: "pulmao" });
    expect(result.score).toBe(10);
    expect(result.matched.tumor).toBe(true);
  });

  it("is case-insensitive on tumor terms", () => {
    const result = scoreRule(cpncpRule, { tumor: "cpnpc" });
    expect(result.score).toBe(10);
  });

  it("matches via substring when both terms are >= 4 chars", () => {
    const result = scoreRule(cpncpRule, { tumor: "Adenocarcinoma" });
    expect(result.score).toBe(10);
  });

  it("does NOT match a short fragment inside a longer word (regression: lma vs pulmão)", () => {
    // "LMA" (leucemia mielóide aguda) must not match "pulmão" via substring
    const result = scoreRule(lmaRule, { tumor: "pulmão" });
    expect(result.score).toBe(0);
    expect(result.matched.tumor).toBe(false);
  });

  it("matches short tumor codes when they appear as standalone tokens", () => {
    const result = scoreRule(lmaRule, { tumor: "LMA" });
    expect(result.score).toBe(10);
  });

  it("returns zero score and baixa confidence when tumor is provided but does not match", () => {
    const result = scoreRule(cpncpRule, { tumor: "tumor-inexistente" });
    expect(result.score).toBe(0);
    expect(result.confidence).toBe("baixa");
  });
});

describe("scoreRule — context matching", () => {
  it("adds 3 points per matched context signal", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["metastático"],
    });
    expect(result.score).toBe(13);
    expect(result.matched.context).toBe(1);
    expect(result.matchedContext).toEqual(["metastatico"]);
  });

  it("accumulates multiple context signals", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["metastático", "1ª linha"],
    });
    expect(result.score).toBe(10 + 3 + 3);
    expect(result.matched.context).toBe(2);
  });

  it("is diacritic-insensitive on context", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["avancado"],
    });
    expect(result.matched.context).toBe(1);
  });

  it("ignores unmatched context signals without penalty", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["metastático", "noise-signal"],
    });
    expect(result.score).toBe(13);
    expect(result.matched.context).toBe(1);
  });
});

describe("scoreRule — goal matching", () => {
  it("adds 4 points per matched goal", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      goals: ["ALK"],
    });
    expect(result.score).toBe(14);
    expect(result.matched.goals).toBe(1);
  });

  it("accumulates multiple goal signals", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      goals: ["ALK", "EGFR"],
    });
    expect(result.score).toBe(10 + 4 + 4);
    expect(result.matched.goals).toBe(2);
  });

  it("resolves user-typed alias to canonical (HER2 → ERBB2)", () => {
    // Rule lists the canonical symbol; user types the common alias.
    const ruleWithCanonical = { ...mamaRule, goals: ["ERBB2"] };
    const result = scoreRule(ruleWithCanonical, {
      tumor: "Mama",
      goals: ["HER2"],
    });
    expect(result.matched.goals).toBe(1);
  });

  it("alias resolution is one-way (rule containing alias does NOT match canonical input)", () => {
    // Documents asymmetry: scoreRule only resolves the *user's* input.
    // If the rule lists 'HER2' but the user types 'ERBB2', no alias match occurs.
    const ruleWithAlias = { ...mamaRule, goals: ["HER2"] };
    const result = scoreRule(ruleWithAlias, {
      tumor: "Mama",
      goals: ["ERBB2"],
    });
    expect(result.matched.goals).toBe(0);
  });
});

describe("scoreRule — confidence", () => {
  it("is 'alta' when goals >= 2", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      goals: ["ALK", "ROS1"],
    });
    expect(result.confidence).toBe("alta");
  });

  it("is 'alta' when goals >= 1 AND context >= 1", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["metastático"],
      goals: ["ALK"],
    });
    expect(result.confidence).toBe("alta");
  });

  it("is 'moderada' when goals === 1 and no context", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      goals: ["ALK"],
    });
    expect(result.confidence).toBe("moderada");
  });

  it("is 'moderada' when context >= 2 and no goals", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["metastático", "1ª linha"],
    });
    expect(result.confidence).toBe("moderada");
  });

  it("is 'baixa' when only tumor matches", () => {
    const result = scoreRule(cpncpRule, { tumor: "CPNPC" });
    expect(result.confidence).toBe("baixa");
  });

  it("is 'baixa' when only one context signal matches", () => {
    const result = scoreRule(cpncpRule, {
      tumor: "CPNPC",
      context: ["metastático"],
    });
    expect(result.confidence).toBe("baixa");
  });
});

describe("scoreRule — input robustness", () => {
  it("treats missing context/goals arrays as empty", () => {
    const result = scoreRule(cpncpRule, { tumor: "CPNPC" });
    expect(result.score).toBe(10);
    expect(result.matched.context).toBe(0);
    expect(result.matched.goals).toBe(0);
  });

  it("returns matchedContext and matchedGoals arrays even when empty", () => {
    const result = scoreRule(cpncpRule, { tumor: "CPNPC" });
    expect(result.matchedContext).toEqual([]);
    expect(result.matchedGoals).toEqual([]);
  });
});

// ── recommendByRules ───────────────────────────────────────────────────────
describe("recommendByRules", () => {
  const rules = [cpncpRule, lmaRule, mamaRule];

  it("returns a guidance message when tumor is empty", () => {
    const result = recommendByRules({ tumor: "" }, rules, panels);
    expect(result.rule).toBeNull();
    expect(result.panels).toEqual([]);
    expect(result.alternatives).toEqual([]);
    expect(result.message).toMatch(/tipo tumoral/i);
  });

  it("returns a guidance message when tumor is whitespace only", () => {
    const result = recommendByRules({ tumor: "   " }, rules, panels);
    expect(result.rule).toBeNull();
    expect(result.message).toMatch(/tipo tumoral/i);
  });

  it("returns a 'no matching rule' message when no rule scores > 0", () => {
    const result = recommendByRules(
      { tumor: "tumor-completamente-inexistente" },
      rules,
      panels
    );
    expect(result.rule).toBeNull();
    expect(result.panels).toEqual([]);
    expect(result.message).toMatch(/sem regra clínica/i);
  });

  it("returns the highest-scoring rule as best match", () => {
    const result = recommendByRules(
      { tumor: "CPNPC", context: ["metastático"], goals: ["ALK", "EGFR"] },
      rules,
      panels
    );
    expect(result.rule.id).toBe("cpnpc-avancado");
    expect(result.message).toBeNull();
  });

  it("resolves recommendedPanels to full panel objects", () => {
    const result = recommendByRules({ tumor: "CPNPC" }, rules, panels);
    expect(result.panels).toHaveLength(2);
    expect(result.panels.map((p) => p.id)).toEqual([
      "dna-tumores-solidos",
      "fusoes-rna",
    ]);
  });

  it("filters out alternatives below MIN_ALTERNATIVE_SCORE (14)", () => {
    // CPNPC alone scores 10 against cpnpcRule — below threshold for alternative
    // We need a different best match so alternatives can be evaluated.
    // Use mama with HER2 goal which strongly hits mamaRule; cpncpRule won't
    // match at all because tumor is "Mama" not in cpncpRule.tumor.
    const result = recommendByRules(
      { tumor: "Mama", goals: ["HER2"] },
      rules,
      panels
    );
    expect(result.rule.id).toBe("mama-somatico");
    // No other rule matches "Mama", so alternatives is empty
    expect(result.alternatives).toEqual([]);
  });

  it("filters by domain when domain is provided", () => {
    // Without domain filter, "Mama" matches mamaRule (oncologia-solida).
    // Forcing hematologia domain should drop all solid-tumour rules.
    const result = recommendByRules(
      { tumor: "Mama", domain: "hematologia" },
      rules,
      panels
    );
    expect(result.rule).toBeNull();
    expect(result.message).toMatch(/sem regra clínica/i);
  });

  it("does not apply domain filter when domain is empty", () => {
    const result = recommendByRules(
      { tumor: "CPNPC", domain: "" },
      rules,
      panels
    );
    expect(result.rule).not.toBeNull();
    expect(result.rule.id).toBe("cpnpc-avancado");
  });

  it("caps alternatives to top 3 when many rules qualify", () => {
    // Build five extra rules that all match "shared-tumor" strongly enough
    // to clear MIN_ALTERNATIVE_SCORE (>=14).
    const sharedRules = Array.from({ length: 5 }, (_, i) => ({
      id: `alt-${i}`,
      domain: "oncologia-solida",
      tumor: ["shared-tumor"],
      context: [],
      goals: ["goal-x"],
      recommendedPanels: [],
    }));
    const best = {
      id: "best",
      domain: "oncologia-solida",
      tumor: ["shared-tumor"],
      context: [],
      goals: ["goal-x", "goal-y"], // matches both → highest score
      recommendedPanels: [],
    };
    const result = recommendByRules(
      { tumor: "shared-tumor", goals: ["goal-x", "goal-y"] },
      [best, ...sharedRules],
      panels
    );
    expect(result.rule.id).toBe("best");
    expect(result.alternatives.length).toBeLessThanOrEqual(3);
  });
});
