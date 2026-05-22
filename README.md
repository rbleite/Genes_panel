# Gene Panels — Apoio à Decisão em NGS Oncológica

Ferramenta de apoio à decisão clínica para selecção de painéis de sequenciação de nova geração (NGS) em oncologia e hematologia, desenvolvida no âmbito do **Serviço de Patologia Molecular — ULS Almada-Seixal**.

> **Aviso clínico importante**  
> Esta aplicação destina-se exclusivamente a apoio à decisão e **não substitui o juízo clínico** do médico responsável. As recomendações são baseadas em regras clínicas derivadas de orientações ESMO/NCCN e devem ser interpretadas no contexto clínico individual de cada doente. A decisão final é sempre do clínico.

---

## Porquê esta aplicação?

À medida que o catálogo de painéis NGS cresce — em número, em amplitude génica e em especialização por patologia —, torna-se progressivamente difícil saber, sem consultar múltiplos documentos, se um dado gene está coberto por um painel específico, em que painéis está presente, ou qual a diferença de cobertura entre eles. Esta aplicação nasceu também como resposta a essa fricção quotidiana: um ponto único onde é possível pesquisar qualquer gene ou alias clínico (HER2, p53, FLT3…) e perceber imediatamente em que painéis está incluído e com que contexto.

Há uma motivação pedagógica. Num serviço onde técnicos, internos e especialistas convivem com a mesma complexidade, dispor de uma ferramenta que mostra o raciocínio — não só a resposta — tem valor formativo que um algoritmo opaco nunca teria. Saber que um painel é recomendado *porque* o tumor é CPNPC avançado, *e* o objetivo é pesquisa de alvo terapêutico, *e* o contexto é primeira linha, é qualitativamente diferente de receber uma recomendação sem justificação.

Por fim, há uma convicção sobre transparência. As decisões de saúde apoiadas em software devem ser auditáveis. As regras clínicas que alimentam este motor estão num ficheiro de texto público, com versão, data de revisão e referências. Qualquer clínico ou investigador pode lê-las, questioná-las ou propor alterações — sem precisar de aceder ao código.

---

## Funcionalidades

- **Catálogo de painéis NGS** com pesquisa por gene, categoria e patologia
- **Classificação por estratégia analítica** (focado / compreensivo / fusão / hematologia / germinativo / farmacogenómica) — eixo independente da categoria de genes, alinhado com o framework de selecção de painéis
- **Motor de recomendação clínica** baseado em regras (tumor + contexto clínico + objetivos terapêuticos)
- **Grau de confiança** da recomendação (alta / moderada / baixa) com critérios explicitados
- **Comparador de painéis** lado a lado
- **Justificação NGS** exportável para integração em relatórios clínicos
- **Dicionário de aliases HGNC** (HER2 → ERBB2, p53 → TP53, etc.)
- **Cobertura de testes** ao motor de regras e dicionário de aliases (Vitest)
- **Error boundary** global com diagnóstico copiável para envio ao desenvolvedor

---

## Arquitetura

```
src/
├── App.jsx                          # Vista principal e composição de UI
├── main.jsx                         # Ponto de entrada (envolvido em ErrorBoundary)
├── ErrorBoundary.jsx                # Captura e apresenta erros de render
├── ruleEngine.js                    # Motor de inferência (scoring + confiança)
├── ruleEngine.test.js               # Testes unitários do motor (Vitest)
├── geneAliases.js                   # Dicionário de aliases HGNC
├── geneAliases.test.js              # Testes do dicionário
├── clinicalRules.json               # Base de conhecimento clínico (auditável)
├── panels.json                      # Catálogo de painéis NGS
├── panelMetadata.js                 # Metadados visuais e de domínio
├── utils.js                         # Utilitários (CSV, download)
└── components/
    ├── Modal.jsx                    # Shell partilhada de modal
    ├── ClinicalExportModal.jsx      # Justificação clínica NGS exportável
    ├── PanelComparator.jsx          # Comparação lado-a-lado de painéis
    └── PanelRecommender.jsx         # Fluxo de recomendação em 3 passos
```

### Motor de recomendação

O motor pontua cada regra clínica contra o input do utilizador:

| Critério         | Pontos | Obrigatório |
|------------------|--------|-------------|
| Tumor (match)    | 10     | Sim         |
| Contexto clínico | +3 cada| Não         |
| Objetivo         | +4 cada| Não         |

**Confiança:** alta (≥2 objetivos, ou ≥1 objetivo + ≥1 contexto) · moderada (≥1 objetivo, ou ≥2 contextos) · baixa (apenas tumor)

**Matching:** case- e diacrítico-insensível (NFKD). Termos curtos (< 4 caracteres) só fazem match como token isolado para evitar falsos positivos (ex.: `LMA` não corresponde a `pulmão`). Aliases HGNC do input do utilizador (HER2, p53, FLT3-3) são resolvidos antes da comparação.

