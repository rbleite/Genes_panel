/**
 * HGNC-approved symbol aliases used in clinical oncology/haematology.
 * Keys are common aliases (case-insensitive lookup); values are official HGNC symbols.
 * Source: HGNC database + ESMO/NCCN guideline nomenclature.
 */
export const GENE_ALIASES = {
  // ── Receptor tyrosine kinases / growth factors ─────────────────────────
  "HER2":       "ERBB2",
  "HER-2":      "ERBB2",
  "NEU":        "ERBB2",
  "HER1":       "EGFR",
  "EGFR1":      "EGFR",
  "HER3":       "ERBB3",
  "HER4":       "ERBB4",
  "C-KIT":      "KIT",
  "CKIT":       "KIT",
  "SCF-R":      "KIT",
  "C-MET":      "MET",
  "CMET":       "MET",
  "HGFR":       "MET",
  "PDGFR-A":    "PDGFRA",
  "PDGFR-ALPHA":"PDGFRA",
  "PDGFR-B":    "PDGFRB",
  "PDGFR-BETA": "PDGFRB",
  "FGFR-1":     "FGFR1",
  "FGFR-2":     "FGFR2",
  "FGFR-3":     "FGFR3",
  "FGFR-4":     "FGFR4",
  "ROS-1":      "ROS1",
  "ALK-1":      "ALK",
  "RET":        "RET",

  // ── NTRK / TRK family ───────────────────────────────────────────────────
  "TRKA":       "NTRK1",
  "TRKB":       "NTRK2",
  "TRKC":       "NTRK3",
  "NTRK-1":     "NTRK1",
  "NTRK-2":     "NTRK2",
  "NTRK-3":     "NTRK3",
  "TRK":        "NTRK1",   // generic — resolves to NTRK1; context clarifies

  // ── RAS / RAF / MAPK ────────────────────────────────────────────────────
  "K-RAS":      "KRAS",
  "KRAS2":      "KRAS",
  "RASK":       "KRAS",
  "N-RAS":      "NRAS",
  "H-RAS":      "HRAS",

  // ── Cell cycle / tumour suppressors ─────────────────────────────────────
  "P53":        "TP53",
  "P16":        "CDKN2A",
  "INK4A":      "CDKN2A",
  "ARF":        "CDKN2A",
  "P14":        "CDKN2A",
  "P21":        "CDKN1A",
  "WAF1":       "CDKN1A",
  "CIP1":       "CDKN1A",
  "P27":        "CDKN1B",
  "KIP1":       "CDKN1B",
  "RB":         "RB1",
  "RB-1":       "RB1",
  "MDM-2":      "MDM2",

  // ── MYC family ──────────────────────────────────────────────────────────
  "C-MYC":      "MYC",
  "CMYC":       "MYC",
  "N-MYC":      "MYCN",
  "NMYC":       "MYCN",

  // ── BCL / apoptosis ─────────────────────────────────────────────────────
  "BCL-2":      "BCL2",
  "BCL-6":      "BCL6",
  "BCL-10":     "BCL10",

  // ── ABL / BCR-ABL ───────────────────────────────────────────────────────
  "ABL":        "ABL1",
  "C-ABL":      "ABL1",
  "CABL":       "ABL1",

  // ── Haematology-specific ─────────────────────────────────────────────────
  "FLT-3":      "FLT3",
  "JAK-2":      "JAK2",
  "NPM-1":      "NPM1",
  "NPM":        "NPM1",
  "IDH-1":      "IDH1",
  "IDH-2":      "IDH2",
  "EZH-2":      "EZH2",
  "ASXL-1":     "ASXL1",
  "DNMT3-A":    "DNMT3A",
  "RUNX-1":     "RUNX1",
  "AML1":       "RUNX1",
  "SF3B-1":     "SF3B1",
  "CALR":       "CALR",
  "MPL":        "MPL",
  "NOTCH-1":    "NOTCH1",
  "IKZF-1":     "IKZF1",
  "IKAROS":     "IKZF1",

  // ── MMR / Lynch ─────────────────────────────────────────────────────────
  "MLH-1":      "MLH1",
  "MSH-2":      "MSH2",
  "MSH-6":      "MSH6",
  "PMS-2":      "PMS2",

  // ── HRR / BRCA pathway ──────────────────────────────────────────────────
  "CHEK-2":     "CHEK2",
  "CHK2":       "CHEK2",
  "PALB-2":     "PALB2",
  "RAD51-C":    "RAD51C",
  "RAD51-D":    "RAD51D",
  "BRIP-1":     "BRIP1",

  // ── Immune checkpoint / immunotherapy ───────────────────────────────────
  "PD-L1":      "CD274",
  "PDL1":       "CD274",
  "B7-H1":      "CD274",
  "PD-1":       "PDCD1",
  "PDL-1":      "CD274",
  "CTLA-4":     "CTLA4",
  "CD20":       "MS4A1",

  // ── Endocrine / other ───────────────────────────────────────────────────
  "ER":         "ESR1",   // Estrogen receptor — use with care (short alias)
  "PR":         "PGR",    // Progesterone receptor
  "AR":         "AR",
  "MEN-1":      "MEN1",
  "SDH-A":      "SDHA",
  "SDH-B":      "SDHB",
  "SDH-C":      "SDHC",
  "SDH-D":      "SDHD",
  "VHL":        "VHL",
  "NF-1":       "NF1",
  "NF-2":       "NF2",
  "STK-11":     "STK11",
  "LKB1":       "STK11",
  "PTEN":       "PTEN",
  "PIK3-CA":    "PIK3CA",
  "CDK-4":      "CDK4",
  "CDK-6":      "CDK6",
  "CDK-12":     "CDK12",
  "TMEM-127":   "TMEM127",
};

const _upperMap = Object.fromEntries(
  Object.entries(GENE_ALIASES).map(([k, v]) => [k.toUpperCase(), v])
);

/**
 * Returns the official HGNC symbol for a gene alias, or the original term
 * (uppercased) if no alias is found.
 */
export function resolveGeneAlias(term) {
  if (!term) return "";
  const upper = String(term).toUpperCase().trim();
  return _upperMap[upper] || upper;
}

/**
 * Returns all aliases that point to a given official symbol (for reverse lookup).
 */
export function aliasesForSymbol(symbol) {
  const upper = String(symbol).toUpperCase();
  return Object.entries(GENE_ALIASES)
    .filter(([, v]) => v.toUpperCase() === upper)
    .map(([k]) => k);
}
