export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.ONCOKB_API_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'ONCOKB_API_TOKEN não configurado no ambiente.',
    });
  }

  const gene = String(req.query.gene || '').trim();
  const alteration = String(req.query.alteration || '').trim();
  const tumorType = String(req.query.tumorType || '').trim();
  const referenceGenome = String(req.query.referenceGenome || 'GRCh37').trim();

  if (!gene || !alteration || !tumorType) {
    return res.status(400).json({
      error: 'OncoKB requer gene, alteration e tumorType para esta rota.',
    });
  }

  const url = new URL('https://www.oncokb.org/api/v1/annotate/mutations/byProteinChange');
  url.searchParams.set('hugoSymbol', gene);
  url.searchParams.set('alteration', alteration);
  url.searchParams.set('tumorType', tumorType);
  url.searchParams.set('referenceGenome', referenceGenome);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || 'Falha ao consultar OncoKB.',
        details: data,
      });
    }

    return res.status(200).json({
      source: 'OncoKB',
      query: { gene, alteration, tumorType, referenceGenome },
      summary: [
        data?.oncogenic ? `Oncogenicidade: ${data.oncogenic}` : null,
        data?.mutationEffect ? `Efeito: ${data.mutationEffect?.knownEffect || data.mutationEffect}` : null,
        data?.highestSensitiveLevel ? `Highest sensitive level: ${data.highestSensitiveLevel}` : null,
      ]
        .filter(Boolean)
        .join(' • '),
      highestSensitiveLevel: data?.highestSensitiveLevel || null,
      url: `https://www.oncokb.org/gene/${encodeURIComponent(gene)}`,
      raw: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro inesperado ao consultar OncoKB.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
