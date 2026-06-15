// Netlify Function: verificar disponibilidad de subdominio
// GET /.netlify/functions/check?subdomain=vpn

const CF_API = 'https://api.cloudflare.com/client/v4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  const { subdomain } = event.queryStringParameters || {};
  if (!subdomain) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Falta el subdominio.' }) };
  }

  const TOKEN  = process.env.CF_API_TOKEN;
  const ZONE   = process.env.CF_ZONE_ID;
  const DOMAIN = process.env.CF_DOMAIN || 'jittervpn.dpdns.org';

  if (!TOKEN || !ZONE) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Configuración incompleta.' }) };
  }

  const recordName = `${subdomain.toLowerCase()}.${DOMAIN}`;

  try {
    const r = await fetch(
      `${CF_API}/zones/${ZONE}/dns_records?type=A&name=${recordName}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const data = await r.json();
    if (!data.success) {
      const cfError = data.errors?.[0]?.message || JSON.stringify(data.errors);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: `CF: ${cfError}` }) };
    }
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ available: data.result.length === 0, domain: recordName }),
    };
  } catch {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Error interno.' }) };
  }
};
