
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Dna,
  FlaskConical,
  Activity,
  ShieldCheck,
  Beaker,
  ChevronRight,
  TestTube2,
  Database,
  Layers3,
  Sparkles,
  Copy,
  Filter,
  FileJson,
  FileSpreadsheet,
  Check,
  Wand2,
  PanelRight,
  ChevronsUpDown,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCcw,
  X,
  GitCompare,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from "lucide-react";

import _allPanels from "./panels.json";
import clinicalRules from "./clinicalRules.json";
import { recommendByRules } from "./ruleEngine";
import { resolveGeneAlias } from "./geneAliases";
import institutionalLogo from "./assets/ulsas-logo.png";

const APP_VERSION = "1.0.0";

const painels = _allPanels.filter(p => p.categoria !== "Farmacogenómica");


const categoryColors = {
  "Somático": "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  "RNA": "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  "Hematologia": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Germinativo": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Farmacogenómica": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

const iconByCategory = {
  "Somático": Dna,
  "RNA": Activity,
  "Hematologia": FlaskConical,
  "Germinativo": ShieldCheck,
  "Farmacogenómica": Beaker,
};

const order = ["Todos", "Somático", "RNA", "Hematologia", "Germinativo", "Farmacogenómica"];

const STORAGE_KEY = "gene-panel-builder-selected";

function prettifySectionKey(key) {
  const map = {
    wholeCds: "Whole CDS",
    hotspotsCds: "Hotspots CDS",
    nonCoding: "Non-coding / intrónico",
    pgxComplementar: "PGx complementar",
    fusoesRna: "Painel de fusões RNA",
    coreDnaHemato: "Core hemato DNA",
    dnaFusions: "Fusões em DNA",
    rnaFusionBlood: "RNA blood / rearranjos",
    predisposicaoHereditaria: "Predisposição hereditária",
    wholeExons312: "Cobertura exónica completa (312 genes)",
    fusionBreakpoints38: "Breakpoints de fusão (38 genes)",
    partialExons709: "Cobertura parcial expandida (709 genes)",
    pgxExpandido: "Farmacogenómica expandida",
  };
  return map[key] || key;
}

function uniqueSortedGenes(genes) {
  return [...new Set(genes)].sort((a, b) => a.localeCompare(b));
}


function parseSearchTerms(input) {
  return String(input || "")
    .split(/[;,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function matchesAnySearchTerm(value, terms) {
  const normalized = String(value || "").toLowerCase();
  return terms.some((term) => {
    if (normalized.includes(term)) return true;
    const resolved = resolveGeneAlias(term).toLowerCase();
    return resolved !== term && normalized.includes(resolved);
  });
}

function matchesSearchTerms(value, terms) {
  const normalized = String(value || "").toLowerCase();
  return terms.every((term) => {
    if (normalized.includes(term)) return true;
    const resolved = resolveGeneAlias(term).toLowerCase();
    return resolved !== term && normalized.includes(resolved);
  });
}

function geneMatchesTerm(gene, term) {
  const g = gene.toLowerCase();
  if (g.includes(term)) return true;
  const resolved = resolveGeneAlias(term).toLowerCase();
  return resolved !== term && g.includes(resolved);
}

function buildCsv(rows) {
  const esc = (value) => `"${String(value).replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(esc).join(",")).join("\n");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateJustification(panel) {
  const catLabel = {
    "Somático": "somático (tumor sólido)",
    "RNA": "RNA de fusões",
    "Hematologia": "hematológico",
    "Germinativo": "germinativo",
    "Farmacogenómica": "farmacogenómico",
  }[panel.categoria] || panel.categoria.toLowerCase();

  const isRna = panel.categoria === "RNA";
  const isHemato = panel.categoria === "Hematologia";

  const genePhrase = isRna
    ? `${panel.totalGenes} pares de fusão/rearranjo cobertos, tecnologia ${panel.tecnologia}`
    : `${panel.totalGenes} genes, tecnologia ${panel.tecnologia}`;

  const samples = panel.amostras?.length ? ` Aplicável em: ${panel.amostras.join(", ")}.` : "";

  const markers = panel.biomarcadores?.length
    ? ` Biomarcadores: ${panel.biomarcadores.join(", ")}.`
    : "";

  const msiTmb = panel.capacidade?.msi || panel.capacidade?.tmb
    ? ` Capacidade analítica: MSI ${panel.capacidade?.msi ? "disponível" : "não incluído"}${panel.capacidade?.tmb ? "; TMB disponível (painel alargado — estimativa fiável)" : "; TMB não incluído"}.`
    : "";

  const sectionNames = Object.keys(panel.secoes || {}).map(prettifySectionKey);
  const sections = sectionNames.length
    ? ` Estrutura: ${sectionNames.slice(0, 3).join(", ")}${sectionNames.length > 3 ? " e módulos adicionais" : ""}.`
    : "";

  let contextNote = "";
  if (isRna) {
    contextNote = " A deteção de fusões por RNA é mais sensível do que por ADN para intrões grandes, breakpoints variáveis e parceiros novos; um resultado negativo por ADN não exclui fusão.";
  } else if (isHemato) {
    contextNote = " Painel dedicado a neoplasias hematológicas; não substitui citogenética convencional, FISH ou cariótipo quando clinicamente indicados.";
  } else if (panel.capacidade?.tmb) {
    contextNote = " Indicado quando o TMB é biomarcador relevante de imunoterapia ou quando é necessário perfil genómico compreensivo; valores de TMB de painéis pequenos não são comparáveis.";
  }

  const combo = panel.recommendedCombinations?.[0];
  const comboNote = combo
    ? ` Combinação recomendada com ${combo.label} em: ${combo.contexts.slice(0, 3).join(", ")}.`
    : "";

  return `${panel.nome} é um painel ${catLabel} com ${genePhrase}. ${panel.descricao}${contextNote}${comboNote}${samples}${markers}${msiTmb}${sections}`;
}


const STRUCTURE_FILTERS = [
  "Todos",
  "CDS completo",
  "Hotspot",
  "Fusão",
  "PGx",
  "Não coding",
];


const DOMAIN_GROUPS = {
  "Somático": "oncologia-solida",
  "RNA": "oncologia-solida",
  "Hematologia": "hematologia",
  "Germinativo": "germinativo",
  "Farmacogenómica": "pgx",
};
const DOMAIN_LABELS = {
  "oncologia-solida": "Oncologia tumores sólidos",
  "hematologia": "Hematologia",
  "germinativo": "Germinativo",
  "pgx": "Farmacogenómica",
};
function getPanelDomain(panel) {
  return DOMAIN_GROUPS[panel.categoria] || "outro";
}

function getPanelTumorTypes(panel) {
  return panel.tumorTypes || ["Outros"];
}

function getPanelDiseases(panel) {
  return panel.diseases || [];
}

function getPanelEvidenceAvailability(panel) {
  const summary = { oncokb: "—", clinvar: "—", clinpgx: "—", cpic: "—", civic: "—" };
  (panel.evidenceSources || []).forEach((item) => {
    const key = (item.source || "").toLowerCase();
    if (key === "oncokb") summary.oncokb = item.role;
    if (key === "clinvar") summary.clinvar = item.role;
    if (key === "clinpgx") summary.clinpgx = item.role;
    if (key === "cpic") summary.cpic = item.role;
    if (key === "civic") summary.civic = item.role;
  });
  return summary;
}

function getEvidenceNotes(panel) {
  return panel.evidenceSources || [];
}

function buildEvidenceRows(panel, evidence, gene) {
  const avail = getPanelEvidenceAvailability(panel);
  const rows = [];

  if (avail.oncokb !== "—") {
    rows.push({
      source: "OncoKB",
      status: avail.oncokb,
      summary:
        evidence?.oncokb?.summary ||
        "Disponível para painéis oncológicos; requer variante e tipo tumoral para anotação mais útil.",
      url: evidence?.oncokb?.url || `https://www.oncokb.org/gene/${encodeURIComponent(gene || "")}`,
    });
  }

  rows.push({
    source: "ClinVar",
    status: avail.clinvar,
    summary:
      panel.categoria === "Germinativo"
        ? "Fonte principal para navegação e classificação clínica de variantes germinativas."
        : panel.categoria === "Farmacogenómica"
          ? "Fonte complementar para variantes com classificação clínica publicada."
          : "Fonte complementar quando há ponte com variante constitucional ou contexto clínico relevante.",
    url: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(gene || "")}%5Bgene%5D`,
  });

  if (avail.clinpgx !== "—") {
    rows.push({
      source: "ClinPGx",
      status: avail.clinpgx,
      summary:
        evidence?.clinpgx?.summary ||
        "Disponível para farmacogenómica; idealmente combinar gene com fármaco e fenótipo/metabolizador.",
      url: evidence?.clinpgx?.url || `https://www.clinpgx.org/search?query=${encodeURIComponent(gene || "")}`,
    });
  }

  if (evidence?.civic) {
    rows.push({
      source: "CIViC",
      status: "Complementar",
      summary: evidence.civic.summary || "Base colaborativa de evidência clínica para variantes e fusões.",
      url: evidence.civic.url || `https://civicdb.org/search?query=${encodeURIComponent(gene || "")}`,
    });
  }

  return rows;
}

