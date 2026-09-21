import { describe, it, expect } from "vitest";
import {
  GENE_ALIASES,
  resolveGeneAlias,
  aliasesForSymbol,
} from "./geneAliases.js";

describe("resolveGeneAlias", () => {
  it("returns empty string for null/undefined/empty input", () => {
    expect(resolveGeneAlias(null)).toBe("");
    expect(resolveGeneAlias(undefined)).toBe("");
    expect(resolveGeneAlias("")).toBe("");
  });

  it("resolves canonical HER2 family aliases to ERBB2", () => {
    expect(resolveGeneAlias("HER2")).toBe("ERBB2");
    expect(resolveGeneAlias("HER-2")).toBe("ERBB2");
    expect(resolveGeneAlias("NEU")).toBe("ERBB2");
  });

  it("is case-insensitive", () => {
    expect(resolveGeneAlias("her2")).toBe("ERBB2");
    expect(resolveGeneAlias("Her2")).toBe("ERBB2");
    expect(resolveGeneAlias("hEr-2")).toBe("ERBB2");
  });

  it("trims whitespace", () => {
    expect(resolveGeneAlias("  HER2  ")).toBe("ERBB2");
    expect(resolveGeneAlias("\tHER2\n")).toBe("ERBB2");
  });

  it("returns uppercased original term when no alias is found", () => {
    expect(resolveGeneAlias("BRCA1")).toBe("BRCA1");
    expect(resolveGeneAlias("brca1")).toBe("BRCA1");
    expect(resolveGeneAlias("unknownGene")).toBe("UNKNOWNGENE");
  });

  it("resolves PD-L1 family aliases to CD274", () => {
    expect(resolveGeneAlias("PD-L1")).toBe("CD274");
    expect(resolveGeneAlias("PDL1")).toBe("CD274");
    expect(resolveGeneAlias("PDL-1")).toBe("CD274");
    expect(resolveGeneAlias("B7-H1")).toBe("CD274");
  });

  it("resolves TP53 from P53", () => {
    expect(resolveGeneAlias("P53")).toBe("TP53");
  });

  it("resolves CDKN2A from multiple aliases (P16, INK4A, ARF, P14)", () => {
    expect(resolveGeneAlias("P16")).toBe("CDKN2A");
    expect(resolveGeneAlias("INK4A")).toBe("CDKN2A");
    expect(resolveGeneAlias("ARF")).toBe("CDKN2A");
    expect(resolveGeneAlias("P14")).toBe("CDKN2A");
  });

  it("resolves haematology aliases (FLT-3, JAK-2, NPM)", () => {
    expect(resolveGeneAlias("FLT-3")).toBe("FLT3");
    expect(resolveGeneAlias("JAK-2")).toBe("JAK2");
    expect(resolveGeneAlias("NPM")).toBe("NPM1");
    expect(resolveGeneAlias("AML1")).toBe("RUNX1");
  });

  it("resolves previous symbols to the HGNC-approved MRTF names", () => {
    // HGNC renamed MKL1 → MRTFA and MKL2 → MRTFB in 2019.
    expect(resolveGeneAlias("MKL1")).toBe("MRTFA");
    expect(resolveGeneAlias("MKL2")).toBe("MRTFB");
    expect(resolveGeneAlias("MAL")).toBe("MRTFA");
  });

  it("keeps approved MRTF symbols unchanged (regression: they were reversed)", () => {
    expect(resolveGeneAlias("MRTFA")).toBe("MRTFA");
    expect(resolveGeneAlias("MRTFB")).toBe("MRTFB");
  });

  it("resolves the classic AML fusion aliases (EVI1, ETO)", () => {
    expect(resolveGeneAlias("EVI1")).toBe("MECOM");
    expect(resolveGeneAlias("ETO")).toBe("RUNX1T1");
    expect(resolveGeneAlias("AML1")).toBe("RUNX1");
  });

  it("resolves NTRK / TRK family", () => {
    expect(resolveGeneAlias("TRKA")).toBe("NTRK1");
    expect(resolveGeneAlias("TRKB")).toBe("NTRK2");
    expect(resolveGeneAlias("TRKC")).toBe("NTRK3");
    expect(resolveGeneAlias("TRK")).toBe("NTRK1");
  });

  it("does not mutate input", () => {
    const input = "her2";
    resolveGeneAlias(input);
    expect(input).toBe("her2");
  });

  it("handles numeric input gracefully", () => {
    expect(resolveGeneAlias(123)).toBe("123");
  });
});

describe("aliasesForSymbol", () => {
  it("returns all known aliases for ERBB2", () => {
    const aliases = aliasesForSymbol("ERBB2");
    expect(aliases).toEqual(expect.arrayContaining(["HER2", "HER-2", "NEU"]));
  });

  it("is case-insensitive", () => {
    expect(aliasesForSymbol("erbb2")).toEqual(aliasesForSymbol("ERBB2"));
  });

  it("returns empty array for a symbol with no aliases", () => {
    expect(aliasesForSymbol("BRCA1")).toEqual([]);
  });

  it("returns CDKN2A's four aliases", () => {
    const aliases = aliasesForSymbol("CDKN2A");
    expect(aliases).toEqual(
      expect.arrayContaining(["P16", "INK4A", "ARF", "P14"])
    );
    expect(aliases).toHaveLength(4);
  });

  it("returns CD274's aliases (PD-L1 family)", () => {
    const aliases = aliasesForSymbol("CD274");
    expect(aliases).toEqual(
      expect.arrayContaining(["PD-L1", "PDL1", "B7-H1", "PDL-1"])
    );
  });
});

describe("GENE_ALIASES integrity", () => {
  it("every alias value is a non-empty string", () => {
    for (const [key, value] of Object.entries(GENE_ALIASES)) {
      expect(typeof value, `alias ${key}`).toBe("string");
      expect(value.length, `alias ${key}`).toBeGreaterThan(0);
    }
  });

});
