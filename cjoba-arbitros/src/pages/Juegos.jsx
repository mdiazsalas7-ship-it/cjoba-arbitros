import { useEffect, useMemo, useRef, useState } from 'react'
import trivia from '../data/trivia.json'

const SHOT_CLOCK = 24
const LB_SIZE = 5
const LB_KEY = 'cjoba_leaderboard'
const BEST_KEY = 'cjoba_mejor_racha'

// Escalafón arbitral por mejor racha alcanzada (no se pierde al fallar)
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
  const [deck, setDeck] = useState(() => shuffle(trivia))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)     // 'A'..'D' o 'TIME'
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => load(BEST_KEY, 0))
  const [board, setBoard] = useState(() => load(LB_KEY, []))
  const [timeLeft, setTimeLeft] = useState(SHOT_CLOCK)
  const [levelUp, setLevelUp] = useState(false)
  const [recordPrompt, setRecordPrompt] = useState(false)
  const initialsRef = useRef(null)

  const q = deck[i]
  const correct = (q.correcta || '').trim().toUpperCase()
  const answered = picked !== null

  const opts = useMemo(() => ([
    { k: 'A', t: q.opcion_a }, { k: 'B', t: q.opcion_b },
    { k: 'C', t: q.opcion_c }, { k: 'D', t: q.opcion_d },
  ].filter(o => o.t !== '')), [q])

  const level = LEVELS.reduce((p, c) => (best >= c.min ? c : p), LEVELS[0])
  const next = LEVELS.find(l => l.min > best)
  const progress = next ? ((best - level.min) / (next.min - level.min)) * 100 : 100

  // Reloj de posesión
  useEffect(() => {
    if (answered) return
    if (timeLeft <= 0) { handleTimeout(); return }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, answered])

  function endRun(finalStreak) {
    const qualifies = finalStreak > 0 &&
      (board.length < LB_SIZE || finalStreak > board[board.length - 1].score)
    if (qualifies) { setRecordPrompt(true); setTimeout(() => initialsRef.current?.focus(), 50) }
  }

  function handleTimeout() {
    if (answered) return
    setPicked('TIME')
    vibrate(500)
    endRun(streak)
    setStreak(0)
  }

  function choose(k) {
    if (answered) return
    setPicked(k)
    if (k === correct) {
      const ns = streak + 1
      setStreak(ns)
      vibrate([40, 40, 40])
      if (ns > best) {
        const prevLevel = LEVELS.reduce((p, c) => (best >= c.min ? c : p), LEVELS[0])
        const newLevel = LEVELS.reduce((p, c) => (ns >= c.min ? c : p), LEVELS[0])
        setBest(ns); save(BEST_KEY, ns)
        if (newLevel.t !== prevLevel.t) { setLevelUp(true); setTimeout(() => setLevelUp(false), 2600) }
      }
    } else {
      vibrate(350)
      endRun(streak)
      setStreak(0)
    }
  }

  function nextQuestion() {
    const ni = i + 1
    if (ni >= deck.length) { setDeck(shuffle(trivia)); setI(0) } else setI(ni)
    setPicked(null); setTimeLeft(SHOT_CLOCK)
  }

  function saveRecord(initials) {
    const ini = initials.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || '???'
    const updated = [...board, { initials: ini, score: streak, date: Date.now() }]
      .sort((a, b) => b.score - a.score).slice(0, LB_SIZE)
    setBoard(updated); save(LB_KEY, updated)
    setRecordPrompt(false)
  }

  function resetCareer() {
    if (!confirm('¿Reiniciar tu carrera? Volverás a Aspirante y se borrará el ranking.')) return
    setBest(0); setBoard([]); setStreak(0)
    save(BEST_KEY, 0); save(LB_KEY, [])
  }

  const timerColor = timeLeft > 14 ? 'var(--ok)' : timeLeft > 5 ? '#D9930A' : 'var(--signal)'

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Área de juegos</p>
        <h1>Carrera arbitral</h1>
        <p>Responde antes de que se agote la posesión. Encadena aciertos y asciende de licencia.</p>
      </div>

      {levelUp && <div className="levelup">👏 ¡Ascenso! Ahora eres {level.t}</div>}

      {/* Licencia / escalafón */}
      <div className="rank-card">
        <div className="rank-top">
          <div>
            <div className="rank-lab">Licencia actual</div>
            <div className="rank-title">{level.t}</div>
          </div>
          <div className="rank-streak">
            <div className="rank-lab">Racha</div>
            <div className="n">{String(streak).padStart(2, '0')}</div>
          </div>
        </div>
        <div className="rank-progress"><div className="rank-progress-fill" style={{ width: progress + '%' }} /></div>
        <div className="rank-meta">
          <span>Mejor racha: {best}</span>
          <span>{next ? `Siguiente: ${next.t} (${next.min})` : 'Nivel máximo'}</span>
        </div>
      </div>

      {/* Reloj de posesión */}
      <div className="shotclock">
        <div className="shotclock-head">
          <span className="shotclock-lab" style={timeLeft <= 5 && !answered ? { color: 'var(--signal)' } : null}>Reloj de posesión</span>
          <span className="shotclock-sec" style={{ color: answered ? 'var(--muted)' : timerColor }}>{String(timeLeft).padStart(2, '0')}s</span>
        </div>
        <div className="shotclock-bar">
          <div className="shotclock-fill" style={{ width: (timeLeft / SHOT_CLOCK) * 100 + '%', background: timerColor }} />
        </div>
      </div>

      {/* Pregunta */}
      <div className="q-card">
        <div className="q-meta">{q.regla_id} · {q.dificultad}</div>
        <div className="q-text">{q.pregunta}</div>
        {opts.map(o => {
          let cls = 'opt'
          if (answered) {
            if (o.k === correct) cls += ' correct'
            else if (o.k === picked) cls += ' wrong'
          }
          return (
            <button key={o.k} className={cls} disabled={answered} onClick={() => choose(o.k)}>
              <span className="k">{o.k}</span>{o.t}
            </button>
          )
        })}

        {answered && (
          <>
            <div className="explain">
              <b>
                {picked === 'TIME' ? '⏱ ¡Violación de 24 segundos!'
                  : picked === correct ? '✓ ¡Correcto! Sigues la racha.'
                  : `✗ La correcta es ${correct}.`}
              </b> {q.explicacion}
            </div>
            <button className="btn" onClick={nextQuestion}>
              {picked === correct ? 'Siguiente jugada' : 'Seguir entrenando'}
            </button>
          </>
        )}
      </div>

      {/* Ranking */}
      {board.length > 0 && (
        <div className="lb">
          <p className="cat-label">Mejores rachas</p>
          {board.map((r, idx) => (
            <div className="lb-row" key={idx}>
              <span className="pos">{idx + 1}.</span>
              <span className="ini">{r.initials}</span>
              <span className="sc">{r.score}</span>
            </div>
          ))}
          <button className="rank-reset" onClick={resetCareer}>Reiniciar carrera y ranking</button>
        </div>
      )}

      <p className="disclaimer">Banco de {trivia.length} preguntas basadas en el OBR 2024. Verifica siempre contra el reglamento oficial.</p>

      {recordPrompt && (
        <div className="modal-bg" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>¡Nueva mejor racha!</h3>
            <p>Encadenaste {streak} aciertos. Deja tus iniciales en el ranking.</p>
            <input
              ref={initialsRef} type="text" maxLength={3} placeholder="ABC" aria-label="Tus iniciales"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) saveRecord(e.currentTarget.value) }}
            />
            <button className="btn" onClick={() => saveRecord(initialsRef.current?.value || '')}>Guardar</button>
            <button className="rank-reset" style={{ marginTop: 10 }} onClick={() => setRecordPrompt(false)}>Ahora no</button>
          </div>
        </div>
      )}
    </div>
  )
}
