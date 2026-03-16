import React, { useMemo, useState } from "react";
import { Search, Dna, Copy, FileText, Filter, Database } from "lucide-react";

const PANELS = [
  {
    id: "solid-tumor",
    name: "Painel Tumor Sólido",
    category: "Somático",
    technology: "DNA",
    version: "v1.0",
    updatedAt: "2026-03-16",
    description: "Painel exemplo para tumores sólidos, com genes frequentemente relevantes em oncologia molecular.",
    genes: ["TP53", "KRAS", "EGFR", "BRAF", "PIK3CA", "ALK", "ERBB2", "MET", "NRAS", "RET"],
  },
  {
    id: "heme",
    name: "Painel Hematologia",
    category: "Somático",
    technology: "DNA",
    version: "v1.0",
    updatedAt: "2026-03-16",
    description: "Painel exemplo para neoplasias hematológicas.",
    genes: ["JAK2", "CALR", "MPL", "DNMT3A", "TET2", "ASXL1", "FLT3", "NPM1", "IDH1", "IDH2"],
  },
  {
    id: "lung",
    name: "Painel Pulmão",
    category: "Somático",
    technology: "DNA/RNA",
    version: "v1.0",
    updatedAt: "2026-03-16",
    description: "Painel exemplo orientado para alterações acionáveis em cancro do pulmão.",
    genes: ["EGFR", "ALK", "ROS1", "RET", "MET", "ERBB2", "KRAS", "BRAF", "NTRK1", "NTRK3"],
  },
  {
    id: "breast-ovary",
    name: "Painel Mama/Ovário",
    category: "Germinal",
    technology: "DNA",
    version: "v1.0",
    updatedAt: "2026-03-16",
    description: "Painel exemplo para predisposição hereditária em mama e ovário.",
    genes: ["BRCA1", "BRCA2", "PALB2", "ATM", "CHEK2", "RAD51C", "RAD51D", "BARD1", "TP53", "PTEN"],
  },
  {
    id: "colon",
    name: "Painel Cólon",
    category: "Somático",
    technology: "DNA",
    version: "v1.0",
    updatedAt: "2026-03-16",
    description: "Painel exemplo para carcinoma colorretal.",
    genes: ["KRAS", "NRAS", "BRAF", "PIK3CA", "TP53", "APC", "SMAD4", "FBXW7", "ERBB2", "POLE"],
  },
  {
    id: "pgx",
    name: "Painel Farmacogenómica",
    category: "PGx",
    technology: "DNA",
    version: "v1.0",
    updatedAt: "2026-03-16",
    description: "Painel exemplo para variantes farmacogenómicas clinicamente relevantes.",
    genes: ["CYP2D6", "CYP2C19", "CYP2C9", "DPYD", "TPMT", "NUDT15", "UGT1A1", "SLCO1B1", "VKORC1", "CYP3A5"],
  },
];

function normalize(text) {
  return text.toLowerCase().trim();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-PT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default function GenePanelsSite() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [selectedPanelId, setSelectedPanelId] = useState(null);
  const [copiedPanelId, setCopiedPanelId] = useState(null);

  const categories = useMemo(() => {
    return ["Todos", ...new Set(PANELS.map((panel) => panel.category))];
  }, []);

  const filteredPanels = useMemo(() => {
    const q = normalize(query);

    return PANELS.filter((panel) => {
      const matchesCategory = categoryFilter === "Todos" || panel.category === categoryFilter;
      const matchesPanel = normalize(panel.name).includes(q);
      const matchesDescription = normalize(panel.description).includes(q);
      const matchesGene = panel.genes.some((gene) => normalize(gene).includes(q));

      return matchesCategory && (!q || matchesPanel || matchesDescription || matchesGene);
    });
  }, [query, categoryFilter]);

  const selectedPanel = useMemo(() => {
    if (!selectedPanelId) return null;
    return PANELS.find((panel) => panel.id === selectedPanelId) || null;
  }, [selectedPanelId]);

  const matchingGenes = useMemo(() => {
    if (!selectedPanel || !query.trim()) return selectedPanel?.genes || [];
    const q = normalize(query);
    return selectedPanel.genes.filter((gene) => normalize(gene).includes(q));
  }, [selectedPanel, query]);

  const handleCopyGenes = async (panel) => {
    const text = panel.genes.join(", ");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPanelId(panel.id);
      setTimeout(() => setCopiedPanelId(null), 1500);
    } catch (error) {
      console.error("Falha ao copiar genes:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                <Database className="h-4 w-4" />
                Consulta de painéis genéticos
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Painéis de genes</h1>
                <p className="mt-2 max-w-3xl text-base text-slate-600 sm:text-lg">
                  Pesquisa rápida por painel ou por gene, com uma base simples e fácil de atualizar.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar gene ou painel..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lista de painéis</h2>
              <p className="text-sm text-slate-500">
                {filteredPanels.length} painel{filteredPanels.length === 1 ? "" : "éis"} encontrado{filteredPanels.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredPanels.map((panel) => {
              const geneMatches = query.trim()
                ? panel.genes.filter((gene) => normalize(gene).includes(normalize(query))).length
                : panel.genes.length;

              return (
                <button
                  key={panel.id}
                  onClick={() => setSelectedPanelId(panel.id)}
                  className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedPanelId === panel.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className={`rounded-full px-2.5 py-1 ${selectedPanelId === panel.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>
                          {panel.category}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 ${selectedPanelId === panel.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>
                          {panel.technology}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 ${selectedPanelId === panel.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>
                          {panel.version}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold">{panel.name}</h3>
                        <p className={`mt-2 text-sm ${selectedPanelId === panel.id ? "text-slate-200" : "text-slate-600"}`}>
                          {panel.description}
                        </p>
                      </div>
                    </div>

                    <div className={`grid min-w-[150px] gap-2 rounded-2xl border px-4 py-3 text-sm ${selectedPanelId === panel.id ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <span>Total genes</span>
                        <strong>{panel.genes.length}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Correspondências</span>
                        <strong>{geneMatches}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Atualizado</span>
                        <strong>{formatDate(panel.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside>
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {selectedPanel ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    <Dna className="h-4 w-4" />
                    Detalhe do painel
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{selectedPanel.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">{selectedPanel.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Categoria</span>
                    <strong>{selectedPanel.category}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tecnologia</span>
                    <strong>{selectedPanel.technology}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Versão</span>
                    <strong>{selectedPanel.version}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Última atualização</span>
                    <strong>{formatDate(selectedPanel.updatedAt)}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleCopyGenes(selectedPanel)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedPanelId === selectedPanel.id ? "Copiado" : "Copiar genes"}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Imprimir / PDF
                  </button>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold">Genes</h3>
                    <span className="text-sm text-slate-500">
                      {matchingGenes.length} de {selectedPanel.genes.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {matchingGenes.map((gene) => (
                      <span
                        key={gene}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        {gene}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <Dna className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Seleciona um painel</h2>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Escolhe um painel na lista para veres os genes, metadados e poderes copiar a lista rapidamente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
