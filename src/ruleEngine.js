export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function scoreRule(rule, clinicalInput) {
  const tumor = normalizeText(clinicalInput.tumor);
  const context = (clinicalInput.context || []).map(normalizeText);
  const goals = (clinicalInput.goals || []).map(normalizeText);

  let score = 0;
  let matched = { tumor: false, context: 0, goals: 0 };

  const ruleTumors = (rule.tumor || []).map(normalizeText);
  const ruleContext = (rule.context || []).map(normalizeText);
  const ruleGoals = (rule.goals || []).map(normalizeText);

  if (tumor) {
    const tumorMatch = ruleTumors.some(
      (t) => tumor.includes(t) || t.includes(tumor)
    );
    if (tumorMatch) {
      score += 10;
      matched.tumor = true;
    } else {
      // No tumor match → rule is not relevant
      return { score: 0, matched };
    }
  }

  context.forEach((item) => {
    if (ruleContext.some((r) => r.includes(item) || item.includes(r))) {
      score += 3;
      matched.context++;
    }
  });

  goals.forEach((goal) => {
    if (ruleGoals.some((r) => r.includes(goal) || goal.includes(r))) {
      score += 4;
      matched.goals++;
    }
  });

  return { score, matched };
}

export function recommendByRules(clinicalInput, rules, panels) {
  if (!clinicalInput.tumor?.trim()) {
    return { rule: null, panels: [], alternatives: [], message: "Introduz o tipo tumoral para obter recomendação." };
  }

  const ranked = rules
    .map((rule) => {
      const { score, matched } = scoreRule(rule, clinicalInput);
      return { ...rule, _score: score, _matched: matched };
    })
    .filter((r) => r._score > 0)
    .sort((a, b) => b._score - a._score);

  if (!ranked.length) {
    return {
      rule: null,
      panels: [],
      alternatives: [],
      message: "Sem regra clínica correspondente. Revê os critérios ou consulta o catálogo de painéis.",
    };
  }

  const best = ranked[0];
  const recommendedPanels = panels.filter((p) =>
    best.recommendedPanels.includes(p.id)
  );

  return {
    rule: best,
    panels: recommendedPanels,
    alternatives: ranked.slice(1, 4),
    message: null,
  };
}
