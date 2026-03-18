
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
} from "lucide-react";

import painels from "./panels.json";
import institutionalLogo from "./assets/ulsas-logo.png";


const categoryStyles = {
  "Somático": "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  "RNA": "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  "Hematologia": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Germinativo": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Farmacogenómica": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

const categoryIcons = {
  "Somático": Dna,
  "RNA": Activity,
  "Hematologia": FlaskConical,
  "Germinativo": ShieldCheck,
  "Farmacogenómica": Beaker,
};

const order = ["Todos", "Somático", "RNA", "Hematologia", "Germinativo", "Farmacogenómica"];

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-sm text-slate-500">{hint}</div> : null}
    </div>
  );
}

function PanelCard({ panel, active, onClick }) {
  const Icon = categoryIcons[panel.categoria] || Dna;

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-3xl border p-6 text-left transition-all duration-200 ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-300/60"
          : "border-slate-200 bg-white/90 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl p-3 ${active ? "bg-white/10" : "bg-slate-100"}`}>
            <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-700"}`} />
          </div>
          <div>
            <div
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                active ? "bg-white/10 text-white" : categoryStyles[panel.categoria] || "bg-slate-100 text-slate-700"
              }`}
            >
              {panel.categoria}
            </div>
            <p className={`mt-2 text-xs uppercase tracking-[0.18em] ${active ? "text-slate-300" : "text-slate-500"}`}>
              {panel.tecnologia} • {panel.versao}
            </p>
          </div>
        </div>
        <ChevronRight
          className={`mt-1 h-5 w-5 transition ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
        />
      </div>

      <h3 className="mt-5 text-xl font-semibold leading-tight">{panel.nome}</h3>
      <p className={`mt-3 text-sm leading-6 ${active ? "text-slate-200" : "text-slate-600"}`}>
        {panel.descricao}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className={`rounded-2xl px-4 py-3 ${active ? "bg-white/10" : "bg-slate-50"}`}>
          <div className={`text-xs uppercase tracking-[0.14em] ${active ? "text-slate-300" : "text-slate-500"}`}>
            Total
          </div>
          <div className="mt-1 text-lg font-semibold">{panel.totalGenes} genes</div>
        </div>
        <div className={`rounded-2xl px-4 py-3 ${active ? "bg-white/10" : "bg-slate-50"}`}>
          <div className={`text-xs uppercase tracking-[0.14em] ${active ? "text-slate-300" : "text-slate-500"}`}>
            Biomarcadores
          </div>
          <div className="mt-1 text-sm font-medium">{panel.biomarcadores.join(" • ")}</div>
        </div>
      </div>
    </button>
  );
};

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

const STORAGE_KEY = "gene-panel-builder-selected";

