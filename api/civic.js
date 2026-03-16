export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gene = String(req.query.gene || '').trim();
  if (!gene) {
    return res.status(400).json({ error: 'Parâmetro gene é obrigatório.' });
  }

  const query = `
    query GeneSummary($name: String!) {
      genes(name: $name) {
        nodes {
          id
          name
          variants {
            totalCount
          }
          molecularProfiles {
            totalCount
          }
          evidenceItems {
            totalCount
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://civicdb.org/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { name: gene } }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.errors) {
      return res.status(response.ok ? 502 : response.status).json({
        error: 'Falha ao consultar CIViC.',
        details: payload?.errors || payload,
      });
    }

    const node = payload?.data?.genes?.nodes?.[0] || null;

    return res.status(200).json({
      source: 'CIViC',
      query: { gene },
      summary: node
        ? `${node.name}: ${node.variants?.totalCount ?? 0} variante(s), ${node.molecularProfiles?.totalCount ?? 0} molecular profile(s), ${node.evidenceItems?.totalCount ?? 0} evidence item(s).`
        : `Sem entrada CIViC encontrada para ${gene}.`,
      evidenceItemCount: node?.evidenceItems?.totalCount ?? 0,
      variantCount: node?.variants?.totalCount ?? 0,
      molecularProfileCount: node?.molecularProfiles?.totalCount ?? 0,
      url: `https://civicdb.org/search?query=${encodeURIComponent(gene)}`,
      raw: payload,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro inesperado ao consultar CIViC.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
