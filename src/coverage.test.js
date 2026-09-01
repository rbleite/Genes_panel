import { describe, it, expect } from "vitest";
import {
  getGeneCoverage,
  hasCoverageData,
  describeLevel,
  coverageMeta,
  COVERAGE_LEVELS,
} from "./coverage.js";
import _coverageData from "./geneCoverage.json";

const PANEL = "dna-tumores-solidos";

describe("hasCoverageData", () => {
  it("is true for the panel with curated coverage", () => {
    expect(hasCoverageData(PANEL)).toBe(true);
  });

  it("is false for panels without curated coverage", () => {
    expect(hasCoverageData("dna-alargado")).toBe(false);
    expect(hasCoverageData("fusoes-rna")).toBe(false);
  });

  it("is false for missing or empty input", () => {
    expect(hasCoverageData(undefined)).toBe(false);
    expect(hasCoverageData("")).toBe(false);
  });
});

describe("getGeneCoverage — basic contract", () => {
  it("returns null for unknown gene", () => {
    expect(getGeneCoverage("NOT_A_GENE", PANEL)).toBeNull();
  });

  it("returns null for unknown panel", () => {
    expect(getGeneCoverage("TP53", "no-such-panel")).toBeNull();
  });

  it("returns null for missing arguments", () => {
    expect(getGeneCoverage(null, PANEL)).toBeNull();
    expect(getGeneCoverage("TP53", null)).toBeNull();
  });

  it("attaches presentation metadata for a known level", () => {
    const c = getGeneCoverage("TP53", PANEL);
    expect(c.presentation).toBeTruthy();
    expect(c.presentation.short).toBe(COVERAGE_LEVELS["cds-completo"].short);
  });

  it("trims whitespace around the gene symbol", () => {
    expect(getGeneCoverage("  TP53  ", PANEL).nivel).toBe("cds-completo");
  });
});

describe("getGeneCoverage — alias resolution", () => {
  it("resolves HER2 to the ERBB2 entry", () => {
    expect(getGeneCoverage("HER2", PANEL)).toEqual(getGeneCoverage("ERBB2", PANEL));
  });

  it("resolves p53 to the TP53 entry", () => {
    expect(getGeneCoverage("P53", PANEL)).toEqual(getGeneCoverage("TP53", PANEL));
  });
});

describe("coverage levels — clinically critical cases", () => {
  it("TERT is promoter-restricted and names both hotspots", () => {
    const c = getGeneCoverage("TERT", PANEL);
    expect(c.nivel).toBe("promotor");
    expect(c.regioes).toContain("C228T");
    expect(c.regioes).toContain("C250T");
    expect(c.presentation.attention).toBe(true);
  });

  it("RHEB is covered by probes but flagged as not clinically reported", () => {
    const c = getGeneCoverage("RHEB", PANEL);
    expect(c.nivel).toBe("nao-reportado");
    expect(c.nota).toMatch(/não reportado/i);
    expect(c.presentation.attention).toBe(true);
  });

  it("fusion-partner-only genes warn that point mutations are not detected", () => {
    for (const gene of ["CD74", "ETV6", "EZR", "SDC4"]) {
      const c = getGeneCoverage(gene, PANEL);
      expect(c.nivel, gene).toBe("parceiro-fusao");
      expect(c.nota, gene).toMatch(/NÃO detecta mutações pontuais/i);
      expect(c.presentation.attention, gene).toBe(true);
    }
  });

  it("POLE lists the exonuclease-domain exons", () => {
    const c = getGeneCoverage("POLE", PANEL);
    expect(c.nivel).toBe("exoes-dirigidos");
    // P286R sits in exon 9, V411L in exon 13
    expect(c.regioes).toMatch(/EX9\b/);
    expect(c.regioes).toMatch(/\b13\b/);
    expect(c.transcrito).toBe("NM_006231.2");
  });

  it("MET carries the intron 13-14 coverage that enables exon 14 skipping detection", () => {
    const c = getGeneCoverage("MET", PANEL);
    expect(c.nivel).toBe("cds-completo-fusao");
    expect(c.regioes).toMatch(/13-14/);
  });

  it("genes upgraded to full CDS are recorded as such", () => {
    for (const gene of ["AKT1", "NRAS", "ESR1", "AR", "BRAF"]) {
      const c = getGeneCoverage(gene, PANEL);
      expect(c.nivel, gene).toBe("cds-completo");
      expect(c.nota, gene).toMatch(/upgrade/i);
    }
  });

  it("NRG1 is present as a newly added gene", () => {
    const c = getGeneCoverage("NRG1", PANEL);
    expect(c.nivel).toBe("exoes-dirigidos");
    expect(c.nota).toMatch(/adicionado/i);
  });

  it("hotspot-directed genes match the vendor specification", () => {
    expect(getGeneCoverage("KIT", PANEL).regioes).toMatch(/9-18/);
    expect(getGeneCoverage("PDGFRA", PANEL).regioes).toMatch(/12-18/);
    expect(getGeneCoverage("IDH1", PANEL).regioes).toMatch(/\b4\b/);
  });
});

describe("data file integrity", () => {
  const genes = _coverageData[PANEL];

  it("declares meta, version and disclaimer", () => {
    expect(coverageMeta.version).toBeTruthy();
    expect(coverageMeta.disclaimer).toMatch(/não exclui/i);
  });

  it("every gene uses a level that exists in COVERAGE_LEVELS", () => {
    for (const [gene, entry] of Object.entries(genes)) {
      expect(COVERAGE_LEVELS[entry.nivel], `${gene} → ${entry.nivel}`).toBeTruthy();
    }
  });

  it("every level used has a legend entry in the data file", () => {
    for (const [gene, entry] of Object.entries(genes)) {
      expect(describeLevel(entry.nivel), `${gene} → ${entry.nivel}`).not.toBe("");
    }
  });

  it("only sem-detalhe entries may omit the covered regions", () => {
    for (const [gene, entry] of Object.entries(genes)) {
      if (entry.nivel !== "sem-detalhe") {
        expect(entry.regioes, `${gene}`).toBeTruthy();
      }
    }
  });

  it("covers every gene listed in the panel plus the unreported one", () => {
    // 188 clinically reported genes + RHEB (probe coverage, not reported)
    expect(Object.keys(genes)).toHaveLength(189);
  });
});
