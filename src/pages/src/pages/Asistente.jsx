import { useEffect, useMemo, useRef, useState } from 'react'
import reglas from '../data/reglas.json'
import subs from '../data/subarticulos.json'
import obri from '../data/obri.json'

/* ---------- Búsqueda local en el reglamento ---------- */
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const STOP = new Set('el la los las un una unos unas de del al y o u a en por para con sin que se es son si no lo le les su sus como cuando donde cual cuales hay ha han ser esta este esto eso esa ese mi tu me te muy mas pero ya porque sobre entre'.split(' '))
const stem = w => (w.length > 5 ? w.slice(0, 5) : w)
const tokens = s => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w)).map(stem)

function construirCorpus() {
  const titulos = Object.fromEntries(reglas.map(r => [r.id, `${r.articulo} ${r.titulo}`]))
  const out = []
  subs.forEach(s => out.push({ ref: `Art. ${s.num}`, tit: titulos[s.regla_id] || '', txt: s.resumen_propio }))
  obri.forEach(o => out.push({ ref: `OBRI ${o.num}`, tit: o.art, txt: o.resumen_propio }))
  const docs = out.map(d => ({ ...d, toks: tokens(`${d.tit} ${d.txt}`) }))
  const df = {}
  docs.forEach(d => new Set(d.toks).forEach(t => { df[t] = (df[t] || 0) + 1 }))
  return { docs, df, n: docs.length }
}

function buscar(corpus, pregunta, k = 16) {
  const q = [...new Set(tokens(pregunta))]
  const num = (pregunta.match(/\d+(?:[.-]\d+)?/g) || [])
  const scored = corpus.docs.map(d => {
    const set = new Set(d.toks)
    let sc = 0
    q.forEach(t => { if (set.has(t)) sc += Math.log(1 + corpus.n / (corpus.df[t] || 1)) })
    num.forEach(n => { if (d.ref.endsWith(' ' + n) || d.ref.includes(' ' + n + '.')) sc += 6 })
    return { d, sc }
  }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, k)
  return scored.map(x => `[${x.d.ref}] ${x.d.tit}: ${x.d.txt}`)
}

/* ---------- Voz ---------- */
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null

function hablar(texto, onEnd) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto.replace(/\[|\]/g, ''))
  u.lang = 'es-ES'; u.rate = 1.05
  const v = window.speechSynthesis.getVoices().find(v => v.lang?.startsWith('es') && /google|natural/i.test(v.name)) || window.speechSynthesis.getVoices().find(v => v.lang?.startsWith('es'))
  if (v) u.voice = v
  u.onend = onEnd; u.onerror = onEnd
  window.speechSynthesis.speak(u)
}

const EJEMPLOS = [
  'A pasa el balón, B lo toca con el pie sin querer. ¿Qué se pita?',
  '¿Cuántas faltas de equipo para tiros libres?',
  'Jugador en el aire recibe falta antes de soltar el balón en un tiro de 3.',
]

export default function Asistente() {
  const corpus = useMemo(construirCorpus, [])
  const [texto, setTexto] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [hablando, setHablando] = useState(false)
  const [voz, setVoz] = useState(() => { try { return localStorage.getItem('av_voz') !== '0' } catch { return true } })
  const [chat, setChat] = useState([])
  const [error, setError] = useState('')
  const rec = useRef(null)
  const fin = useRef(null)

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [chat, cargando])
  useEffect(() => () => { window.speechSynthesis?.cancel(); rec.current?.stop?.() }, [])

  async function preguntar(q) {
    q = q.trim()
    if (!q || cargando) return
    setError(''); setTexto(''); setCargando(true)
    setChat(c => [...c, { rol: 'yo', t: q }])
    try {
      const context = buscar(corpus, q)
      const r = await fetch('/api/asistente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'No se pudo consultar')
      setChat(c => [...c, { rol: 'ia', t: data.answer, refs: context.length }])
      if (voz) { setHablando(true); hablar(data.answer, () => setHablando(false)) }
    } catch (e) {
      setError(e.message || 'Error de conexión')
    } finally { setCargando(false) }
  }

  function toggleMic() {
    if (!SR) { setError('Tu navegador no admite voz. Usa Chrome o Safari, o escribe la pregunta.'); return }
    if (escuchando) { rec.current?.stop(); return }
    window.speechSynthesis?.cancel(); setHablando(false); setError('')
    const r = new SR()
    r.lang = 'es-ES'; r.interimResults = true; r.continuous = false
    r.onresult = e => {
      const t = Array.from(e.results).map(x => x[0].transcript).join(' ')
      setTexto(t)
      if (e.results[e.results.length - 1].isFinal) preguntar(t)
    }
    r.onerror = e => { setEscuchando(false); if (e.error === 'not-allowed') setError('Permite el micrófono para usar la voz.') }
    r.onend = () => setEscuchando(false)
    rec.current = r
    setEscuchando(true)
    r.start()
  }

  function toggleVoz() {
    const nv = !voz; setVoz(nv)
    try { localStorage.setItem('av_voz', nv ? '1' : '0') } catch {}
    if (!nv) { window.speechSynthesis?.cancel(); setHablando(false) }
  }

  return (
    <section className="asis">
      <div className="page-head">
        <p className="eyebrow">Asistente</p>
        <h1>Pregúntale al reglamento</h1>
        <p>Habla o escribe una jugada. Razona solo con el reglamento de la app.</p>
      </div>

      <div className="asis-chat">
        {chat.length === 0 && (
          <div className="asis-ej">
            {EJEMPLOS.map(e => <button key={e} className="chip" onClick={() => preguntar(e)}>{e}</button>)}
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className={'asis-msg ' + m.rol}>
            {m.t}
            {m.rol === 'ia' && (
              <button className="asis-play" onClick={() => { setHablando(true); hablar(m.t, () => setHablando(false)) }} aria-label="Escuchar">🔊</button>
            )}
          </div>
        ))}
        {cargando && <div className="asis-msg ia asis-dots"><span /><span /><span /></div>}
        {error && <div className="asis-err">{error}</div>}
        <div ref={fin} />
      </div>

      <div className="asis-bar">
        <button className={'asis-mic' + (escuchando ? ' on' : '')} onClick={toggleMic} aria-label="Hablar">{escuchando ? '■' : '🎤'}</button>
        <form onSubmit={e => { e.preventDefault(); preguntar(texto) }}>
          <input value={texto} onChange={e => setTexto(e.target.value)} placeholder={escuchando ? 'Escuchando…' : 'Describe la jugada o pregunta…'} />
        </form>
        <button className={'asis-vol' + (voz ? ' on' : '')} onClick={hablando ? () => { window.speechSynthesis.cancel(); setHablando(false) } : toggleVoz} aria-label="Voz de respuesta">{hablando ? '⏹' : voz ? '🔊' : '🔇'}</button>
      </div>
      <p className="asis-foot">Orientativo, no oficial. Consulta siempre a un instructor.</p>
    </section>
  )
}
