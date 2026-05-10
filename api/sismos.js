// ============================================================
// /api/sismos · Vercel Serverless · directo a KRONOS
// ============================================================
// Devuelve sismos últimas 24h + volcanes monitoreados.
// SIN LLM · query directa a Supabase KRONOS · ~200ms.
// ============================================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const KRONOS_URL = process.env.KRONOS_SUPABASE_URL;
  const KRONOS_KEY = process.env.KRONOS_SUPABASE_ANON_KEY;

  if (!KRONOS_URL || !KRONOS_KEY) {
    return res.status(500).json({
      error: 'Server config: KRONOS env vars not set',
      hint: 'Add KRONOS_SUPABASE_URL and KRONOS_SUPABASE_ANON_KEY in Vercel'
    });
  }

  try {
    // Fetch en paralelo · sismos 24h + volcanes
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [sismosRes, volcanesRes] = await Promise.all([
      // Sismos últimas 24h
      fetch(
        `${KRONOS_URL}/rest/v1/v_move_sismologia_eventos?` +
        `select=evento_id,timestamp_origen,magnitud,magnitud_tipo,profundidad_km,latitud,longitud,fuente_externa,severidad,intensidad_max_mercalli&` +
        `timestamp_origen=gte.${since24h}&` +
        `order=timestamp_origen.desc&limit=100`,
        {
          headers: {
            'apikey': KRONOS_KEY,
            'Authorization': `Bearer ${KRONOS_KEY}`,
          },
        }
      ),
      // Volcanes
      fetch(
        `${KRONOS_URL}/rest/v1/v_volcanes_estado?` +
        `select=volcan_id,nombre,tipo,estado_actividad,lat,lng,elevacion_m,nivel_alerta_actual,forecast_mensaje,anomalias_termicas_24h,so2_max_7d&` +
        `order=nombre.asc`,
        {
          headers: {
            'apikey': KRONOS_KEY,
            'Authorization': `Bearer ${KRONOS_KEY}`,
          },
        }
      ),
    ]);

    if (!sismosRes.ok) {
      const err = await sismosRes.text();
      return res.status(500).json({ error: 'Sismos query failed', details: err });
    }
    if (!volcanesRes.ok) {
      const err = await volcanesRes.text();
      return res.status(500).json({ error: 'Volcanes query failed', details: err });
    }

    const sismos = await sismosRes.json();
    const volcanes = await volcanesRes.json();

    // Agregados rápidos
    const total = sismos.length;
    const maxMag = sismos.length > 0
      ? Math.max(...sismos.map(s => Number(s.magnitud) || 0))
      : 0;
    const severos = sismos.filter(s => Number(s.magnitud) >= 4.0).length;
    const ultimoSismo = sismos[0] || null;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      sismos: {
        total,
        max_magnitud: maxMag,
        severos,  // count M>=4
        ultimo: ultimoSismo,
        eventos: sismos,  // todos los detalles para markers
      },
      volcanes: {
        total: volcanes.length,
        con_alerta: volcanes.filter(v => v.nivel_alerta_actual && v.nivel_alerta_actual !== 'NORMAL').length,
        lista: volcanes,
      },
    });
  } catch (e) {
    return res.status(500).json({
      error: 'Fetch error',
      message: String(e),
    });
  }
}
