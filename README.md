# bolt_pro

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-bypzrcvj)

## Despliegue en producción (Vercel + backend en Contabo)

1. Vercel → importa este repositorio; *Production Branch*: `integration`. `vercel.json` ya configura Vite, las rutas de la SPA, el sitemap de vitrinas y las cabeceras de seguridad.
2. Variables de entorno (Production), se incrustan al compilar:
   - `VITE_API_URL=https://api.tudominio.com` (sin `/` final)
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL=https://app.tudominio.com`
   - `VITE_MOSTRAR_CREDENCIALES_DEMO=false`
   - `VITE_GLITCHTIP_DSN` (opcional)
3. Agrega tu dominio en *Settings → Domains* y ponlo (junto al `.vercel.app`) en `CORS_ORIGIN` del backend.

Guía completa, incluido el servidor: `docs/DESPLIEGUE-CONTABO.md` en el repositorio del backend.

## Despliegue de demostración

`vercel.json` deja el frontend listo para Vercel (rutas internas sin 404 al recargar). La guía completa, con backend en Render, Supabase y Upstash — todo en planes gratis — está en el repositorio del backend: `docs/DESPLIEGUE-DEMO.md`. En Vercel, la *Production Branch* debe ser `integration`.

