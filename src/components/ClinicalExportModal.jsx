import { useMemo, useState } from "react";
import { FileSpreadsheet, Copy, Check } from "lucide-react";
import Modal from "./Modal.jsx";
import { downloadFile } from "../utils.js";

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

  const limitations = (panel.limitations || []).map((l) => `  • ${l}`).join("\n");

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

export default function ClinicalExportModal({ open, onClose, panel, date }) {
  const [selectedIndication, setSelectedIndication] = useState(null);
  const [specificGenes, setSpecificGenes] = useState("");
  const [copied, setCopied] = useState(false);

  const indications = panel?.clinicalIndications || [];

  // State resets automatically when `panel.id` changes — the parent passes
  // `key={selected.id}` so React remounts this component on each panel switch.

  const indication = indications.find((i) => i.tumor === selectedIndication) || null;

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
