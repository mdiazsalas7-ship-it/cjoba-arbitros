import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../auth.jsx'
import trivia from '../data/trivia.json'

const SHOT_CLOCK = 24
const LB_SIZE = 5
const LB_KEY = 'cjoba_leaderboard'
const BEST_KEY = 'cjoba_mejor_racha'

const LEVELS = [
  { min: 0, t: 'Aspirante' },
  { min: 3, t: 'Árbitro provincial' },
  { min: 6, t: 'Árbitro nacional' },
  { min: 12, t: 'Árbitro FIBA' },
  { min: 20, t: 'Leyenda · Juego de Estrellas' },
]

const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1])
const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p) } catch (_) {} }
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (_) { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (_) {} }

export default function Juegos() {
  const { user, nombre } = useAuth()
  const [deck, setDeck] = useState(() => shuffle(trivia))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => load(BEST_KEY, 0))
  const [board, setBoard] = useState(() => load(LB_KEY, []))
  const [boardKind, setBoardKind] = useState('local')
  const [timeLeft, setTimeLeft] = useState(SHOT_CLOCK)
  const [levelUp, setLevelUp] = useState(false)
  const [recordPrompt, setRecordPrompt] = useState(false)
  const initialsRef = useRef(null)

  const q = deck[i]
  const correct = (q.correcta || '').trim().toUpperCase()
  const answered = picked !== null
  const opts = useMemo(() => ([
    { k: 'A', t: q.opcion_a }, { k: 'B', t: q.opcion_b }, { k: 'C', t: q.opcion_c }, { k: 'D', t: q.opcion_d },
  ].filter(o => o.t !== '')), [q])

  const level = LEVELS.reduce((p, c) => (best >= c.min ? c : p), LEVELS[0])
  const next = LEVELS.find(l => l.min > best)
  const progress = next ? ((best - level.min) / (next.min - level.min)) * 100 : 100

  // Ranking compartido (Firestore) + mejor racha del usuario
  async function loadShared() {
    try {
      const snap = await getDocs(collection(db, 'ranking'))
      const list = snap.docs.map(d => d.data()).filter(x => x && x.score)
      list.sort((a, b) => b.score - a.score)
      setBoard(list.slice(0, LB_SIZE).map(x => ({ initials: x.nombre, score: x.score })))
      setBoardKind('comunidad')
    } catch (_) { /* sin conexión: se queda el local */ }
  }
  useEffect(() => { loadShared() }, [])
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const s = await getDoc(doc(db, 'ranking', user.uid))
        if (s.exists() && s.data().score > best) { setBest(s.data().score); save(BEST_KEY, s.data().score) }
      } catch (_) {}
    })()
  }, [user])

  useEffect(() => {
    if (answered) return
    if (timeLeft <= 0) { handleTimeout(); return }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, answered])

  async function registrarRecord(finalStreak) {
    if (user) {
      try {
        await setDoc(doc(db, 'ranking', user.uid), { nombre, score: finalStreak, creado: serverTimestamp() })
        loadShared()
      } catch (_) {}
    } else {
      const qualifies = board.length < LB_SIZE || finalStreak > (board[board.length - 1]?.score || 0)
      if (boardKind === 'local' && qualifies) { setRecordPrompt(true); setTimeout(() => initialsRef.current?.focus(), 50) }
    }
  }

  function handleTimeout() {
    if (answered) return
    setPicked('TIME'); vibrate(500)
    if (streak > best) bumpBest(streak)
    if (streak > 0) registrarRecord(streak)
    setStreak(0)
  }

  function bumpBest(ns) {
    const prevLevel = LEVELS.reduce((p, c) => (best >= c.min ? c : p), LEVELS[0])
    const newLevel = LEVELS.reduce((p, c) => (ns >= c.min ? c : p), LEVELS[0])
    setBest(ns); save(BEST_KEY, ns)
    if (newLevel.t !== prevLevel.t) { setLevelUp(true); setTimeout(() => setLevelUp(false), 2600) }
  }

  function choose(k) {
    if (answered) return
    setPicked(k)
    if (k === correct) {
      const ns = streak + 1; setStreak(ns); vibrate([40, 40, 40])
      if (ns > best) { bumpBest(ns); if (user) registrarRecord(ns) }
    } else {
      vibrate(350)
      if (streak > 0) registrarRecord(streak)
      setStreak(0)
    }
  }

  function nextQuestion() {
    const ni = i + 1
    if (ni >= deck.length) { setDeck(shuffle(trivia)); setI(0) } else setI(ni)
    setPicked(null); setTimeLeft(SHOT_CLOCK)
  }

  function saveLocalRecord(initials) {
    const ini = initials.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || '???'
    const updated = [...board, { initials: ini, score: streak, date: Date.now() }].sort((a, b) => b.score - a.score).slice(0, LB_SIZE)
    setBoard(updated); save(LB_KEY, updated); setRecordPrompt(false)
  }

  function resetCareer() {
    if (!confirm('¿Reiniciar tu carrera? Volverás a Aspirante.')) return
    setBest(0); setStreak(0); save(BEST_KEY, 0)
    if (!user) { setBoard([]); save(LB_KEY, []) }
  }

  const timerColor = timeLeft > 14 ? 'var(--ok)' : timeLeft > 5 ? '#D9930A' : 'var(--danger)'

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Área de juegos</p>
        <h1>Carrera arbitral</h1>
        <p>Responde antes de que se agote la posesión. Encadena aciertos y asciende de licencia.</p>
      </div>

      {levelUp && <div className="levelup">👏 ¡Ascenso! Ahora eres {level.t}</div>}

      <div className="rank-card">
        <div className="rank-top">
          <div><div className="rank-lab">Licencia actual</div><div className="rank-title">{level.t}</div></div>
          <div className="rank-streak"><div className="rank-lab">Racha</div><div className="n">{String(streak).padStart(2, '0')}</div></div>
        </div>
        <div className="rank-progress"><div className="rank-progress-fill" style={{ width: progress + '%' }} /></div>
        <div className="rank-meta">
          <span>Mejor racha: {best}{user ? ' · ' + nombre : ''}</span>
          <span>{next ? `Siguiente: ${next.t} (${next.min})` : 'Nivel máximo'}</span>
        </div>
      </div>

      <div className="shotclock">
        <div className="shotclock-head">
          <span className="shotclock-lab" style={timeLeft <= 5 && !answered ? { color: 'var(--danger)' } : null}>Reloj de posesión</span>
          <span className="shotclock-sec" style={{ color: answered ? 'var(--muted)' : timerColor }}>{String(timeLeft).padStart(2, '0')}s</span>
        </div>
        <div className="shotclock-bar"><div className="shotclock-fill" style={{ width: (timeLeft / SHOT_CLOCK) * 100 + '%', background: timerColor }} /></div>
      </div>

      <div className="q-card">
        <div className="q-meta">{q.regla_id} · {q.dificultad}</div>
        <div className="q-text">{q.pregunta}</div>
        {opts.map(o => {
          let cls = 'opt'
          if (answered) { if (o.k === correct) cls += ' correct'; else if (o.k === picked) cls += ' wrong' }
          return <button key={o.k} className={cls} disabled={answered} onClick={() => choose(o.k)}><span className="k">{o.k}</span>{o.t}</button>
        })}
        {answered && (
          <>
            <div className="explain">
              <b>{picked === 'TIME' ? '⏱ ¡Violación de 24 segundos!' : picked === correct ? '✓ ¡Correcto! Sigues la racha.' : `✗ La correcta es ${correct}.`}</b> {q.explicacion}
            </div>
            <button className="btn" onClick={nextQuestion}>{picked === correct ? 'Siguiente jugada' : 'Seguir entrenando'}</button>
          </>
        )}
      </div>

      {board.length > 0 && (
        <div className="lb">
          <p className="cat-label">{boardKind === 'comunidad' ? 'Ranking de la comunidad' : 'Mejores rachas (este dispositivo)'}</p>
          {board.map((r, idx) => (
            <div className="lb-row" key={idx}><span className="pos">{idx + 1}.</span><span className="ini">{r.initials}</span><span className="sc">{r.score}</span></div>
          ))}
          <button className="rank-reset" onClick={resetCareer}>Reiniciar mi carrera</button>
        </div>
      )}

      {!user && <p className="note" style={{ marginTop: 16 }}>Inicia sesión para que tu carrera se guarde en tu cuenta y entres al ranking compartido de la comunidad.</p>}
      <p className="disclaimer">Banco de {trivia.length} preguntas basadas en el OBR 2024. Verifica siempre contra el reglamento oficial.</p>

      {recordPrompt && (
        <div className="modal-bg" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¡Nueva mejor racha!</h3>
            <p>Encadenaste {streak} aciertos. Deja tus iniciales.</p>
            <input ref={initialsRef} className="initials" type="text" maxLength={3} placeholder="ABC" aria-label="Tus iniciales"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) saveLocalRecord(e.currentTarget.value) }} />
            <button className="btn" onClick={() => saveLocalRecord(initialsRef.current?.value || '')}>Guardar</button>
            <button className="rank-reset" style={{ marginTop: 10 }} onClick={() => setRecordPrompt(false)}>Ahora no</button>
          </div>
        </div>
      )}
    </div>
  )
}
