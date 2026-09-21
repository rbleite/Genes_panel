import { describe, it, expect } from "vitest";
import clinicalRulesData from "./clinicalRules.json";
import panels from "./panels.json";

const rules = clinicalRulesData.rules;
const panelIds = new Set(panels.map((p) => p.id));
const byId = (id) => rules.find((r) => r.id === id);

describe("clinicalRules — referential integrity", () => {
  it("every recommended panel exists in panels.json", () => {
    for (const rule of rules) {
      for (const pid of rule.recommendedPanels) {
        expect(panelIds.has(pid), `${rule.id} → ${pid}`).toBe(true);
      }
    }
  });

  it("every recommendedCombinations partner exists in panels.json", () => {
    for (const panel of panels) {
      for (const combo of panel.recommendedCombinations || []) {
        expect(panelIds.has(combo.with), `${panel.id} ↔ ${combo.with}`).toBe(true);
      }
    }
  });

  it("combination is true exactly when a rule recommends more than one panel", () => {
    for (const rule of rules) {
      expect(rule.combination, rule.id).toBe(rule.recommendedPanels.length > 1);
    }
  });

  it("rule ids are unique", () => {
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("clinicalRules — haematology DNA/RNA components", () => {
  const hemato = rules.filter((r) => r.domain === "hematologia");
  const HEMATO_PANELS = new Set(["dna-hemato", "rna-hemato", "germinativo"]);

  it("haematology rules only recommend haematology components (or germline)", () => {
    for (const rule of hemato) {
      for (const pid of rule.recommendedPanels) {
        expect(HEMATO_PANELS.has(pid), `${rule.id} → ${pid}`).toBe(true);
      }
    }
  });

  it("every haematology rule includes the DNA component", () => {
    // The RNA arm detects fusions only; used alone it would miss the
    // mutations and CNV that define most haematological entities.
    for (const rule of hemato) {
      expect(rule.recommendedPanels, rule.id).toContain("dna-hemato");
    }
  });

  it.each(["lma", "lla", "neoplasias-eosinofilia"])(
    "%s combines DNA and RNA",
    (id) => {
      expect(byId(id).recommendedPanels).toEqual(["dna-hemato", "rna-hemato"]);
    },
  );

  it.each(["smd-nmp", "llc", "mastocitose", "waldenstrom", "lmc", "neoplasias-histiociticas"])(
    "%s uses the DNA component only",
    (id) => {
      expect(byId(id).recommendedPanels).toEqual(["dna-hemato"]);
    },
  );

  it("linfoma does not route to RNA, and states that double hit needs FISH", () => {
    // Regression guard: the rule previously claimed RNA confirmed
    // MYC/BCL2/BCL6 double/triple hit. BCL2 and BCL6 have no fusion
    // coverage, and IG-partner translocations yield no chimeric transcript.
    const linfoma = byId("linfoma");
    expect(linfoma.recommendedPanels).not.toContain("rna-hemato");
    expect(linfoma.goals).not.toContain("RNA");
    const text = [...linfoma.rationale, ...linfoma.caveats].join(" ");
    expect(text).toMatch(/FISH/);
    expect(text).not.toMatch(/por RNA confirmam double/i);
  });
});

describe("panels — haematology split", () => {
  const dna = panels.find((p) => p.id === "dna-hemato");
  const rna = panels.find((p) => p.id === "rna-hemato");

  it("the integrated panel no longer exists", () => {
    expect(panelIds.has("dna-rna-hemato")).toBe(false);
  });

  it("DNA component holds the mutation and DNA-fusion sections", () => {
    expect(Object.keys(dna.secoes).sort()).toEqual(["coreDnaHemato", "dnaFusions"]);
  });

  it("RNA component holds only the RNA fusion section", () => {
    expect(Object.keys(rna.secoes)).toEqual(["rnaFusionBlood"]);
  });

  it.each([
    ["dna-hemato", () => dna],
    ["rna-hemato", () => rna],
  ])("%s gene list and total match its sections", (_, get) => {
    const panel = get();
    const union = new Set(Object.values(panel.secoes).flat());
    expect(panel.totalGenes).toBe(panel.genes.length);
    expect(new Set(panel.genes)).toEqual(union);
  });

  it("both components point to each other as a recommended combination", () => {
    expect(dna.recommendedCombinations.map((c) => c.with)).toContain("rna-hemato");
    expect(rna.recommendedCombinations.map((c) => c.with)).toContain("dna-hemato");
  });
});
