import {
  Dna,
  FlaskConical,
  Activity,
  ShieldCheck,
  Beaker,
} from "lucide-react";
import _allPanels from "./panels.json";

export const painels = _allPanels.filter(
  (p) => p.categoria !== "Farmacogenómica"
);

export const categoryColors = {
  "Somático":        "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  "RNA":             "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  "Hematologia":     "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Germinativo":     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Farmacogenómica": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

// Strategy classification per the reference document — a secondary axis
// that captures *how* the panel is used (focused vs comprehensive vs
// fusion-focused), independent of the gene-category axis above.
export const strategyLabels = {
  "focused":          "Focado",
  "comprehensive":    "Compreensivo",
  "fusion-focused":   "Fusão",
  "hematology":       "Hematologia · ADN",
  "germline":         "Germinativo",
  "pharmacogenomic":  "Farmacogenómica",
};

export const strategyColors = {
  "focused":          "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  "comprehensive":    "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  "fusion-focused":   "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  "hematology":       "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "germline":         "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "pharmacogenomic":  "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

export const iconByCategory = {
  "Somático":        Dna,
  "RNA":             Activity,
  "Hematologia":     FlaskConical,
  "Germinativo":     ShieldCheck,
  "Farmacogenómica": Beaker,
};

export const categoryOrder = [
  "Todos",
  "Somático",
  "RNA",
  "Hematologia",
  "Germinativo",
  "Farmacogenómica",
];

export const DOMAIN_GROUPS = {
  "Somático":        "oncologia-solida",
  "RNA":             "oncologia-solida",
  "Hematologia":     "hematologia",
  "Germinativo":     "germinativo",
  "Farmacogenómica": "pgx",
};

export const DOMAIN_LABELS = {
  "oncologia-solida": "Oncologia tumores sólidos",
  "hematologia":      "Hematologia",
  "germinativo":      "Germinativo",
  "pgx":              "Farmacogenómica",
};

export function getPanelDomain(panel) {
  return DOMAIN_GROUPS[panel.categoria] || "outro";
}
