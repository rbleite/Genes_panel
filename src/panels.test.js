import { describe, it, expect } from "vitest";
import panels from "./panels.json";
import coverageData from "./geneCoverage.json";
import { resolveGeneAlias } from "./geneAliases.js";

// A symbol is canonical when the alias dictionary does not redirect it.
// resolveGeneAlias upper-cases unknown input, and some approved symbols
// are mixed-case (C8orf34), so compare case-insensitively.
const isCanonical = (g) => resolveGeneAlias(g).toUpperCase() === g.toUpperCase();

// Whitespace, brackets and the fullwidth punctuation that leaked in from
// vendor spreadsheets (e.g. "MRTFB（MKL2)").
const MALFORMED = /[\s()（），；,;]/;

describe.each(panels.map((p) => [p.id, p]))("panel %s", (_, panel) => {
  const sectionGenes = Object.values(panel.secoes).flat();

  it("totalGenes matches the gene list, with no duplicates", () => {
    expect(new Set(panel.genes).size).toBe(panel.genes.length);
    expect(panel.totalGenes).toBe(panel.genes.length);
  });

  it("gene list equals the union of its sections", () => {
    expect(new Set(panel.genes)).toEqual(new Set(sectionGenes));
  });

  it("uses only canonical symbols", () => {
    expect(panel.genes.filter((g) => !isCanonical(g))).toEqual([]);
  });

  it("has no malformed symbols", () => {
    expect(sectionGenes.filter((g) => MALFORMED.test(g))).toEqual([]);
  });
});

describe("geneCoverage.json", () => {
  it("keys every gene by its canonical symbol", () => {
    for (const [panelId, genes] of Object.entries(coverageData)) {
      if (panelId === "_meta") continue;
      const bad = Object.keys(genes).filter((g) => !isCanonical(g));
      expect(bad, panelId).toEqual([]);
    }
  });
});