---

## Transparência e auditabilidade

As regras clínicas estão num ficheiro de texto público e versionado, auditável por qualquer clínico ou investigador:

- **Regras clínicas:** [`src/clinicalRules.json`](https://raw.githubusercontent.com/rbleite/Genes_panel/main/src/clinicalRules.json)
- **Código fonte:** [github.com/rbleite/Genes_panel](https://github.com/rbleite/Genes_panel)

---

## Instalação local

```bash
npm install
npm run dev       # servidor de desenvolvimento (Vite)
npm test          # corre a bateria de testes (Vitest)
npm run lint      # verificação estática
npm run build     # build de produção
```

---

## Orientações de referência e bibliografia

As regras clínicas são derivadas das seguintes orientações e publicações de referência:

**ESMO — Recomendações NGS e medicina de precisão**

1. Mosele F, Remon J, Mateo J, et al. Recommendations for the use of next-generation sequencing (NGS) for patients with metastatic cancers: a report from the ESMO Precision Medicine Working Group. *Ann Oncol.* 2020;31(11):1491–1505. [doi:10.1016/j.annonc.2020.07.014](https://doi.org/10.1016/j.annonc.2020.07.014)

2. Mateo J, Chakravarty D, Dienstmann R, et al. A framework to rank genomic alterations as targets for cancer precision medicine: the ESMO Scale for Clinical Actionability of Molecular Targets (ESCAT). *Ann Oncol.* 2018;29(9):1895–1902. [doi:10.1093/annonc/mdy263](https://doi.org/10.1093/annonc/mdy263)

3. Pentheroudakis G (Ed.). *ESMO Clinical Practice Guidelines — Oncology.* European Society for Medical Oncology, 2024. Disponível em: [esmo.org/guidelines](https://www.esmo.org/guidelines)

**NCCN — Orientações clínicas por patologia**

4. National Comprehensive Cancer Network. *NCCN Clinical Practice Guidelines in Oncology.* Versão 2024. Disponível mediante registo em: [nccn.org/guidelines](https://www.nccn.org/guidelines/category_1)

**Nomenclatura génica (HGNC)**

5. Tweedie S, Braschi B, Gray K, et al. Genenames.org: the HGNC and VGNC resources in 2021. *Nucleic Acids Res.* 2021;49(D1):D939–D946. [doi:10.1093/nar/gkaa980](https://doi.org/10.1093/nar/gkaa980)

---

## Roadmap clínico

Direcções consideradas para versões futuras das regras clínicas. Não são compromissos — ficam aqui registadas para informar quem queira contribuir ou rever a base de conhecimento. Estão também enumeradas no campo `meta.futureWork` do [`clinicalRules.json`](src/clinicalRules.json).

### Hierarquização ESCAT dos biomarcadores

Hoje os `goals` de cada regra são tratados como uma lista plana, todos com o mesmo peso na pontuação. Uma direcção natural é distinguir três níveis alinhados com a escala ESCAT (ESMO) e com os tiers AMP/ASCO/CAP:

- **Obrigatório** — biomarcadores que devem ser testados ao diagnóstico (ex.: EGFR/ALK/ROS1 em CPNPC avançado)
- **Acionável** — biomarcadores com terapêutica aprovada mas não-mandatória (ex.: KRAS G12C, ERBB2 em mama)
- **Exploratório** — alvos em ensaios clínicos ou de aprovação recente (ex.: NRG1 em CPNPC, FGFR em vias biliares fora de aprovação local)

A mudança implica novo schema para `goals`, adaptação do motor de scoring para pesos diferenciados, e — sobretudo — curação clínica gene-a-gene de ~450 entradas das regras existentes. O motor pode suportar ambos os formatos durante a transição.

### Anotação ESCAT por par alteração-fármaco

Acima e além da hierarquização dos goals, cada regra pode passar a anotar o **nível ESCAT** (I-A, I-B, II, III, IV-A, V) por par alteração-fármaco. Esta anotação permite mostrar na UI a robustez do suporte clínico para cada recomendação, ajudando o clínico a distinguir, por exemplo, EGFR T790M em CPNPC (ESCAT I-A) de fusões raras em ensaio clínico (ESCAT III-A).

Ambas as direcções pressupõem trabalho de curação clínica autoral, não apenas de engenharia, e devem ser conduzidas com integração nas guidelines vigentes no momento da decisão.

---

## Licença

Distribuído sob a licença **GNU General Public License v3.0**.  
Ver ficheiro [`LICENSE`](./LICENSE) para texto completo.

O uso desta ferramenta em contexto clínico é da responsabilidade exclusiva da instituição e dos profissionais que a utilizam. Os autores não assumem qualquer responsabilidade por decisões clínicas tomadas com base nesta ferramenta.

---

## Autor

**Ricardo B. Leite**  
Patologia Molecular — Serviço de Anatomia Patológica  
ULS Almada-Seixal, Portugal
