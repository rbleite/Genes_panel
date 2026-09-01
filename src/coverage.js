import _coverageData from "./geneCoverage.json";
import { resolveGeneAlias } from "./geneAliases.js";

export const coverageMeta = _coverageData._meta;

/**
 * Visual and textual presentation for each coverage level.
 * `short` is the chip label; `title` is the tooltip / detail heading.
 * `attention` marks levels that carry a real risk of a misread negative
 * result — the UI uses it to decide whether to surface a warning.
 */
export const COVERAGE_LEVELS = {
  "cds-completo": {
    short: "CDS completo",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    attention: false,
  },
  "cds-completo-fusao": {
    short: "CDS completo + fusões",
    dot: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    attention: false,
  },
  "exoes-dirigidos": {
    short: "Exões dirigidos",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    attention: true,
  },
  "parceiro-fusao": {
    short: "Só parceiro de fusão",
    dot: "bg-orange-600",
    chip: "bg-orange-50 text-orange-800 ring-1 ring-orange-300",
    attention: true,
  },
  promotor: {
    short: "Promotor (posições específicas)",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    attention: true,
  },
  "nao-reportado": {
    short: "Não reportado",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-300",
    attention: true,
  },
  "sem-detalhe": {
    short: "Detalhe indisponível",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-300",
    attention: false,
  },
};

/**
 * Coverage detail for a gene within a panel.
 * Resolves HGNC aliases so that "HER2" finds the ERBB2 entry.
 * Returns null when the panel has no curated coverage data at all, or
 * when the gene is not part of that panel.
 */
export function getGeneCoverage(gene, panelId) {
  if (!gene || !panelId) return null;
  const panel = _coverageData[panelId];
  if (!panel) return null;

  const raw = String(gene).trim();
  const entry = panel[raw] || panel[resolveGeneAlias(raw)];
  if (!entry) return null;

  return { ...entry, presentation: COVERAGE_LEVELS[entry.nivel] || null };
}

/** True when the panel has curated coverage data. */
export function hasCoverageData(panelId) {
  return Boolean(panelId && _coverageData[panelId]);
}

/** Legend text for a level, taken from the data file (single source of truth). */
export function describeLevel(nivel) {
  return coverageMeta?.legenda?.[nivel] || "";
}
