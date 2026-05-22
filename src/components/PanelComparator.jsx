import { useMemo, useState } from "react";
import {
  Dna,
  GitCompare,
  CheckCircle2,
  Layers3,
  BarChart3,
} from "lucide-react";
import Modal from "./Modal.jsx";
import {
  painels,
  iconByCategory,
  DOMAIN_LABELS,
  getPanelDomain,
} from "../panelMetadata.js";

export default function PanelComparator({ open, onClose }) {
  const [picked, setPicked] = useState([]);

  function toggle(id) {
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
        ? prev
        : [...prev, id]
    );
  }

  const pickedPanels = useMemo(
    () => painels.filter((p) => picked.includes(p.id)),
    [picked]
  );

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
      for (const combo of p.recommendedCombinations || []) {
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
