// Función serverless de Vercel. La clave vive SOLO aquí (variable GEMINI_API_KEY).
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const REGLAS = `Eres el Árbitro Virtual, asistente de consulta para árbitros de baloncesto (reglamento FIBA).
REGLAS ESTRICTAS:
1. Usa SOLO el REGLAMENTO suministrado abajo. Nunca uses conocimiento externo ni inventes artículos o números.
2. Si la pregunta es una situación de juego, razónala paso a paso con los artículos suministrados y da la decisión: qué se sanciona, quién ejecuta, dónde se reanuda el juego y cómo queda el reloj de juego/24s si el texto lo permite.
3. Cita siempre el artículo o fuente entre paréntesis, p. ej. (Art. 33.2) u (OBRI 4-1).
4. Si el reglamento suministrado no cubre la situación, responde exactamente: "No encuentro eso en el reglamento cargado; consulta a un instructor."
5. Si faltan datos clave (p. ej. si el balón estaba en el aire), indica en una frase qué dato cambia la decisión.
6. Español claro y directo, máximo 5 oraciones cortas, sin listas ni formato (se leerá en voz alta).
7. Termina SIEMPRE con: "Orientativo, no oficial."`

async function llamar(key, prompt, conThinking) {
  const generationConfig = { temperature: 0.2, maxOutputTokens: 1200 }
  if (conThinking) generationConfig.thinkingConfig = { thinkingBudget: 512 }
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig }),
  })
}

async function openrouter(key, prompt) {
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0.2, max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await r.json()
  if (!r.ok) throw Object.assign(new Error(data?.error?.message || 'Error de OpenRouter'), { upstream: true })
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  const key = process.env.GEMINI_API_KEY
  const orKey = process.env.OPENROUTER_API_KEY
  if (!key && !orKey) return res.status(500).json({ error: 'Falta GEMINI_API_KEY u OPENROUTER_API_KEY en Vercel' })
  try {
    const { question, context } = req.body || {}
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Falta la pregunta' })
    const ctx = (Array.isArray(context) ? context.join('\n') : String(context || '')).slice(0, 24000)
    const prompt = `${REGLAS}\n\nREGLAMENTO:\n${ctx || '(sin resultados)'}\n\nPREGUNTA DEL ÁRBITRO:\n${question.slice(0, 800)}`
    if (orKey) {
      const answer = await openrouter(orKey, prompt)
      return res.status(200).json({ answer: answer || 'No obtuve respuesta, intenta de nuevo.' })
    }
    let r = await llamar(key, prompt, true)
    if (r.status === 400) r = await llamar(key, prompt, false)
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'Error de Gemini' })
    const parts = data?.candidates?.[0]?.content?.parts || []
    const answer = parts.map(p => p.text || '').join('').trim()
    return res.status(200).json({ answer: answer || 'No obtuve respuesta, intenta de nuevo.' })
  } catch (e) {
    if (e.upstream) return res.status(502).json({ error: e.message })
    return res.status(500).json({ error: 'Error interno del asistente' })
  }
}