function getPanelStructureTags(panel) {
  const sec = panel.secoes || {};
  const keys = Object.keys(sec);
  const tags = new Set();

  if (
    keys.some((k) => ["wholeCds", "wholeExons312", "predisposicaoHereditaria", "coreDnaHemato", "pgxExpandido"].includes(k)) ||
    panel.descricao?.toLowerCase().includes("whole cds")
  ) {
    tags.add("CDS completo");
  }

  if (keys.some((k) => ["hotspotsCds", "coreDnaHemato", "partialExons709"].includes(k))) {
    tags.add("Hotspot");
  }

  if (keys.some((k) => ["dnaFusions", "fusoesRna", "rnaFusionBlood", "fusionBreakpoints38"].includes(k)) ||
      panel.tags?.some((t) => String(t).toLowerCase().includes("fusão"))) {
    tags.add("Fusão");
  }

  if (keys.some((k) => ["pgxComplementar", "pgxExpandido"].includes(k)) || panel.categoria === "Farmacogenómica") {
    tags.add("PGx");
  }

  if (keys.includes("nonCoding") || panel.descricao?.toLowerCase().includes("não codificantes") || panel.descricao?.toLowerCase().includes("non-coding")) {
    tags.add("Não coding");
  }

  return Array.from(tags);
}

function buildEvidenceLinks(gene, category) {
  const encoded = encodeURIComponent(gene);
  const base = [
    { label: "NCBI Gene", url: `https://www.ncbi.nlm.nih.gov/gene/?term=${encoded}%5Bgene%5D` },
  ];

  if (category === "Farmacogenómica") {
    return [
      { label: "PharmGKB", url: `https://www.pharmgkb.org/search?query=${encoded}` },
      { label: "CPIC", url: `https://cpicpgx.org/search/${encoded}` },
      ...base,
    ];
  }

  if (category === "Germinativo") {
    return [
      { label: "ClinVar", url: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encoded}%5Bgene%5D` },
      ...base,
    ];
  }

  return [
    { label: "OncoKB", url: `https://www.oncokb.org/gene/${encoded}` },
    { label: "CIViC", url: `https://civicdb.org/search?query=${encoded}` },
    ...base,
  ];
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request falhou (${res.status})`);
  }
  return data;
}

function EvidencePanel({ panel, gene, loading, error, evidence, alteration, setAlteration, tumorType, setTumorType, onRun }) {
  const links = gene ? buildEvidenceLinks(gene, panel.categoria) : [];
  const evidenceRows = gene ? buildEvidenceRows(panel, evidence, gene) : [];

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Database className="h-4 w-4" />
        Evidência por gene
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Clica num gene nas secções abaixo para carregar evidência. Para OncoKB, a anotação programática fica muito mais útil quando indicas também variante proteica e tipo tumoral.
      </p>

      {!gene ? (
        <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          Nenhum gene selecionado ainda.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3.5">
            <span className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white">{gene}</span>
            {links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          {panel.categoria !== "Farmacogenómica" && panel.categoria !== "Germinativo" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Alteração proteica</div>
                <input value={alteration} onChange={(e) => setAlteration(e.target.value)} placeholder="Ex.: V600E" className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </label>
              <label className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Tipo tumoral</div>
                <input value={tumorType} onChange={(e) => setTumorType(e.target.value)} placeholder="Ex.: Lung Adenocarcinoma" className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </label>
            </div>
          ) : null}

          <div className="mt-4">
            <button onClick={onRun} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "A procurar…" : "Pesquisar evidência"}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span></div>
            </div>
          ) : null}

          {evidence ? (
            <div className="mt-4 space-y-3">
              {evidence.mode === "germline-links" ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                  Para germinativo, deixei por agora a navegação externa preparada. O próximo passo lógico seria ligar ClinVar/ClinGen com um endpoint dedicado.
                </div>
              ) : null}

              {evidence.clinpgx ? (
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">ClinPGx</div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">PGx</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{evidence.clinpgx.summary || "Sem resumo devolvido pelo endpoint."}</p>
                  {evidence.clinpgx.url ? <a href={evidence.clinpgx.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 underline underline-offset-2">Abrir origem <ExternalLink className="h-4 w-4" /></a> : null}
                </div>
              ) : null}

              {evidence.civic ? (
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">CIViC</div>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">GraphQL</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{evidence.civic.summary || "Sem resumo devolvido pelo endpoint."}</p>
                  {typeof evidence.civic.evidenceItemCount === "number" ? <p className="mt-2 text-xs text-slate-500">Evidence items: {evidence.civic.evidenceItemCount}</p> : null}
                  {evidence.civic.url ? <a href={evidence.civic.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 underline underline-offset-2">Abrir origem <ExternalLink className="h-4 w-4" /></a> : null}
                </div>
              ) : null}

              {evidence.oncokb ? (
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">OncoKB</div>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Token</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{evidence.oncokb.summary || "Sem resumo devolvido pelo endpoint."}</p>
                  {evidence.oncokb.highestSensitiveLevel ? <p className="mt-2 text-xs text-slate-500">Nível sensível mais alto: {evidence.oncokb.highestSensitiveLevel}</p> : null}
                  {evidence.oncokb.url ? <a href={evidence.oncokb.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 underline underline-offset-2">Abrir origem <ExternalLink className="h-4 w-4" /></a> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Base</th>
                    <th className="px-4 py-3 font-semibold">Papel</th>
                    <th className="px-4 py-3 font-semibold">Resumo</th>
                    <th className="px-4 py-3 font-semibold">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidenceRows.map((row) => (
                    <tr key={row.source}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.source}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{row.status}</span></td>
                      <td className="px-4 py-3 text-slate-600">{row.summary}</td>
                      <td className="px-4 py-3">
                        <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 underline underline-offset-2">
                          Abrir
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function GeneBadge({ gene, highlighted = false, category, compact = false, onInspect }) {
  const links = buildEvidenceLinks(gene, category);
  const primary = links[0];
  return (
    <span className={`inline-flex min-h-[42px] items-center gap-2.5 rounded-[20px] px-2.5 py-2 text-xs font-medium ring-1 transition ${highlighted ? "bg-indigo-50 text-indigo-700 ring-indigo-200" : compact ? "bg-white text-slate-700 ring-slate-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      <button type="button" onClick={() => onInspect?.(gene)} className="rounded-full px-2 py-1 text-left leading-none hover:bg-black/5">
        {gene}
      </button>
      <a href={primary.url} target="_blank" rel="noreferrer" title={`Abrir ${gene} em ${primary.label}`} className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] leading-none opacity-90 hover:bg-black/10">
        {primary.label}
        <ExternalLink className="h-3 w-3" />
      </a>
    </span>
  );
}

