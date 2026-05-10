# JARVIS · Akasha SEC

Asistente IA de **Alejandría Steam Labs** · 3 modos de operación · deploy en Vercel.

> "Pensar complejo lo hace Claude. Operar rápido lo hace Jarvis. Recordar todo lo hace KRONOS."

## 🎯 Modos disponibles

| URL | Modo | Para qué sirve |
|---|---|---|
| `/` | Landing | Selector de modo · holograma central |
| `/kiosk` | Conversacional | Chat con Jarvis · texto + voz iOS |
| `/move` | Dashboard MOVE | Mapa sismos en vivo · volcanes · alertas |
| `/wallpaper` | Wallpaper | Holograma fullscreen sin UI · ideal para iOS Set As Wallpaper |

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│  CLIENTE (browser · iOS · Android · Mac · Pi)            │
│   /kiosk  /move  /wallpaper                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │  fetch /api/jarvis (POST)
                     ↓
┌──────────────────────────────────────────────────────────┐
│  VERCEL · /api/jarvis.js                                 │
│   - Inyecta SUPABASE_ANON_KEY desde env var              │
│   - Proxy a edge function jarvis-route                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │  Authorization: Bearer <ANON_KEY>
                     ↓
┌──────────────────────────────────────────────────────────┐
│  SUPABASE STELLA MARIS · jarvis-route                    │
│   - Clasifica intent · enruta a dominio                  │
│   - jarvis-domain-idworld (sismos · volcanes)            │
│   - jarvis-domain-iagri (futuro · cosechas · IoT)        │
│   - jarvis-domain-fabiola (futuro · agenda)              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
            KRONOS Supabase (BD time-series)
            v_move_sismologia_eventos · v_volcanes_estado
```

## ⚙️ Setup local

```bash
git clone https://github.com/jmpmcr73-svg/jarvis.git
cd jarvis
npm run dev
# → http://localhost:8080
```

## 🚀 Deploy en Vercel

### Variables de entorno requeridas

En **Vercel project settings → Environment Variables**:

| Variable | Valor | Nota |
|---|---|---|
| `SUPABASE_URL` | `https://izemgxvytxhpxuzvgexs.supabase.co` | Stella Maris project |
| `SUPABASE_ANON_KEY` | `sb_publishable_K5yxCT...` | Anon key · NO service_role |

### Deploy

```bash
vercel --prod
# O: push a main branch · auto-deploy si conectado a GitHub
```

## 📱 PWA · Instalable como app

### iPhone / iPad · Safari

1. Abrí `https://jarvis.idworld.live`
2. Tocá ⎋ (share)
3. "Add to Home Screen"
4. Listo · ahora aparece como app nativa

### Android · Chrome

1. Abrí la URL
2. Menú → "Add to Home Screen"
3. Listo

## 🖼️ Wallpaper iOS · cómo configurar

### Opción A · Modo simple

Abrí `/wallpaper` en Safari · pinch-zoom out · screenshot · usá como wallpaper.

### Opción B · Live wallpaper con Shortcuts

Aún no soportado nativamente · alternativa: usá el modo `Standby` de iPhone (iOS 17+) con `/wallpaper` abierto fullscreen mientras carga el celular.

## 🔑 Custom Domain

```
jarvis.idworld.live → CNAME → cname.vercel-dns.com
```

Configurar en Vercel → Domains → Add · seguir instrucciones DNS.

## 🤖 Bot Telegram = Jarvis

El bot **`@Jesmph_bot`** (existente · usado para MOVE) es el orquestador de Jarvis. Al recibir mensaje:

```
Usuario → @Jesmph_bot
            ↓
       Bot procesa
            ↓
    POST a /api/jarvis (este Vercel)
            ↓
       Respuesta texto + audio MP3
            ↓
        Usuario escucha
```

Setup del webhook se hace desde el bot mismo (sprint siguiente).

## 📂 Estructura

```
jarvis/
├── public/
│   ├── index.html       Landing con holograma + selector
│   ├── kiosk.html       Conversacional · TTS web · texto
│   ├── wallpaper.html   Modo holograma fullscreen
│   ├── move.html        Dashboard MOVE · mapa Leaflet sismos
│   ├── manifest.json    PWA manifest
│   ├── icon-192.png     Icono PWA
│   ├── icon-512.png     Icono PWA grande
│   └── jarvis-holo.png  Imagen central holograma
├── api/
│   └── jarvis.js        Vercel serverless · proxy a Supabase
├── package.json
├── vercel.json          Rewrites · headers · clean URLs
└── README.md
```

## 🛣️ Roadmap

### v1.0 (actual)
- ✅ 3 modos: kiosk · move · wallpaper
- ✅ TTS web (voz iOS Mónica/Diego)
- ✅ Mapa sismos Leaflet
- ✅ PWA installable
- ✅ Proxy seguro Vercel · sin exponer keys

### v1.1 (próximo sprint)
- 🔧 Bot Telegram conectado
- 🔧 Audio MP3 con voz Piper desde Pi
- 🔧 Reconocimiento de voz nativo (Telegram audio)
- 🔧 Smart wallpaper con datos en vivo

### v1.2 (semana 2)
- 🔧 Dominio iAgri (Coopedota · Hidroexpo · IoT)
- 🔧 Multi-usuario (María · Juan Pablo · Santiago)
- 🔧 Live wallpaper iOS con sismos en tiempo real

### v2.0 (semana 4)
- 🔧 Cámara face-detection en kiosk
- 🔧 Personalización por persona detectada
- 🔧 MCP server expuesto a Claude.ai (acceso a BD)

## 📞 Contacto

Jose Pinto Mesen · Alejandría Steam Labs · BIOTEC SV S.A.S. de C.V.
El Salvador · 2026
