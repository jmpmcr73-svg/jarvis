// ============================================================
// /api/config · Vercel Serverless
// ============================================================
// Devuelve configuración pública (Mapbox token, etc) al frontend.
// El token Mapbox es `pk.` público pero lo servimos desde env var
// para poder cambiarlo sin redeploy del frontend.
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    mapbox_token: process.env.MAPBOX_TOKEN || null,
    timestamp: new Date().toISOString(),
  });
}
