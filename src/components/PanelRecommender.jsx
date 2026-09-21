import React, { useMemo, useState } from "react";
import {
  Dna,
  Check,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Layers3,
} from "lucide-react";
import Modal from "./Modal.jsx";
import { painels, iconByCategory } from "../panelMetadata.js";
import { recommendByRules } from "../ruleEngine.js";
import _clinicalRulesData from "../clinicalRules.json";

const clinicalRules = _clinicalRulesData.rules;

const DOMAIN_OPTIONS = [
  { label: "Tumores sólidos", value: "oncologia-solida" },
  { label: "Hematologia",     value: "hematologia" },
  { label: "Germinativo",     value: "germinativo" },
];

const CONTEXT_OPTIONS = [
  "avançado", "metastático", "1ª linha", "imunoterapia", "hereditário",
  "diagnóstico", "fusão", "TMB", "MSI", "terapêutica alvo",
  "tecido limitado", "estudo único",
];
const GOAL_OPTIONS = [
  "mutações acionáveis", "fusões", "RNA", "TMB", "MSI",
  "perfil abrangente", "germline", "classificação molecular",
];

export default function PanelRecommender({ open, onClose, onSelectPanel }) {
  const [step, setStep] = useState(1);
  const [tumorInput, setTumorInput] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedContext, setSelectedContext] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);

  const clinicalInput = useMemo(() => ({
    tumor: tumorInput.trim(),
    domain: selectedDomain,
    context: selectedContext,
    goals: selectedGoals,
  }), [tumorInput, selectedDomain, selectedContext, selectedGoals]);

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
    setSelectedDomain("");
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
            <label className="block text-sm font-semibold text-slate-900 mb-2">Domínio (opcional)</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {DOMAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDomain((prev) => prev === opt.value ? "" : opt.value)}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${selectedDomain === opt.value ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 flex flex-wrap gap-2 items-center">
            <span className="font-semibold mr-1">Critérios:</span>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium">{tumorInput}</span>
            {selectedDomain && <span className="rounded-full bg-indigo-700 px-2.5 py-1 text-xs font-medium text-white">{DOMAIN_OPTIONS.find(d => d.value === selectedDomain)?.label}</span>}
            {selectedContext.map((c) => <span key={c} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">{c}</span>)}
            {selectedGoals.map((g) => <span key={g} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{g}</span>)}
          </div>

          {recommendation.message && !recommendation.rule && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{recommendation.message}</div>
          )}

          {recommendation.rule && (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        {recommendation.rule.strength}
                      </span>
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

                {recommendation.rule.componentRationale && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-800 mb-1">
                      {recommendation.rule.recommendedPanels.includes("rna-hemato")
                        ? "Porquê ADN + RNA?"
                        : "Porquê só ADN?"}
                    </div>
                    <p className="text-sm leading-6 text-indigo-950">{recommendation.rule.componentRationale}</p>
                  </div>
                )}

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
