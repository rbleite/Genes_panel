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
- **Motor de recomendação clínica** baseado em regras (tumor + contexto clínico + objetivos terapêuticos)
- **Grau de confiança** da recomendação (alta / moderada / baixa) com critérios explicitados
- **Comparador de painéis** lado a lado
- **Justificação NGS** exportável para integração em relatórios clínicos
- **Dicionário de aliases HGNC** (HER2 → ERBB2, p53 → TP53, etc.)

---

## Arquitetura

```
src/
├── App.jsx              # Interface principal (React + Tailwind)
├── clinicalRules.json   # Base de conhecimento clínico (auditável)
├── ruleEngine.js        # Motor de inferência (scoring + confiança)
├── geneAliases.js       # Dicionário de aliases HGNC
└── panels.json          # Catálogo de painéis NGS
```

### Motor de recomendação

O motor pontua cada regra clínica contra o input do utilizador:

| Critério         | Pontos | Obrigatório |
|------------------|--------|-------------|
| Tumor (match)    | 10     | Sim         |
| Contexto clínico | +3 cada| Não         |
| Objetivo         | +4 cada| Não         |

**Confiança:** alta (≥2 objetivos, ou ≥1 objetivo + ≥1 contexto) · moderada (≥1 objetivo, ou ≥2 contextos) · baixa (apenas tumor)

---

## Transparência e auditabilidade

As regras clínicas estão num ficheiro de texto público e versionado, auditável por qualquer clínico ou investigador:

- **Regras clínicas:** [`src/clinicalRules.json`](https://raw.githubusercontent.com/rbleite/Genes_panel/main/src/clinicalRules.json)
- **Código fonte:** [github.com/rbleite/Genes_panel](https://github.com/rbleite/Genes_panel)

---

## Instalação local

```bash
npm install
npm run dev
```

```bash
npm run build   # produção
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

## Licença

Distribuído sob a licença **GNU General Public License v3.0**.  
Ver ficheiro [`LICENSE`](./LICENSE) para texto completo.

O uso desta ferramenta em contexto clínico é da responsabilidade exclusiva da instituição e dos profissionais que a utilizam. Os autores não assumem qualquer responsabilidade por decisões clínicas tomadas com base nesta ferramenta.

---

## Autor

**Ricardo B. Leite**  
Patologia Molecular — Serviço de Anatomia Patológica  
ULS Almada-Seixal, Portugal
