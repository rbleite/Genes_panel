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

## Como modificar painéis e regras clínicas

Toda a base de conhecimento está em dois ficheiros JSON editáveis sem tocar no código da aplicação.

### Modificar ou acrescentar um painel de genes (`src/panels.json`)

O ficheiro é uma lista JSON. Cada painel é um objecto com os campos abaixo. Para **acrescentar um painel** copia uma entrada existente e altera os campos; para **modificar** edita a entrada correspondente.

```jsonc
{
  "id": "nome-interno-sem-espacos",       // único, usado em recommendedPanels das regras
  "nome": "Nome completo do painel",
  "categoria": "Somático",                // Somático | Germinativo | Hematológico | Farmacogenómica
  "strategy": "focused",                  // focused | comprehensive | fusion | pharmacogenomics
  "tecnologia": "NGS — amplicons",
  "versao": "1.0",
  "descricao": "Texto livre para a UI.",
  "totalGenes": 188,                      // número de genes únicos no array genes[]
  "genes": ["BRCA1", "BRCA2", "TP53"],    // lista de símbolos HGNC oficiais, ordenada
  "tumorTypes": ["Tumores sólidos"],
  "tags": ["DNA", "Somático"],
  "biomarcadores": ["SNV", "Indel", "CNV", "MSI"],
  "clinicalIndications": [                // indicações clínicas por tumor
    {
      "tumor": "Cancro colorretal",
      "strength": "primeira linha",
      "rationale": "Texto justificativo."
    }
  ],
  "limitations": ["Texto sobre limitação 1."],
  "whenNotToUse": ["Situação em que este painel não é apropriado."],
  "pharmacogenomics": [                   // opcional; omitir se não aplicável
    {
      "drugClass": "Fluoropyrimidines",
      "testContent": "Drug toxicity",
      "drugName": "5-Fu+Leucovorin",
      "gene": "DPYD",
      "dbSNP": "rs3918290",
      "genotype": "CC",
      "annotation": "Associated with decreased risk of drug toxicity",
      "evidenceLevel": "1A"
    }
  ]
}
```

**Regras de validação que a aplicação verifica implicitamente:**
- `id` tem de ser único no ficheiro — duplicados causam ambiguidade nas recomendações.
- Os símbolos em `genes[]` devem ser símbolos HGNC aprovados. Aliases comuns (HER2, p53) são resolvidos automaticamente no motor de pesquisa via `src/geneAliases.js`, mas o catálogo deve usar os símbolos canónicos.
- Se um gene tem alias relevante que o clínico possa pesquisar (ex.: MLL2 para KMT2D), acrescenta-o em `src/geneAliases.js` no formato `"ALIAS": "SIMBOLO_HGNC"`.
- Após alterar `panels.json`, corre `npm test` para confirmar que os testes de cobertura do motor continuam a passar.

---

### Acrescentar ou modificar uma regra clínica (`src/clinicalRules.json`)

As regras estão em `meta.rules[]`. O motor pontua cada regra contra o input do utilizador: **tumor** (10 pts, obrigatório) + **context** (+3 pts cada match) + **goals** (+4 pts cada match).

```jsonc
{
  "id": "id-unico",                        // usado para debug e logs
  "domain": "oncologia",                   // oncologia | hematologia | germinativo
  "label": "Etiqueta visível na UI",
  "tumor": [                               // termos que identificam o tipo tumoral
    "Adenocarcinoma do pulmão", "CPNPC", "Pulmão"
  ],
  "context": [                             // contexto clínico que aumenta a pontuação
    "metastizado", "primeira linha", "EGFR mutado"
  ],
  "goals": [                               // biomarcadores ou objetivos do teste
    "EGFR", "ALK", "ROS1", "KRAS G12C", "fusões"
  ],
  "recommendedPanels": ["dna-tumores-solidos", "fusoes-rna"]  // ids de paineis
}
```

**Pontos importantes:**
- Os termos em `tumor`, `context` e `goals` são comparados de forma insensível a maiúsculas e diacríticos (normalização NFKD). Não é necessário duplicar "tiróide"/"tireoide" — mas incluir ambas as grafias elimina qualquer ambiguidade.
- Termos com menos de 4 caracteres (ex.: LMA, AML, Ph+) fazem match apenas como token isolado, prevenindo falsos positivos por substring.
- O campo `domain` é um filtro rígido: se o utilizador seleccionar "hematologia", só regras com `"domain": "hematologia"` são avaliadas. Mantém o domínio correcto em cada regra.
- `recommendedPanels` deve conter `id`s de painéis existentes em `panels.json`; um id errado não causa erro mas o painel não aparece na recomendação.
- Após editar as regras, actualiza `meta.version` e `meta.lastReviewed`, e corre `npm test`.

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

Distribuído sob a licença **Apache License 2.0**.  
Ver ficheiro [`LICENSE`](./LICENSE) para texto completo.

O uso desta ferramenta em contexto clínico é da responsabilidade exclusiva da instituição e dos profissionais que a utilizam. Os autores não assumem qualquer responsabilidade por decisões clínicas tomadas com base nesta ferramenta.

---

## Autor

**Ricardo B. Leite**  
Patologia Molecular — Serviço de Anatomia Patológica  
ULS Almada-Seixal, Portugal
