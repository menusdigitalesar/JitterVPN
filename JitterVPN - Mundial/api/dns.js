// ── Vercel Serverless Function: crear registro DNS en Cloudflare
// Variables de entorno requeridas en Vercel:
//   CF_API_TOKEN  → token de API de Cloudflare (Edit DNS)
//   CF_ZONE_ID    → Zone ID del dominio en Cloudflare
//   CF_DOMAIN     → dominio base (default: jittervpn.dpdns.org)

const CF_API = 'https://api.cloudflare.com/client/v4';

function isValidSubdomain(s) {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(s);
}

function isValidIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { subdomain, ip, plan, price } = req.body ?? {};

  // ── Validaciones
  if (!subdomain || !ip) {
    return res.status(400).json({ error: 'El subdominio y la IP son obligatorios.' });
  }
  if (!isValidSubdomain(subdomain)) {
    return res.status(400).json({
      error: 'Subdominio inválido. Solo letras, números y guiones. Sin espacios ni puntos.'
    });
  }
  if (!isValidIPv4(ip)) {
    return res.status(400).json({
      error: 'IP inválida. Formato correcto: 192.168.1.1'
    });
  }

  const TOKEN  = process.env.CF_API_TOKEN;
  const ZONE   = process.env.CF_ZONE_ID;
  const DOMAIN = process.env.CF_DOMAIN || 'jittervpn.dpdns.org';

  if (!TOKEN || !ZONE) {
    console.error('Faltan variables de entorno: CF_API_TOKEN o CF_ZONE_ID');
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  const recordName = `${subdomain.toLowerCase()}.${DOMAIN}`;

  try {
    // ── 1. Verificar si el subdominio ya existe
    const checkRes = await fetch(
      `${CF_API}/zones/${ZONE}/dns_records?type=A&name=${recordName}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const checkData = await checkRes.json();

    if (!checkData.success) {
      return res.status(502).json({ error: 'Error al verificar el subdominio en Cloudflare.' });
    }

    if (checkData.result.length > 0) {
      return res.status(409).json({
        error: `El subdominio "${subdomain}" ya está en uso. Elegí otro nombre.`
      });
    }

    // ── 2. Crear el registro DNS tipo A
    const createRes = await fetch(`${CF_API}/zones/${ZONE}/dns_records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'A',
        name: recordName,
        content: ip,
        ttl: 1,       // 1 = auto (mínimo TTL)
        proxied: false // DNS only, sin proxy de Cloudflare
      }),
    });

    const createData = await createRes.json();

    if (!createData.success) {
      const msg = createData.errors?.[0]?.message ?? 'Error desconocido de Cloudflare.';
      return res.status(400).json({ error: msg });
    }

    // ── 3. Éxito
    return res.status(200).json({
      success: true,
      domain:  recordName,
      ip:      ip,
      id:      createData.result.id,
      plan:    plan ?? null,
      price:   price ?? null,
    });

  } catch (err) {
    console.error('Error en /api/dns:', err);
    return res.status(500).json({ error: 'Error interno. Intentá de nuevo.' });
  }
}
