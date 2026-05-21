# Gene Panels — Apoio à Decisão em NGS Oncológica

Ferramenta de apoio à decisão clínica para selecção de painéis de sequenciação de nova geração (NGS) em oncologia e hematologia, desenvolvida no âmbito do **Serviço de Patologia Molecular — ULS Almada-Seixal**.

> **Aviso clínico importante**  
> Esta aplicação destina-se exclusivamente a apoio à decisão e **não substitui o juízo clínico** do médico responsável. As recomendações são baseadas em regras clínicas derivadas de orientações ESMO/NCCN e devem ser interpretadas no contexto clínico individual de cada doente. A decisão final é sempre do clínico.

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

As regras clínicas estão num ficheiro JSON público e versionado, auditável por qualquer clínico ou investigador:

- **Regras clínicas:** [`src/clinicalRules.json`](https://github.com/rbleite/Genes_panel/blob/main/src/clinicalRules.json)
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

## Orientações de referência

As regras clínicas são baseadas em:
- ESMO Precision Medicine Working Group guidelines
- NCCN Clinical Practice Guidelines in Oncology
- Nomenclatura oficial HGNC (aliases de genes)

---

## Licença

Distribuído sob a licença **GNU General Public License v2.0**.  
Ver ficheiro [`LICENSE`](./LICENSE) para texto completo.

O uso desta ferramenta em contexto clínico é da responsabilidade exclusiva da instituição e dos profissionais que a utilizam. Os autores não assumem qualquer responsabilidade por decisões clínicas tomadas com base nesta ferramenta.

---

## Autor

**Ricardo B. Leite**  
Patologia Molecular — Serviço de Anatomia Patológica  
ULS Almada-Seixal, Portugal
