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
  });

  it("keeps approved MRTF symbols unchanged (regression: they were reversed)", () => {
    expect(resolveGeneAlias("MRTFA")).toBe("MRTFA");
    expect(resolveGeneAlias("MRTFB")).toBe("MRTFB");
  });

  it("does not hijack MAL, an approved gene of its own", () => {
    // "MAL" used to map to MKL1/MRTFA, redirecting searches for the real
    // MAL gene (T-cell differentiation protein) to a different gene.
    expect(resolveGeneAlias("MAL")).toBe("MAL");
  });

  it("resolves HGNC-renamed panel genes from their previous symbols", () => {
    expect(resolveGeneAlias("H3F3A")).toBe("H3-3A");   // H3 K27M gliomas
    expect(resolveGeneAlias("MLL3")).toBe("KMT2C");
    expect(resolveGeneAlias("MRE11A")).toBe("MRE11");
    expect(resolveGeneAlias("WHSC1")).toBe("NSD2");
    expect(resolveGeneAlias("PARK2")).toBe("PRKN");
    expect(resolveGeneAlias("MTRNR1")).toBe("MT-RNR1");
  });

  it("maps the KMT2 family as the panels use it", () => {
    // MLL2 → KMT2D is an HGNC previous symbol and matches the vendor's own
    // pairing "KMT2D (MLL2) NM_003482.3". MLL4 is an HGNC alias of both
    // KMT2B and KMT2D; KMT2B is inferred because the 1021 panel lists MLL2
    // and MLL4 as distinct genes alongside MLL (KMT2A) and MLL3 (KMT2C).
    expect(resolveGeneAlias("MLL")).toBe("KMT2A");
    expect(resolveGeneAlias("MLL2")).toBe("KMT2D");
    expect(resolveGeneAlias("MLL4")).toBe("KMT2B");
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