function SectionBlock({ title, genes, activeQuery, initialOpen = false, category, onInspect }) {
  const [open, setOpen] = useState(initialOpen);
  const [expanded, setExpanded] = useState(false);
  const searchTerms = useMemo(() => parseSearchTerms(activeQuery), [activeQuery]);
  const filtered = useMemo(() => {
    if (!searchTerms.length) return genes;
    return genes.filter((g) => matchesAnySearchTerm(g, searchTerms));
  }, [genes, searchTerms]);

  const PREVIEW_LIMIT = 16;
  const visible = expanded ? filtered : filtered.slice(0, PREVIEW_LIMIT);
  const hidden = Math.max(0, filtered.length - PREVIEW_LIMIT);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-sm text-slate-500">
            {genes.length} genes{activeQuery ? ` • ${filtered.length} correspondências` : ""}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700">
          {open ? "Ocultar" : "Ver genes"}
          <ChevronsUpDown className="h-4 w-4" />
        </span>
      </button>

      {open ? (
        <div className="mt-5 flex flex-wrap gap-3.5">
          {filtered.length === 0 ? (
            <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              Sem genes desta secção a corresponder ao filtro atual
            </span>
          ) : (
            <>
              {visible.map((gene) => (
                <GeneBadge key={gene} gene={gene} category={category} highlighted={matchesAnySearchTerm(gene, searchTerms)} onInspect={onInspect} />
              ))}
              {!expanded && hidden > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                  className="rounded-2xl bg-slate-900 px-3.5 py-1.5 text-xs font-medium leading-none text-white hover:bg-slate-800 transition"
                >
                  +{hidden} restantes — ver todos
                </button>
              ) : null}
              {expanded && hidden > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className="rounded-2xl border border-slate-200 px-3.5 py-1.5 text-xs font-medium leading-none text-slate-600 hover:bg-slate-50 transition"
                >
                  Mostrar menos
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({ icon: Icon, children, onClick, title, variant, bold }) {
  const styles = {
    default: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    red: "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
    blue: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100",
    green: "border-emerald-300 bg-emerald-100 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-200",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm transition ${bold ? "font-bold" : "font-medium"} ${styles[variant] || styles.default}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

/* ─────────────────── Clinical Export Modal ─────────────────── */
function buildContextualJustification(panel, indication, specificGenes, date) {
  const sep = "─".repeat(60);
  const msiTmb = [];
  if (panel.capacidade?.msi) msiTmb.push("avaliação de MSI");
  if (panel.capacidade?.tmb) msiTmb.push("estimativa de TMB (painel alargado — estimativa fiável)");

  const genesLine = specificGenes.trim()
    ? `Genes de interesse específico: ${specificGenes.trim()}.`
    : "";

  const combo = panel.recommendedCombinations?.[0];
  const comboLine = combo && indication.strength === "componente de combinação"
    ? `Nota de combinação: ${combo.label} — ${combo.rationale}`
    : "";

  const limitations = (panel.limitations || []).map(l => `  • ${l}`).join("\n");

  return [
    `JUSTIFICAÇÃO DE PEDIDO NGS — ${date}`,
    sep,
    `Painel:      ${panel.nome}`,
    `Tecnologia:  ${panel.tecnologia}`,
    `Amostras:    ${panel.amostras?.join(", ") || "—"}`,
    sep,
    `CONTEXTO CLÍNICO`,
    `Indicação:   ${indication.tumor}`,
    `Força:       ${indication.strength}`,
    "",
    `RACIONAL CLÍNICO`,
    indication.rationale,
    genesLine,
    msiTmb.length ? `Capacidades adicionais: ${msiTmb.join("; ")}.` : "",
    comboLine,
    sep,
    limitations ? `LIMITAÇÕES ANALÍTICAS\n${limitations}` : "",
    sep,
    "Este documento é um guia orientador de apoio à decisão clínica.",
    "A seleção final deve seguir as guidelines vigentes (ESMO, NCCN),",
    "a adequação da amostra e prévia discussão em reunião multidisciplinar.",
    "",
    "Patologia molecular — Serviço de Anatomia Patológica, ULS Almada-Seixal",
  ].filter(Boolean).join("\n");
}

function ClinicalExportModal({ open, onClose, panel, date }) {
  const [selectedIndication, setSelectedIndication] = useState(null);
  const [specificGenes, setSpecificGenes] = useState("");
  const [copied, setCopied] = useState(false);

  const indications = panel?.clinicalIndications || [];

  useEffect(() => {
    setSelectedIndication(null);
    setSpecificGenes("");
    setCopied(false);
  }, [panel?.id]);

  const indication = indications.find(i => i.tumor === selectedIndication) || null;

  const text = useMemo(() => {
    if (!panel || !indication) return "";
    return buildContextualJustification(panel, indication, specificGenes, date);
  }, [panel, indication, specificGenes, date]);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    downloadFile(text, `justificacao-ngs-${panel?.id || "painel"}.txt`, "text/plain;charset=utf-8");
  }

  return (
    <Modal open={open} onClose={onClose} title="Justificação clínica NGS" icon={FileSpreadsheet} wide>
      <p className="text-sm text-slate-600 leading-6 mb-5">
        Seleciona o contexto clínico para gerar texto de justificação adaptado ao pedido.
      </p>

      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">Contexto clínico / indicação</div>
        <div className="flex flex-wrap gap-2">
          {indications.map((ind) => (
            <button
              key={ind.tumor}
              onClick={() => setSelectedIndication(selectedIndication === ind.tumor ? null : ind.tumor)}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${selectedIndication === ind.tumor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {ind.tumor}
              {ind.strength === "primeira linha" && <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">1ª</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedIndication && (
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
            Genes de interesse (opcional)
          </label>
          <input
            value={specificGenes}
            onChange={(e) => setSpecificGenes(e.target.value)}
            placeholder="Ex.: EGFR, ALK, ROS1"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          />
        </div>
      )}

      {indication && text ? (
        <>
          <div className="relative mb-1">
            <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 pr-12 text-xs leading-6 text-slate-700 overflow-auto max-h-[50vh] font-mono">
              {text}
            </pre>
            <button
              onClick={handleCopy}
              title="Copiar justificação"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button onClick={handleDownload} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Guardar .txt
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          Seleciona uma indicação clínica acima para gerar o texto de justificação.
        </div>
      )}
    </Modal>
  );
}

/* ─────────────────── Modal shell ─────────────────── */
function Modal({ open, onClose, title, icon: Icon, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative mt-4 w-full rounded-[24px] border border-slate-200 bg-white shadow-2xl sm:mt-8 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────── Panel Comparator ─────────────────── */
function PanelComparator({ open, onClose }) {
  const [picked, setPicked] = useState([]);

  function toggle(id) {
    setPicked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]);
  }

  const pickedPanels = useMemo(() => painels.filter((p) => picked.includes(p.id)), [picked]);

  const genesSets = useMemo(() => {
    return pickedPanels.map((p) => ({ id: p.id, nome: p.nome, set: new Set(p.genes) }));
  }, [pickedPanels]);

  const intersection = useMemo(() => {
    if (genesSets.length < 2) return [];
    let common = new Set(genesSets[0].set);
    for (let i = 1; i < genesSets.length; i++) {
      common = new Set([...common].filter((g) => genesSets[i].set.has(g)));
    }
    return [...common].sort();
  }, [genesSets]);

  const exclusives = useMemo(() => {
    if (genesSets.length < 2) return {};
    const result = {};
    genesSets.forEach((gs) => {
      const others = genesSets.filter((o) => o.id !== gs.id);
      const othersUnion = new Set(others.flatMap((o) => [...o.set]));
      result[gs.id] = [...gs.set].filter((g) => !othersUnion.has(g)).sort();
    });
    return result;
  }, [genesSets]);

  // overlap matrix
  const overlapMatrix = useMemo(() => {
    return painels.map((a) => {
      const setA = new Set(a.genes);
      return painels.map((b) => {
        if (a.id === b.id) return a.totalGenes;
        const setB = new Set(b.genes);
        return [...setA].filter((g) => setB.has(g)).length;
      });
    });
  }, []);

  const crossDomainWarning = useMemo(() => {
    if (pickedPanels.length < 2) return null;
    const domains = [...new Set(pickedPanels.map(getPanelDomain))];
    if (domains.length === 1) return null;
    return domains.map((d) => DOMAIN_LABELS[d] || d).join(" vs ");
  }, [pickedPanels]);

  const recCombo = useMemo(() => {
    if (pickedPanels.length < 2) return null;
    for (const p of pickedPanels) {
      for (const combo of (p.recommendedCombinations || [])) {
        const partner = pickedPanels.find((q) => q.id === combo.with);
        if (partner) return { panel: p, combo, partner };
      }
    }
    return null;
  }, [pickedPanels]);

  return (
    <Modal open={open} onClose={onClose} title="Comparar painéis" icon={GitCompare} wide>
      <p className="text-sm text-slate-600 leading-6 mb-5">Seleciona 2 ou 3 painéis para comparar genes em comum, genes exclusivos e capacidades.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {painels.map((p) => {
          const isOn = picked.includes(p.id);
          const Icon = iconByCategory[p.categoria] || Dna;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              disabled={!isOn && picked.length >= 3}
              className={`rounded-2xl border p-4 text-left transition ${isOn ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"} ${!isOn && picked.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isOn ? "text-white" : "text-slate-600"}`} />
                <span className={`text-xs font-medium ${isOn ? "text-slate-300" : "text-slate-500"}`}>{p.categoria}</span>
                {isOn && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}
              </div>
              <div className="mt-2 text-sm font-semibold leading-tight">{p.nome}</div>
              <div className={`mt-1 text-xs ${isOn ? "text-slate-300" : "text-slate-500"}`}>{p.totalGenes} genes</div>
            </button>
          );
        })}
      </div>

      {crossDomainWarning && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Domínios diferentes selecionados:</span> {crossDomainWarning}. A sobreposição génica entre domínios distintos (ex.: somático vs PGx) não tem significado clínico direto — genes partilhados cobrem contextos analíticos diferentes.
        </div>
      )}

      {recCombo && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <Layers3 className="h-4 w-4" /> Combinação clinicamente recomendada detetada
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            <span className="font-semibold">{recCombo.combo.label}</span> — {recCombo.combo.rationale}
          </p>
          <p className="mt-1 text-xs text-emerald-700">Contextos: {recCombo.combo.contexts.join(" · ")}</p>
        </div>
      )}

      {/* ── Overlap matrix ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
          <BarChart3 className="h-4 w-4" /> Matriz de sobreposição génica
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold text-slate-600"></th>
                {painels.map((p) => (
                  <th key={p.id} className="px-3 py-2 text-center font-semibold text-slate-600 max-w-[100px]">
                    <div className="truncate" title={p.nome}>{p.nome.replace("Painel de ", "").replace("Painel ", "")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {painels.map((row, ri) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{row.nome.replace("Painel de ", "").replace("Painel ", "")}</td>
                  {overlapMatrix[ri].map((count, ci) => {
                    const isDiag = ri === ci;
                    const isCross = !isDiag && getPanelDomain(row) !== getPanelDomain(painels[ci]);
                    const pct = isDiag ? 100 : Math.round((count / Math.min(row.totalGenes, painels[ci].totalGenes)) * 100);
                    return (
                      <td key={ci} className={`px-3 py-2 text-center font-medium ${isDiag ? "bg-slate-100 text-slate-900" : isCross ? "text-slate-300" : count > 0 ? "text-indigo-700" : "text-slate-400"}`} title={isCross ? "Domínios distintos — sobreposição sem significado clínico direto" : undefined}>
                        <div>{count}</div>
                        {!isDiag && count > 0 && !isCross && <div className="text-[10px] font-normal text-slate-400">{pct}%</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Diagonal: total de genes do painel. Percentagem = genes comuns / min(genes A, genes B). Células a cinzento claro = domínios distintos (sobreposição sem relevância clínica direta).</p>
      </div>

      {/* ── Detailed comparison ── */}
      {pickedPanels.length >= 2 && (
        <div className="space-y-5">
          {/* Capability comparison */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Atributo</th>
                  {pickedPanels.map((p) => <th key={p.id} className="px-4 py-3 text-left font-semibold">{p.nome.replace("Painel de ", "").replace("Painel ", "")}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">Total genes</td>
                  {pickedPanels.map((p) => <td key={p.id} className="px-4 py-3 font-semibold text-slate-900">{p.totalGenes}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">Tecnologia</td>
                  {pickedPanels.map((p) => <td key={p.id} className="px-4 py-3">{p.tecnologia}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">MSI</td>
                  {pickedPanels.map((p) => <td key={p.id} className="px-4 py-3">{p.capacidade?.msi ? <span className="text-emerald-600 font-medium">Sim</span> : <span className="text-slate-400">Não</span>}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">TMB</td>
                  {pickedPanels.map((p) => <td key={p.id} className="px-4 py-3">{p.capacidade?.tmb ? <span className="text-emerald-600 font-medium">Sim</span> : <span className="text-slate-400">Não</span>}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">Amostras</td>
                  {pickedPanels.map((p) => <td key={p.id} className="px-4 py-3">{p.amostras.join(", ")}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">Biomarcadores</td>
                  {pickedPanels.map((p) => <td key={p.id} className="px-4 py-3">{p.biomarcadores.join(", ")}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Genes in common */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-semibold text-emerald-900">Genes em comum ({intersection.length})</div>
            <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {intersection.length === 0 ? (
                <span className="text-sm text-emerald-700">Nenhum gene em comum entre os painéis selecionados.</span>
              ) : intersection.map((g) => (
                <span key={g} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">{g}</span>
              ))}
            </div>
          </div>

          {/* Exclusive genes per panel */}
          {pickedPanels.map((p) => {
            const excl = exclusives[p.id] || [];
            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Exclusivos de {p.nome.replace("Painel de ", "").replace("Painel ", "")} ({excl.length})</div>
                <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {excl.length === 0 ? (
                    <span className="text-sm text-slate-500">Todos os genes deste painel existem noutro(s) selecionado(s).</span>
                  ) : excl.map((g) => (
                    <span key={g} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">{g}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pickedPanels.length < 2 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seleciona pelo menos 2 painéis acima para ver a comparação detalhada.
        </div>
      )}
    </Modal>
  );
}

/* ─────────────────── Panel Recommender ─────────────────── */
const CONTEXT_OPTIONS = [
  "avançado", "metastático", "1ª linha", "imunoterapia", "hereditário",
  "diagnóstico", "fusão", "TMB", "MSI", "terapêutica alvo",
];
const GOAL_OPTIONS = [
  "mutações acionáveis", "fusões", "RNA", "TMB", "MSI",
  "perfil abrangente", "germline", "classificação molecular",
];

function PanelRecommender({ open, onClose, onSelectPanel }) {
  const [step, setStep] = useState(1);
  const [tumorInput, setTumorInput] = useState("");
  const [selectedContext, setSelectedContext] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);

  const clinicalInput = useMemo(() => ({
    tumor: tumorInput.trim(),
    context: selectedContext,
    goals: selectedGoals,
  }), [tumorInput, selectedContext, selectedGoals]);

  const recommendation = useMemo(() => {
    if (step < 3) return null;
    return recommendByRules(clinicalInput, clinicalRules, painels);
  }, [step, clinicalInput]);

  function toggleItem(list, setList, item) {
    setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
  }

  function reset() {
    setStep(1);
    setTumorInput("");
    setSelectedContext([]);
    setSelectedGoals([]);
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Recomendar painel" icon={Stethoscope} wide>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => s < step ? setStep(s) : null}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${step >= s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"} ${s < step ? "cursor-pointer" : ""}`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </button>
            {s < 3 && <div className={`h-0.5 flex-1 rounded ${step > s ? "bg-slate-900" : "bg-slate-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Tumor type */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Tipo tumoral / entidade clínica</label>
            <input
              value={tumorInput}
              onChange={(e) => setTumorInput(e.target.value)}
              placeholder="Ex.: CPNPC, Melanoma, LMA, Carcinoma da mama…"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Contexto clínico (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleItem(selectedContext, setSelectedContext, opt)}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${selectedContext.includes(opt) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!tumorInput.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Seguinte <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Goals / biomarkers */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">O que pretende avaliar? (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleItem(selectedGoals, setSelectedGoals, opt)}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${selectedGoals.includes(opt) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Anterior</button>
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition">
              Ver recomendação <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Rule-based results */}
      {step === 3 && recommendation && (
        <div className="space-y-4">
          {/* Summary chips */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 flex flex-wrap gap-2 items-center">
            <span className="font-semibold mr-1">Critérios:</span>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium">{tumorInput}</span>
            {selectedContext.map((c) => <span key={c} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">{c}</span>)}
            {selectedGoals.map((g) => <span key={g} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{g}</span>)}
          </div>

          {recommendation.message && !recommendation.rule && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{recommendation.message}</div>
          )}

          {recommendation.rule && (
            <>
              {/* Best matching rule */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        {recommendation.rule.strength}
                      </span>
                      {/* Confidence badge */}
                      {(() => {
                        const conf = recommendation.rule._confidence;
                        const styles = {
                          alta:     "bg-emerald-100 text-emerald-800 border border-emerald-300",
                          moderada: "bg-amber-100 text-amber-800 border border-amber-300",
                          baixa:    "bg-slate-100 text-slate-600 border border-slate-300",
                        };
                        const labels = { alta: "Confiança alta", moderada: "Confiança moderada", baixa: "Confiança baixa" };
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[conf] || styles.baixa}`}>
                            {conf === "alta" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {labels[conf] || conf}
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{recommendation.rule.label}</h3>
                  </div>
                </div>

                {/* Explainability — what matched */}
                <div className="mt-3 mb-1 rounded-xl bg-white/70 border border-emerald-100 px-3 py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Critérios correspondentes</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Tumor: {tumorInput}
                    </span>
                    {(recommendation.rule._matchedContext || []).map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
                        <CheckCircle2 className="h-3 w-3" /> Contexto: {c}
                      </span>
                    ))}
                    {(recommendation.rule._matchedGoals || []).map((g) => (
                      <span key={g} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800">
                        <CheckCircle2 className="h-3 w-3" /> Objetivo: {g}
                      </span>
                    ))}
                    {!recommendation.rule._matchedContext?.length && !recommendation.rule._matchedGoals?.length && (
                      <span className="text-xs text-slate-400">Apenas correspondência por tipo tumoral — adiciona contexto ou objetivos para aumentar a confiança.</span>
                    )}
                  </div>
                </div>

                {/* Recommended panels */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {recommendation.panels.map((panel) => {
                    const Icon = iconByCategory[panel.categoria] || Dna;
                    return (
                      <button
                        key={panel.id}
                        onClick={() => { onSelectPanel(panel.id); reset(); onClose(); }}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {panel.nome}
                        <span className="text-emerald-500">· {panel.totalGenes}g</span>
                      </button>
                    );
                  })}
                  {recommendation.rule.combination && recommendation.panels.length > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      <Layers3 className="h-3 w-3" /> Usar em combinação
                    </span>
                  )}
                </div>

                {/* Rationale */}
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 mb-2">Racional</div>
                  <ul className="space-y-1.5">
                    {recommendation.rule.rationale.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Caveats */}
                {recommendation.rule.caveats?.length > 0 && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800 mb-2">Notas / limitações</div>
                    <ul className="space-y-1.5">
                      {recommendation.rule.caveats.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Alternative rules */}
              {recommendation.alternatives?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Considerar também</div>
                  <div className="space-y-2">
                    {recommendation.alternatives.map((alt) => (
                      <div key={alt.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold mr-2 ${alt.strength === "Recomendado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{alt.strength}</span>
                          <span className="text-sm font-medium text-slate-800">{alt.label}</span>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {alt.recommendedPanels.map((pid) => {
                            const p = painels.find((x) => x.id === pid);
                            if (!p) return null;
                            return (
                              <button key={pid} onClick={() => { onSelectPanel(p.id); reset(); onClose(); }} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                                {p.nome.replace("Painel de ", "").replace("Painel ", "").replace("DNA ", "").slice(0, 24)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Ajustar</button>
            <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Recomeçar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function GenePanelsCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [diseaseFilter, setDiseaseFilter] = useState("Todos");
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === "undefined") return painels[0].id;
    try { return localStorage.getItem(STORAGE_KEY) || painels[0].id; } catch { return painels[0].id; }
  });
  const [copiedState, setCopiedState] = useState("");
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [evidenceGene, setEvidenceGene] = useState("");
  const [evidenceAlteration, setEvidenceAlteration] = useState("");
  const [evidenceTumorType, setEvidenceTumorType] = useState("");
  const [evidenceData, setEvidenceData] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [showComparator, setShowComparator] = useState(false);
  const [showRecommender, setShowRecommender] = useState(false);
  const [showClinicalExport, setShowClinicalExport] = useState(false);
  const searchTerms = useMemo(() => parseSearchTerms(query), [query]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, selectedId); } catch { /* storage unavailable */ }
  }, [selectedId]);

  useEffect(() => {
    setEvidenceGene("");
    setEvidenceAlteration("");
    setEvidenceTumorType("");
    setEvidenceData(null);
    setEvidenceError("");
  }, [selectedId]);

  useEffect(() => { setDiseaseFilter("Todos"); }, [category]);

  const filteredPanels = useMemo(() => {
    return painels.filter((panel) => {
      const structureTags = getPanelStructureTags(panel);
      const tumorTypes = getPanelTumorTypes(panel);
      const diseases = getPanelDiseases(panel);
      if (category !== "Todos" && panel.categoria !== category) return false;
      if (diseaseFilter !== "Todos" && !diseases.includes(diseaseFilter)) return false;
      if (!searchTerms.length) return true;
      const searchable = [panel.nome, panel.categoria, panel.tecnologia, panel.descricao, ...(panel.tags || []), ...structureTags, ...tumorTypes, ...diseases].join(" ");
      const inBasic = matchesSearchTerms(searchable, searchTerms);
      const inGenes = searchTerms.every((term) => panel.genes.some((gene) => geneMatchesTerm(gene, term)));
      return inBasic || inGenes;
    });
  }, [searchTerms, category, diseaseFilter]);

  const selected = filteredPanels.find((p) => p.id === selectedId) || painels.find((p) => p.id === selectedId) || painels[0];
  const selectedStructureTags = useMemo(() => getPanelStructureTags(selected), [selected]);

  const filteredGenesSelected = useMemo(() => {
    if (!searchTerms.length) return selected.genes;
    return selected.genes.filter((gene) => matchesAnySearchTerm(gene, searchTerms));
  }, [selected, searchTerms]);

  const matchedGenes = useMemo(() => {
    if (!searchTerms.length) return [];
    return filteredGenesSelected.slice(0, showAllMatches ? 500 : 36);
  }, [filteredGenesSelected, searchTerms, showAllMatches]);

  const totalGenesAcrossPanels = painels.reduce((sum, panel) => sum + panel.totalGenes, 0);
  const uniqueGenesGlobal = uniqueSortedGenes(painels.flatMap((p) => p.genes));
  const justification = generateJustification(selected);
  const futureEvidence = useMemo(() => getEvidenceNotes(selected), [selected]);
  const appDate = useMemo(() => new Date().toLocaleDateString("pt-PT"), []);


  async function inspectGeneEvidence(gene) {
    setEvidenceGene(gene);
    setEvidenceError("");
    setEvidenceData(null);

    if (selected.categoria === "Germinativo") {
      setEvidenceData({ mode: "germline-links" });
      return;
    }

    setEvidenceLoading(true);
    try {
      if (selected.categoria === "Farmacogenómica") {
        const clinpgx = await fetchJson(`/api/clinpgx?gene=${encodeURIComponent(gene)}`);
        setEvidenceData({ clinpgx });
      } else {
        const calls = [fetchJson(`/api/civic?gene=${encodeURIComponent(gene)}`)];
        const canQueryOnco = evidenceAlteration.trim() && evidenceTumorType.trim();
        if (canQueryOnco) {
          const params = new URLSearchParams({ gene, alteration: evidenceAlteration.trim(), tumorType: evidenceTumorType.trim() });
          calls.push(fetchJson(`/api/oncokb?${params.toString()}`));
        }
        const results = await Promise.allSettled(calls);
        const civic = results[0].status === "fulfilled" ? results[0].value : null;
        const oncokb = results[1] && results[1].status === "fulfilled" ? results[1].value : null;
        const firstError = results.find((r) => r.status === "rejected");
        if (firstError && !civic && !oncokb) throw firstError.reason;
        setEvidenceData({ civic, oncokb });
        if (!canQueryOnco) {
          setEvidenceError("CIViC foi consultado. Para OncoKB, preenche também alteração proteica e tipo tumoral.");
        }
      }
    } catch (err) {
      setEvidenceError(err?.message || "Não foi possível obter evidência neste momento.");
    } finally {
      setEvidenceLoading(false);
    }
  }

  function flashCopied(label) {
    setCopiedState(label);
    window.setTimeout(() => setCopiedState(""), 1800);
  }

  async function copyGenes() {
    await navigator.clipboard.writeText(selected.genes.join("\n"));
    flashCopied("genes");
  }

  async function copyFilteredGenes() {
    await navigator.clipboard.writeText(filteredGenesSelected.join("\n"));
    flashCopied("filteredGenes");
  }

  async function copyJustification() {
    await navigator.clipboard.writeText(justification);
    flashCopied("justification");
  }

  function exportJson() {
    downloadFile(JSON.stringify(selected, null, 2), `${selected.id}.json`, "application/json;charset=utf-8");
  }

  function exportCsv() {
    const ev = getPanelEvidenceAvailability(selected);
    const rows = [["painel", "categoria", "tipo_tumor", "doencas", "tecnologia", "oncokb", "clinvar", "clinpgx", "civic", "cpic", "secao", "gene"]];
    Object.entries(selected.secoes || {}).forEach(([secao, genes]) => {
      genes.forEach((gene) => rows.push([
        selected.nome,
        selected.categoria,
        getPanelTumorTypes(selected).join(" | "),
        getPanelDiseases(selected).join(" | "),
        selected.tecnologia,
        ev.oncokb,
        ev.clinvar,
        ev.clinpgx,
        ev.civic,
        ev.cpic,
        prettifySectionKey(secao),
        gene,
      ]));
    });
    downloadFile(buildCsv(rows), `${selected.id}.csv`, "text/csv;charset=utf-8");
  }

  const categories = useMemo(() => ["Todos", ...new Set(painels.map((p) => p.categoria))], []);
  const diseaseOptions = useMemo(() => {
    const relevant = category === "Todos" ? painels : painels.filter((p) => p.categoria === category);
    return ["Todos", ...new Set(relevant.flatMap((p) => getPanelDiseases(p)))];
  }, [category]);

  function resetFilters() {
    setQuery("");
    setCategory("Todos");
    setDiseaseFilter("Todos");
    setShowAllMatches(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e0e7ff_0%,#f8fafc_28%,#ffffff_58%)] pb-[max(1rem,env(safe-area-inset-bottom))] text-left text-slate-900">
      <div className="mx-auto max-w-[1480px] px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[28px]">
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center justify-center sm:justify-start">
                <img
                  src={institutionalLogo}
                  alt="ULS Almada-Seixal"
                  className="h-auto w-full max-w-[170px] object-contain sm:max-w-[280px] lg:max-w-[490px]"
                />
              </div>
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 sm:text-[11px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Catálogo de painéis
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl">Painéis de genes</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                  Painéis NGS — somático, RNA, hematológico e germinativo. Pesquisa por gene, painel, categoria ou contexto clínico.
                </p>
              </div>
            </div>
          </header>

          <section className="border-b border-slate-200 bg-slate-50/80 px-5 py-5 sm:px-8 lg:px-10">
            <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_220px_260px]">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar gene(s), painel, categoria ou tag… Ex.: NF1, NF2"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Filter className="h-5 w-5 text-slate-400" />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <TestTube2 className="h-5 w-5 text-slate-400" />
                <select value={diseaseFilter} onChange={(e) => setDiseaseFilter(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                  {diseaseOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <div className="-mt-1 text-xs leading-5 text-slate-500 2xl:col-span-full">
                Genes múltiplos: usa vírgula, ponto e vírgula, nova linha ou cola uma coluna do Excel.
                {searchTerms.some((t) => resolveGeneAlias(t).toLowerCase() !== t) && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200">
                    alias resolvido: {searchTerms.filter((t) => resolveGeneAlias(t).toLowerCase() !== t).map((t) => `${t.toUpperCase()} → ${resolveGeneAlias(t)}`).join(", ")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 2xl:col-span-full">
                <ActionButton icon={Copy} onClick={copyGenes} title="Copiar todos os genes do painel selecionado">{copiedState === "genes" ? <><Check className="h-4 w-4" /> Copiado</> : <>Copiar genes</>}</ActionButton>
                <ActionButton icon={Copy} onClick={copyFilteredGenes} title="Copiar apenas os genes filtrados no painel selecionado">{copiedState === "filteredGenes" ? <><Check className="h-4 w-4" /> Copiado</> : <>Copiar genes filtrados</>}</ActionButton>
                <ActionButton icon={Wand2} onClick={copyJustification} title="Copiar texto automático de justificação">{copiedState === "justification" ? <><Check className="h-4 w-4" /> Copiado</> : <>Copiar texto</>}</ActionButton>
                <ActionButton icon={FileSpreadsheet} onClick={exportCsv} title="Exportar CSV do painel">CSV</ActionButton>
                <ActionButton icon={Stethoscope} onClick={() => setShowRecommender(true)} title="Recomendar painel por diagnóstico" variant="green" bold>Recomendar</ActionButton>
                <ActionButton icon={GitCompare} onClick={() => setShowComparator(true)} title="Comparar 2-3 painéis lado a lado" variant="blue">Comparar</ActionButton>
                <ActionButton icon={RefreshCcw} onClick={resetFilters} title="Limpar pesquisa e filtros" variant="red">Reset filtros</ActionButton>
                <ActionButton icon={FileSpreadsheet} onClick={() => setShowClinicalExport(true)} title="Gerar texto de justificação clínica para pedido NGS">Justificação NGS</ActionButton>
              </div>
            </div>
          </section>

          <section className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-8 lg:px-10">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Painéis</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{painels.length}</div>
              <div className="mt-1 text-sm text-slate-500">Catálogo principal</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Genes somados</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{totalGenesAcrossPanels}</div>
              <div className="mt-1 text-sm text-slate-500">Contagem por painel</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Genes únicos</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{uniqueGenesGlobal.length}</div>
              <div className="mt-1 text-sm text-slate-500">União do catálogo</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Resultados</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{filteredPanels.length}</div>
              <div className="mt-1 text-sm text-slate-500">{query || category !== "Todos" || diseaseFilter !== "Todos" ? "Com filtros ativos" : "Sem filtros ativos"}</div>
            </div>
          </section>

          <section className="grid gap-6 px-5 pb-6 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:px-10 lg:pb-10 xl:grid-cols-[minmax(0,1.12fr)_460px]">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Layers3 className="h-4 w-4" />
                Lista de painéis
              </div>

              <div className="grid gap-4 2xl:grid-cols-2">
                  {filteredPanels.map((panel) => {
                    const Icon = iconByCategory[panel.categoria] || Dna;
                    const isSelected = selected.id === panel.id;
                    return (
                      <button
                        key={panel.id}
                        onClick={() => setSelectedId(panel.id)}
                        className={`group w-full rounded-[26px] border p-5 text-left transition-all duration-200 sm:p-6 ${isSelected ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]" : "border-slate-200 bg-white/90 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-2xl p-3 ${isSelected ? "bg-white/10" : "bg-slate-100"}`}><Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-slate-700"}`} /></div>
                            <div>
                              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : categoryColors[panel.categoria]}`}>{panel.categoria}</div>
                              <p className={`mt-2 text-xs uppercase tracking-[0.18em] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{panel.tecnologia} • {panel.versao}</p>
                            </div>
                          </div>
                          <ChevronRight className={`mt-1 h-5 w-5 transition ${isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                        </div>

                        <h3 className="mt-5 text-lg font-semibold leading-tight sm:text-xl">{panel.nome}</h3>
                        <p className={`mt-3 text-sm leading-6 ${isSelected ? "text-slate-200" : "text-slate-600"}`}>{panel.descricao}</p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className={`rounded-2xl px-4 py-3 ${isSelected ? "bg-white/10" : "bg-slate-50"}`}>
                            <div className={`text-[11px] uppercase tracking-[0.14em] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>Total</div>
                            <div className="mt-1 text-lg font-semibold">{panel.totalGenes} genes</div>
                          </div>
                          <div className={`rounded-2xl px-4 py-3 ${isSelected ? "bg-white/10" : "bg-slate-50"}`}>
                            <div className={`text-[11px] uppercase tracking-[0.14em] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>Biomarcadores</div>
                            <div className="mt-1 text-sm font-medium leading-5">{panel.biomarcadores.slice(0, 4).join(" • ")}{panel.biomarcadores.length > 4 ? " • …" : ""}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
            </div>

            <aside className="lg:sticky lg:top-4 lg:self-start">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[selected.categoria]}`}>{selected.categoria}</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">{selected.tecnologia}</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">{selected.versao}</span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{selected.nome}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{selected.descricao}</p>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipos de tumor</div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {getPanelTumorTypes(selected).map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Órgãos / doenças</div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {getPanelDiseases(selected).map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><PanelRight className="h-4 w-4" /> Texto automático</div>
                  <p className="mt-2 text-sm leading-6 text-indigo-900">{justification}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Total de genes</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{selected.totalGenes}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Capacidades</div>
                    <div className="mt-2 flex flex-wrap gap-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${selected.capacidade?.msi ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>MSI {selected.capacidade?.msi ? "sim" : "não"}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${selected.capacidade?.tmb ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>TMB {selected.capacidade?.tmb ? "sim" : "não"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Amostras</h3>
                    <div className="mt-3 flex flex-wrap gap-3.5">
                      {selected.amostras.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700"><TestTube2 className="mr-1 inline h-3.5 w-3.5" />{item}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Biomarcadores</h3>
                    <div className="mt-3 flex flex-wrap gap-3.5">
                      {selected.biomarcadores.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900">Tags</h3>
                  <div className="mt-3 flex flex-wrap gap-3.5">
                    {selected.tags.map((item) => (
                      <span key={item} className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900">Estrutura alvo</h3>
                  <div className="mt-3 flex flex-wrap gap-3.5">
                    {selectedStructureTags.map((item) => (
                      <span key={item} className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">{item}</span>
                    ))}
                  </div>
                </div>

                {/* ── Porquê este painel ── */}
                {(selected.clinicalIndications?.length > 0 || selected.limitations?.length > 0 || selected.whenNotToUse?.length > 0) && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Stethoscope className="h-4 w-4" />
                      Porquê este painel?
                    </div>

                    {selected.clinicalIndications?.length > 0 && (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Indicações clínicas</div>
                        <div className="divide-y divide-slate-100">
                          {selected.clinicalIndications.map((ind, i) => (
                            <div key={i} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-medium text-slate-900 leading-snug">{ind.tumor}</span>
                                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                  ind.strength === "primeira linha" ? "bg-emerald-100 text-emerald-700" :
                                  ind.strength === "componente de combinação" ? "bg-indigo-100 text-indigo-700" :
                                  ind.strength === "reflexo" ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>{ind.strength}</span>
                              </div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{ind.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.limitations?.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 mb-2">Limitações analíticas</div>
                        <ul className="space-y-1.5">
                          {selected.limitations.map((lim, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-5 text-amber-900">
                              <span className="mt-0.5 shrink-0 text-amber-500">•</span>{lim}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selected.whenNotToUse?.length > 0 && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-800 mb-2">Quando não usar</div>
                        <ul className="space-y-1.5">
                          {selected.whenNotToUse.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-5 text-rose-900">
                              <span className="mt-0.5 shrink-0 text-rose-400">•</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Database className="h-4 w-4" />
                    Bases de evidência
                  </div>
                  <div className="mt-3 space-y-2">
                    {futureEvidence.map((item) => (
                      <div key={item.source} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-900">{item.source}</div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.role === "Primário" ? "bg-emerald-100 text-emerald-700" : item.role === "Complementar" ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-500"}`}>{item.role}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <EvidencePanel
                  panel={selected}
                  gene={evidenceGene}
                  loading={evidenceLoading}
                  error={evidenceError}
                  evidence={evidenceData}
                  alteration={evidenceAlteration}
                  setAlteration={setEvidenceAlteration}
                  tumorType={evidenceTumorType}
                  setTumorType={setEvidenceTumorType}
                  onRun={() => evidenceGene ? inspectGeneEvidence(evidenceGene) : null}
                />

                {matchedGenes.length > 0 ? (
                  <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-indigo-900">Correspondências no painel selecionado</div>
                        <div className="mt-1 text-xs text-indigo-700">{filteredGenesSelected.length} gene(s) filtrado(s)</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={copyFilteredGenes} className="text-xs font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2">
                          {copiedState === "filteredGenes" ? "Genes filtrados copiados" : "Copiar só genes filtrados"}
                        </button>
                        {filteredGenesSelected.length > 36 ? (
                          <button onClick={() => setShowAllMatches((v) => !v)} className="text-xs font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2">
                            {showAllMatches ? "Mostrar menos" : "Mostrar mais"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex max-h-64 flex-wrap gap-3.5 overflow-auto pr-2 pb-1">
                      {matchedGenes.map((gene) => (
                        <GeneBadge key={gene} gene={gene} category={selected.categoria} highlighted compact onInspect={inspectGeneEvidence} />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 space-y-3 border-t border-slate-200 pt-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Database className="h-4 w-4" />
                    Estrutura do painel
                  </div>

                  {Object.entries(selected.secoes).map(([key, genes], idx) => (
                    <SectionBlock key={key} title={prettifySectionKey(key)} genes={genes} activeQuery={query.trim()} initialOpen={idx === 0} category={selected.categoria} onInspect={inspectGeneEvidence} />
                  ))}
                </div>
              </div>
            </aside>
          </section>
          <footer className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-2 text-center text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-xs">
              <div>Ricardo B. Leite · Patologia molecular — Serviço de Anatomia Patológica</div>
              <div className="flex items-center gap-2">
                <span>v. {APP_VERSION}</span>
                <span aria-hidden="true">·</span>
                <span>{appDate}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <PanelComparator open={showComparator} onClose={() => setShowComparator(false)} />
      <PanelRecommender open={showRecommender} onClose={() => setShowRecommender(false)} onSelectPanel={setSelectedId} />
      <ClinicalExportModal open={showClinicalExport} onClose={() => setShowClinicalExport(false)} panel={selected} date={appDate} />
    </main>
  );
}
