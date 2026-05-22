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
