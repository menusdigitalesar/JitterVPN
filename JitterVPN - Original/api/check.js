// ── Vercel Serverless Function: verificar disponibilidad de subdominio
// GET /api/check?subdomain=vpn

const CF_API = 'https://api.cloudflare.com/client/v4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { subdomain } = req.query;
  if (!subdomain) return res.status(400).json({ error: 'Falta el subdominio.' });

  const TOKEN  = process.env.CF_API_TOKEN;
  const ZONE   = process.env.CF_ZONE_ID;
  const DOMAIN = process.env.CF_DOMAIN || 'jittervpn.dpdns.org';

  if (!TOKEN || !ZONE) return res.status(500).json({ error: 'Configuración incompleta.' });

  const recordName = `${subdomain.toLowerCase()}.${DOMAIN}`;

  try {
    const r = await fetch(
      `${CF_API}/zones/${ZONE}/dns_records?type=A&name=${recordName}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const data = await r.json();
    if (!data.success) return res.status(502).json({ error: 'Error al consultar Cloudflare.' });

    return res.status(200).json({
      available: data.result.length === 0,
      domain: recordName,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno.' });
  }
}
