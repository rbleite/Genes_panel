const CIVIC_GRAPHQL = 'https://civicdb.org/api/graphql';
const CIVIC_BASE = 'https://civicdb.org';
const TIMEOUT_MS = 8000;

// CIViC API v2. Genes are filtered by `entrezSymbols` (the older `name`
// argument was removed), and the per-gene counts live under `stats`
// (previously `variants`/`molecularProfiles`/`evidenceItems` on Gene).
const QUERY = `
  query GeneSummary($symbols: [String!]) {
    genes(entrezSymbols: $symbols, first: 1) {
      nodes {
        id
        name
        entrezId
        link
        stats {
          variantCount
          molecularProfileCount
          evidenceItemCount
          assertionCount
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gene = String(req.query.gene || '').trim();
  if (!gene) {
    return res.status(400).json({ error: 'Parâmetro gene é obrigatório.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CIVIC_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { symbols: [gene.toUpperCase()] } }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.errors) {
      return res.status(response.ok ? 502 : response.status).json({
        error: 'Falha ao consultar CIViC.',
        details: payload?.errors || payload,
      });
    }

    const node = payload?.data?.genes?.nodes?.[0] || null;
    const stats = node?.stats || {};

    return res.status(200).json({
      source: 'CIViC',
      query: { gene },
      summary: node
        ? `${node.name}: ${stats.variantCount ?? 0} variante(s), ${stats.molecularProfileCount ?? 0} perfil(is) molecular(es), ${stats.evidenceItemCount ?? 0} evidence item(s), ${stats.assertionCount ?? 0} assertion(s).`
        : `Sem entrada CIViC encontrada para ${gene}.`,
      evidenceItemCount: stats.evidenceItemCount ?? 0,
      variantCount: stats.variantCount ?? 0,
      molecularProfileCount: stats.molecularProfileCount ?? 0,
      assertionCount: stats.assertionCount ?? 0,
      // `link` is a relative path (e.g. /features/4941); fall back to search.
      url: node?.link
        ? `${CIVIC_BASE}${node.link}`
        : `${CIVIC_BASE}/search?query=${encodeURIComponent(gene)}`,
    });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return res.status(aborted ? 504 : 500).json({
      error: aborted
        ? `CIViC não respondeu em ${TIMEOUT_MS / 1000}s.`
        : 'Erro inesperado ao consultar CIViC.',
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timer);
  }
}
