// ============================================================
// /api/jarvis · Vercel Serverless Function
// ============================================================
// Proxy seguro a jarvis-route Supabase Edge Function.
// La anon key se inyecta desde env vars · NO se expone al cliente.
// ============================================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://izemgxvytxhpxuzvgexs.supabase.co';
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!ANON_KEY) {
    return res.status(500).json({
      error: 'Server config: SUPABASE_ANON_KEY not set',
      hint: 'Add env var in Vercel project settings'
    });
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/functions/v1/jarvis-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(500).json({
      error: 'Proxy error',
      message: String(e),
    });
  }
}
