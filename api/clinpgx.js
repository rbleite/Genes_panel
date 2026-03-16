async function requestJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gene = String(req.query.gene || '').trim();
  if (!gene) {
    return res.status(400).json({ error: 'Parâmetro gene é obrigatório.' });
  }

  const base = process.env.CLINPGX_API_BASE || 'https://api-beta.clinpgx.org';

  // A API está em beta. Este endpoint usa um default pragmático que pode precisar de ajuste
  // conforme o Swagger ativo da tua instância / versão.
  const candidates = [
    `${base}/v1/data/genes?symbol=${encodeURIComponent(gene)}`,
    `${base}/v1/genes?symbol=${encodeURIComponent(gene)}`,
    `${base}/v1/data/genes/${encodeURIComponent(gene)}`,
  ];

  try {
    for (const candidate of candidates) {
      const { response, data } = await requestJson(candidate);
      if (response.ok) {
        const count = Array.isArray(data) ? data.length : Array.isArray(data?.data) ? data.data.length : undefined;
        return res.status(200).json({
          source: 'ClinPGx',
          query: { gene },
          summary: count != null
            ? `${gene}: ${count} resultado(s) devolvido(s) pela API ClinPGx.`
            : `${gene}: resposta recebida da API ClinPGx.`,
          url: `https://www.clinpgx.org/search?query=${encodeURIComponent(gene)}`,
          raw: data,
          endpointUsed: candidate,
        });
      }
    }

    return res.status(502).json({
      error: 'Não foi possível obter resposta útil da API ClinPGx com os endpoints tentados.',
      tried: candidates,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro inesperado ao consultar ClinPGx.',
      details: error instanceof Error ? error.message : String(error),
      tried: candidates,
    });
  }
}
