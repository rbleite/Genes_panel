# Histórico de alterações

Alterações relevantes de cada versão. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-PT/1.1.0/); numeração segundo [SemVer](https://semver.org/lang/pt-PT/).

A aplicação, as regras clínicas (`src/clinicalRules.json`) e os dados de cobertura (`src/geneCoverage.json`) têm **versões independentes**. O rodapé da aplicação mostra a versão da aplicação e a das regras.

---

## [2.0.2] — 2026-10-16

### Alterado
- Rodapé: a autoria passa a indicar apenas o nome do autor, sem afiliação institucional.

---

## [2.0.1] — 2026-10-16

Distribuída com **regras clínicas v1.8.1** e **dados de cobertura v1.0.1** (sem alterações).

### Segurança e privacidade
- Retirados o logótipo e a sigla institucional do cabeçalho e do título da página, até à autorização formal de utilização da marca.
- Removido o Vercel Web Analytics: a página deixa de enviar pedidos de telemetria e não usa cookies.
- Nova secção **Acerca e privacidade** no rodapé: responsável, finalidade, alojamento, dados tratados e contacto.
- Aviso "não introduzir dados identificativos de doentes" na pesquisa, no recomendador e na consulta de evidência.
- Cabeçalhos de segurança: Content-Security-Policy, X-Content-Type-Options, Referrer-Policy e Permissions-Policy. A incorporação em iframe não é bloqueada, para não interromper a ligação ao ePM.

---

## [2.0.0] — 2026-10-09

Distribuída com **regras clínicas v1.8.1** e **dados de cobertura v1.0.1** (ambos revistos a 2026-09-21).

### Alterações incompatíveis
- O painel hematológico `dna-rna-hemato` foi dividido nos seus dois componentes, que são pedidos e reportados em separado: `dna-hemato` (208 genes — mutações, CNV e fusões por ADN) e `rna-hemato` (94 genes — fusões por RNA). Ligações ou selecções guardadas com o identificador antigo deixam de funcionar.
- Símbolos de genes actualizados para a nomenclatura HGNC actual em todos os painéis (54 renomeações, p. ex. MLL → KMT2A, H3F3A → H3-3A, MRE11A → MRE11, WHSC1 → NSD2). Os nomes antigos continuam pesquisáveis.

### Adicionado
- **Cobertura por gene** no painel de 188 genes: CDS completo, exões dirigidos, só parceiro de fusão, promotor ou não reportado, com regiões e transcrito de referência.
- **ADN ou ADN + RNA** — cada entidade hematológica explica, no recomendador, porque precisa de um ou dos dois componentes.
- Classificação dos painéis por **estratégia analítica** (focado, compreensivo, fusão, hematologia, germinativo, farmacogenómica).
- Selector de domínio no recomendador e aviso clínico permanente no rodapé.
- Novas regras e alinhamento com o documento institucional de selecção de painéis (regras v1.0.0 → v1.8.1): colangiocarcinoma, tumores pediátricos, glândulas salivares, CPNPC em estudo único compreensivo, neoplasias com eosinofilia, Waldenström, histiocitoses e predisposição mieloide hereditária, entre outras.
- Testes automáticos (Vitest): motor de regras, aliases, cobertura, integridade dos painéis e das regras, e endpoints de API.
- *Error boundary* global com diagnóstico copiável.
- Metadados de citação (`CITATION.cff`) e este histórico.

### Alterado
- Painel de 188 genes actualizado com a lista completa do fornecedor e o componente PGx.
- Amostras hematológicas: sangue periférico ou medula óssea em EDTA, conforme a validação do fornecedor; tecido em FFPE requer validação interna.
- Modais extraídos para componentes próprios; licença Apache 2.0.
- A versão mostrada no rodapé passa a ser lida de `package.json`.

### Corrigido
- **CIViC** — consulta reparada após a mudança do schema GraphQL (API v2), com *timeout*.
- **OncoKB** — sem licença institucional, a aplicação explica que o serviço está indisponível em vez de falhar em silêncio.
- **Promotor TERT** — os hotspots C228T e C250T estão cobertos no painel de 188 genes; a ressalva dizia o contrário.
- **Linfomas** — a regra afirmava que o RNA confirmava *double/triple hit*; BCL2 e BCL6 não têm cobertura de fusão e a avaliação exige FISH.
- **Nomenclatura** — MECOM listado como EVI1 no componente de ADN; aliases MRTF invertidos; alias `MAL` que desviava para outro gene.

### Segurança
- Dependências actualizadas: `npm audit` sem vulnerabilidades.

---

## [1.0.0] — 2026-05-20

Primeira versão com motor de regras clínicas: catálogo de painéis, pesquisa multigene com aliases, recomendador por tipo tumoral, contexto e objectivos, comparador de painéis e justificação NGS exportável.

[2.0.2]: https://github.com/rbleite/Genes_panel/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/rbleite/Genes_panel/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/rbleite/Genes_panel/compare/ddd743f...v2.0.0
[1.0.0]: https://github.com/rbleite/Genes_panel/tree/ddd743f
