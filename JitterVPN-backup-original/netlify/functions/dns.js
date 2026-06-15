// Netlify Function: crear registro DNS A en Cloudflare
// POST /.netlify/functions/dns  { subdomain, ip }

const CF_API = 'https://api.cloudflare.com/client/v4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  let subdomain, ip;
  try {
    ({ subdomain, ip } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  if (!subdomain || !ip) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Faltan campos requeridos.' }) };
  }
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Subdominio inválido.' }) };
  }
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'IP inválida.' }) };
  }

  const TOKEN  = process.env.CF_API_TOKEN;
  const ZONE   = process.env.CF_ZONE_ID;
  const DOMAIN = process.env.CF_DOMAIN || 'jittervpn.dpdns.org';

  if (!TOKEN || !ZONE) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Configuración del servidor incompleta.' }) };
  }

  const recordName = `${subdomain.toLowerCase()}.${DOMAIN}`;

  // Verificar si ya existe
  const checkRes = await fetch(
    `${CF_API}/zones/${ZONE}/dns_records?type=A&name=${recordName}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const checkData = await checkRes.json();
  if (!checkData.success) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Error al consultar Cloudflare.' }) };
  }
  if (checkData.result.length > 0) {
    return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'El subdominio ya está en uso.' }) };
  }

  // Crear registro
  const createRes = await fetch(`${CF_API}/zones/${ZONE}/dns_records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'A', name: recordName, content: ip, ttl: 1, proxied: false }),
  });
  const createData = await createRes.json();
  if (!createData.success) {
    const msg = createData.errors?.[0]?.message || 'Error al crear el registro.';
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: msg }) };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      success: true,
      domain: recordName,
      ip,
      id: createData.result.id,
    }),
  };
};