function prettifySectionKey(key) {
  const map = {
    wholeCds: "Whole CDS",
    hotspotsCds: "Hotspots CDS",
    nonCoding: "Non-coding / intrónico",
    pgxComplementar: "PGx complementar",
    fusoesRna: "Painel de fusões RNA",
    coreHemato: "Core hemato DNA",
    dnaFusions: "Fusões em DNA",
    rnaBlood: "RNA blood / rearranjos",
    predisposicao: "Predisposição hereditária",
    coreExonico: "Cobertura exónica completa",
    rearranjos: "Regiões de rearranjos / fusões",
    coberturaParcial: "Cobertura parcial expandida",
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
  return terms.some((term) => normalized.includes(term));
}

function matchesSearchTerms(value, terms) {
  const normalized = String(value || "").toLowerCase();
  return terms.every((term) => normalized.includes(term));
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
  const samples = panel.amostras?.length ? ` Pode ser aplicado em ${panel.amostras.join(", ")}.` : "";
  const sectionNames = Object.keys(panel.secoes || {}).map(prettifySectionKey);
  const sections = sectionNames.length
    ? ` A estrutura interna inclui ${sectionNames.slice(0, 3).join(", ")}${sectionNames.length > 3 ? " e módulos adicionais" : ""}.`
    : "";
  const markers = panel.biomarcadores?.length
    ? ` Abrange biomarcadores como ${panel.biomarcadores.join(", ")}.`
    : "";
  const msiTmb = panel.capacidade?.msi || panel.capacidade?.tmb
    ? ` Capacidade analítica: MSI ${panel.capacidade?.msi ? "disponível" : "não incluído"}${panel.capacidade?.tmb ? "; TMB disponível" : "; TMB não incluído"}.`
    : "";
  return `${panel.nome} é um painel da categoria ${panel.categoria.toLowerCase()} com ${panel.totalGenes} genes e tecnologia principal ${panel.tecnologia}. ${panel.descricao}${samples}${markers}${msiTmb}${sections}`;
}


const STRUCTURE_FILTERS = [
  "Todos",
  "CDS completo",
  "Hotspot",
  "Fusão",
  "PGx",
  "Não coding",
];


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
  const searchTerms = useMemo(() => parseSearchTerms(activeQuery), [activeQuery]);
  const filtered = useMemo(() => {
    if (!searchTerms.length) return genes;
    return genes.filter((g) => matchesAnySearchTerm(g, searchTerms));
  }, [genes, searchTerms]);

  const preview = filtered.slice(0, 16);
  const hidden = Math.max(0, filtered.length - preview.length);

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
              {preview.map((gene) => (
                <GeneBadge key={gene} gene={gene} category={category} highlighted={matchesAnySearchTerm(gene, searchTerms)} onInspect={onInspect} />
              ))}
              {hidden > 0 ? (
                <span className="rounded-2xl bg-slate-900 px-3.5 py-1.5 text-xs font-medium leading-none text-white">
                  +{hidden} restantes
                </span>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({ icon: Icon, children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

export default function GenePanelsCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [structureFilter, setStructureFilter] = useState("Todos");
  const [tumorTypeFilter, setTumorTypeFilter] = useState("Todos");
  const [diseaseFilter, setDiseaseFilter] = useState("Todos");
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === "undefined") return painels[0].id;
    return localStorage.getItem(STORAGE_KEY) || painels[0].id;
  });
  const [copiedState, setCopiedState] = useState("");
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [evidenceGene, setEvidenceGene] = useState("");
  const [evidenceAlteration, setEvidenceAlteration] = useState("");
  const [evidenceTumorType, setEvidenceTumorType] = useState("");
  const [evidenceData, setEvidenceData] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const searchTerms = useMemo(() => parseSearchTerms(query), [query]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    setEvidenceGene("");
    setEvidenceAlteration("");
    setEvidenceTumorType("");
    setEvidenceData(null);
    setEvidenceError("");
  }, [selectedId]);

  const filteredPanels = useMemo(() => {
    return painels.filter((panel) => {
      const matchesCategory = category === "Todos" || panel.categoria === category;
      const structureTags = getPanelStructureTags(panel);
      const tumorTypes = getPanelTumorTypes(panel);
      const diseases = getPanelDiseases(panel);
      const matchesStructure = structureFilter === "Todos" || structureTags.includes(structureFilter);
      const matchesTumorType = tumorTypeFilter === "Todos" || tumorTypes.includes(tumorTypeFilter);
      const matchesDisease = diseaseFilter === "Todos" || diseases.includes(diseaseFilter);
      if (!matchesCategory || !matchesStructure || !matchesTumorType || !matchesDisease) return false;
      if (!searchTerms.length) return true;
      const searchable = [panel.nome, panel.categoria, panel.tecnologia, panel.descricao, ...(panel.tags || []), ...structureTags, ...tumorTypes, ...diseases].join(" ");
      const inBasic = matchesSearchTerms(searchable, searchTerms);
      const inGenes = searchTerms.every((term) => panel.genes.some((gene) => gene.toLowerCase().includes(term)));
      return inBasic || inGenes;
    });
  }, [searchTerms, category, structureFilter, tumorTypeFilter, diseaseFilter]);

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

  const categories = ["Todos", ...new Set(painels.map((p) => p.categoria))];
  const tumorTypeOptions = ["Todos", ...new Set(painels.flatMap((p) => getPanelTumorTypes(p)))];
  const diseaseOptions = ["Todos", ...new Set(painels
    .filter((p) => tumorTypeFilter === "Todos" || getPanelTumorTypes(p).includes(tumorTypeFilter))
    .flatMap((p) => getPanelDiseases(p)))];

  function resetFilters() {
    setQuery("");
    setCategory("Todos");
    setStructureFilter("Todos");
    setTumorTypeFilter("Todos");
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
                  className="h-auto w-full max-w-[340px] object-contain sm:max-w-[560px] lg:max-w-[980px]"
                />
              </div>
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 sm:text-[11px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Catálogo de painéis
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl">Painéis de genes</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                  Consulta rápida dos painéis somáticos, RNA, hematológicos, germinativos e farmacogenómicos, com pesquisa por painel, categoria, tags ou gene.
                </p>
              </div>
            </div>
          </header>

          <section className="border-b border-slate-200 bg-slate-50/80 px-5 py-5 sm:px-8 lg:px-10">
            <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_220px_240px_260px]">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar gene(s), painel, categoria ou tag… Ex.: NF1, NF2"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              <div className="-mt-1 text-xs leading-5 text-slate-500 2xl:col-span-full">
                Genes múltiplos: usa vírgula, ponto e vírgula, nova linha ou cola uma coluna do Excel.
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Filter className="h-5 w-5 text-slate-400" />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <div className="-mt-1 text-xs leading-5 text-slate-500 2xl:col-span-full">
                Genes múltiplos: usa vírgula, ponto e vírgula, nova linha ou cola uma coluna do Excel.
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Database className="h-5 w-5 text-slate-400" />
                <select value={tumorTypeFilter} onChange={(e) => { setTumorTypeFilter(e.target.value); setDiseaseFilter("Todos"); }} className="w-full bg-transparent text-sm outline-none">
                  {tumorTypeOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <div className="-mt-1 text-xs leading-5 text-slate-500 2xl:col-span-full">
                Genes múltiplos: usa vírgula, ponto e vírgula, nova linha ou cola uma coluna do Excel.
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <TestTube2 className="h-5 w-5 text-slate-400" />
                <select value={diseaseFilter} onChange={(e) => setDiseaseFilter(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                  {diseaseOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-center gap-2.5">
                {STRUCTURE_FILTERS.map((item) => (
                  <button
                    key={item}
                    onClick={() => setStructureFilter(item)}
                    className={`rounded-2xl px-4 py-2 text-xs font-medium transition ${structureFilter === item ? "bg-slate-900 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <ActionButton icon={Copy} onClick={copyGenes} title="Copiar todos os genes do painel selecionado">{copiedState === "genes" ? <><Check className="h-4 w-4" /> Copiado</> : <>Copiar genes</>}</ActionButton>
                <ActionButton icon={Copy} onClick={copyFilteredGenes} title="Copiar apenas os genes filtrados no painel selecionado">{copiedState === "filteredGenes" ? <><Check className="h-4 w-4" /> Copiado</> : <>Copiar genes filtrados</>}</ActionButton>
                <ActionButton icon={Wand2} onClick={copyJustification} title="Copiar texto automático de justificação">{copiedState === "justification" ? <><Check className="h-4 w-4" /> Copiado</> : <>Copiar texto</>}</ActionButton>
                <ActionButton icon={FileSpreadsheet} onClick={exportCsv} title="Exportar CSV do painel">CSV</ActionButton>
                <ActionButton icon={FileJson} onClick={exportJson} title="Exportar JSON do painel">JSON</ActionButton>
                <ActionButton icon={RefreshCcw} onClick={resetFilters} title="Limpar pesquisa e filtros">Reset filtros</ActionButton>
                <div className="ml-auto inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button onClick={() => setViewMode("cards")} className={`rounded-xl px-3 py-2 text-xs font-medium transition ${viewMode === "cards" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Cards</button>
                  <button onClick={() => setViewMode("table")} className={`rounded-xl px-3 py-2 text-xs font-medium transition ${viewMode === "table" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Tabela</button>
                </div>
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
              <div className="mt-1 text-sm text-slate-500">{query || category !== "Todos" || structureFilter !== "Todos" || tumorTypeFilter !== "Todos" || diseaseFilter !== "Todos" ? "Com filtros ativos" : "Sem filtros ativos"}</div>
            </div>
          </section>

          <section className="grid gap-6 px-5 pb-6 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:px-10 lg:pb-10 xl:grid-cols-[minmax(0,1.12fr)_460px]">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Layers3 className="h-4 w-4" />
                Lista de painéis
              </div>

              {viewMode === "cards" ? (
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
              ) : (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Painel</th>
                          <th className="px-4 py-3 font-semibold">Categoria</th>
                          <th className="px-4 py-3 font-semibold">Tecnologia</th>
                          <th className="px-4 py-3 font-semibold">Tipo tumoral</th>
                          <th className="px-4 py-3 font-semibold">Doença / órgão</th>
                          <th className="px-4 py-3 font-semibold">Genes</th>
                          <th className="px-4 py-3 font-semibold">MSI</th>
                          <th className="px-4 py-3 font-semibold">TMB</th>
                          <th className="px-4 py-3 font-semibold">OncoKB</th>
                          <th className="px-4 py-3 font-semibold">ClinVar</th>
                          <th className="px-4 py-3 font-semibold">ClinPGx</th>
                          <th className="px-4 py-3 font-semibold">CIViC</th>
                          <th className="px-4 py-3 font-semibold">CPIC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredPanels.map((panel) => {
                          const isSelected = selected.id === panel.id;
                          const evidenceAvailability = getPanelEvidenceAvailability(panel);
                          const tumorTypes = getPanelTumorTypes(panel);
                          const diseases = getPanelDiseases(panel);
                          return (
                            <tr
                              key={panel.id}
                              onClick={() => setSelectedId(panel.id)}
                              className={`cursor-pointer transition ${isSelected ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium">{panel.nome}</div>
                                <div className={`mt-1 text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{panel.versao}</div>
                              </td>
                              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : categoryColors[panel.categoria]}`}>{panel.categoria}</span></td>
                              <td className="px-4 py-3">{panel.tecnologia}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {tumorTypes.map((item) => (
                                    <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>{item}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {diseases.map((item) => (
                                    <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>{item}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium">{panel.totalGenes}</td>
                              <td className="px-4 py-3">{panel.capacidade?.msi ? "Sim" : "Não"}</td>
                              <td className="px-4 py-3">{panel.capacidade?.tmb ? "Sim" : "Não"}</td>
                              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-rose-50 text-rose-700"}`}>{evidenceAvailability.oncokb}</span></td>
                              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"}`}>{evidenceAvailability.clinvar}</span></td>
                              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-sky-50 text-sky-700"}`}>{evidenceAvailability.clinpgx}</span></td>
                              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-violet-50 text-violet-700"}`}>{evidenceAvailability.civic}</span></td>
                              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-white/10 text-white" : "bg-cyan-50 text-cyan-700"}`}>{evidenceAvailability.cpic}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                  <h3 className="text-sm font-semibold text-slate-900">Tipo de tumor / contexto</h3>
                  <div className="mt-3 flex flex-wrap gap-3.5">
                    {getPanelTumorTypes(selected).map((item) => (
                      <span key={item} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">{item}</span>
                    ))}
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

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Database className="h-4 w-4" />
                    Ligações futuras de evidência
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Campo preparado para futura integração gene/variante com bases externas. Nesta fase é apenas estrutural, para facilitar ligação posterior a OncoKB, CIViC, PharmGKB, CPIC ou ClinVar.
                  </p>
                  <div className="mt-4 space-y-3">
                    {futureEvidence.map((item) => (
                      <a key={item.label} href={item.url || "#"} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined} className="block rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-900">{item.label}</div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "preparado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.status}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
                      </a>
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
              <div>Ricardo B. Leite · Patologia Molecular</div>
              <div className="flex items-center gap-2">
                <span>v. 0.12</span>
                <span aria-hidden="true">·</span>
                <span>{appDate}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
