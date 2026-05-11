// ============================================================
// /api/widget · Vercel Serverless
// ============================================================
// Endpoint optimizado para widget iOS Scriptable.
// Devuelve datos compactos · sismos + iAgri en 1 request.
// Detecta urgencias (M>=4 · alertas IoT · volcanes activos).
// Cache: 5 min (consistente con widget update de 15 min).
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const KRONOS_URL = process.env.KRONOS_SUPABASE_URL;
  const KRONOS_KEY = process.env.KRONOS_SUPABASE_ANON_KEY;
  const IAGRI_URL = process.env.IAGRI_SUPABASE_URL || 'https://crfghwtfqaplzsmwylxe.supabase.co';
  const IAGRI_KEY = process.env.IAGRI_SUPABASE_ANON_KEY;

  if (!KRONOS_URL || !KRONOS_KEY) {
    return res.status(500).json({ error: 'KRONOS env vars not set' });
  }

  try {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    // 3 queries en paralelo
    const [sismosRes, volcanesRes, coopRes] = await Promise.allSettled([
      // Sismos 24h
      fetch(
        `${KRONOS_URL}/rest/v1/v_move_sismologia_eventos?` +
        `select=magnitud,timestamp_origen,profundidad_km,severidad&` +
        `timestamp_origen=gte.${since24h}&` +
        `order=timestamp_origen.desc&limit=20`,
        {
          headers: { 'apikey': KRONOS_KEY, 'Authorization': `Bearer ${KRONOS_KEY}` },
        }
      ),
      // Volcanes
      fetch(
        `${KRONOS_URL}/rest/v1/v_volcanes_estado?` +
        `select=nombre,nivel_alerta_actual,estado_actividad`,
        {
          headers: { 'apikey': KRONOS_KEY, 'Authorization': `Bearer ${KRONOS_KEY}` },
        }
      ),
      // Coopedota dashboard (sin key requerida · es vista pública)
      IAGRI_KEY ? fetch(
        `${IAGRI_URL}/rest/v1/v_dashboard_coopedota?select=productores_activos,fincas_activas,hectareas_totales,calificacion_promedio,pedidos_30d&limit=1`,
        {
          headers: { 'apikey': IAGRI_KEY, 'Authorization': `Bearer ${IAGRI_KEY}` },
        }
      ) : Promise.resolve(null),
    ]);

    // Procesar sismos
    let sismosData = { total_24h: 0, max_mag: 0, ultimo_mag: 0, ultimo_hora_iso: null, severos: 0 };
    if (sismosRes.status === 'fulfilled' && sismosRes.value.ok) {
      const sismos = await sismosRes.value.json();
      sismosData.total_24h = sismos.length;
      if (sismos.length > 0) {
        sismosData.max_mag = Math.max(...sismos.map(s => Number(s.magnitud) || 0));
        sismosData.ultimo_mag = Number(sismos[0].magnitud) || 0;
        sismosData.ultimo_hora_iso = sismos[0].timestamp_origen;
        sismosData.severos = sismos.filter(s => Number(s.magnitud) >= 4.0).length;
      }
    }

    // Procesar volcanes
    let volcanesData = { monitoreados: 0, con_alerta: 0, lista_alerta: [] };
    if (volcanesRes.status === 'fulfilled' && volcanesRes.value.ok) {
      const volcanes = await volcanesRes.value.json();
      volcanesData.monitoreados = volcanes.length;
      const conAlerta = volcanes.filter(v => v.nivel_alerta_actual && v.nivel_alerta_actual !== 'NORMAL');
      volcanesData.con_alerta = conAlerta.length;
      volcanesData.lista_alerta = conAlerta.map(v => v.nombre);
    }

    // Procesar Coopedota
    let coopedota = { productores: null, fincas: null, hectareas: null };
    if (coopRes && coopRes.status === 'fulfilled' && coopRes.value && coopRes.value.ok) {
      const coopJson = await coopRes.value.json();
      if (coopJson[0]) {
        coopedota.productores = coopJson[0].productores_activos;
        coopedota.fincas = coopJson[0].fincas_activas;
        coopedota.hectareas = coopJson[0].hectareas_totales;
      }
    }

    // Detectar urgencia
    let urgente = false;
    let alerta_texto = null;
    let alerta_nivel = 'normal'; // normal | warning | critical

    if (sismosData.max_mag >= 4.5) {
      urgente = true;
      alerta_nivel = 'critical';
      alerta_texto = `Sismo M${sismosData.max_mag.toFixed(1)} en últimas 24h`;
    } else if (sismosData.max_mag >= 4.0) {
      urgente = true;
      alerta_nivel = 'warning';
      alerta_texto = `${sismosData.severos} sismo${sismosData.severos > 1 ? 's' : ''} M≥4 en 24h`;
    } else if (volcanesData.con_alerta > 0) {
      urgente = true;
      alerta_nivel = 'warning';
      alerta_texto = `${volcanesData.con_alerta} volcán${volcanesData.con_alerta > 1 ? 'es' : ''} con alerta`;
    }

    return res.status(200).json({
      ts: new Date().toISOString(),
      sismos: sismosData,
      volcanes: volcanesData,
      iagri: {
        coopedota: coopedota,
      },
      urgente: urgente,
      alerta_nivel: alerta_nivel,
      alerta_texto: alerta_texto,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Widget data fetch error', message: String(e) });
  }
}
