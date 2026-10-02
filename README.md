# Árbitro Virtual

PWA con tres cosas: Asistente de voz, Reglamento y OBRI.

## Despliegue (GitHub + Vercel)
- Vercel → Root Directory = `cjoba-arbitros` (si el repo tiene esa subcarpeta).
- Variable de entorno: `GEMINI_API_KEY` (clave gratis en https://aistudio.google.com/apikey), luego Redeploy.
- Alternativa: `OPENROUTER_API_KEY` (tiene prioridad; modelo opcional `OPENROUTER_MODEL`).
- Modelo Gemini opcional: `GEMINI_MODEL` (por defecto `gemini-2.5-flash`).

La clave solo vive en `api/asistente.js` (servidor).
