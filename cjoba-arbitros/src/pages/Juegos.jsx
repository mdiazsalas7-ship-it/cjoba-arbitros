import { useMemo, useState } from 'react'
import trivia from '../data/trivia.json'

const LETTERS = ['A', 'B', 'C', 'D']
const shuffle = (arr) => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1])

export default function Juegos() {
  const [deck, setDeck] = useState(() => shuffle(trivia))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)

  const q = deck[i]
  const opts = useMemo(() => ([
    { k: 'A', t: q.opcion_a }, { k: 'B', t: q.opcion_b },
    { k: 'C', t: q.opcion_c }, { k: 'D', t: q.opcion_d },
  ].filter(o => o.t !== '')), [q])

  const correct = (q.correcta || '').trim().toUpperCase()

  function choose(k) {
    if (picked) return
    setPicked(k)
    setAnswered(a => a + 1)
    if (k === correct) setScore(s => s + 1)
  }

  function next() {
    if (i + 1 >= deck.length) { restart(); return }
    setI(i + 1); setPicked(null)
  }

  function restart() {
    setDeck(shuffle(trivia)); setI(0); setPicked(null); setScore(0); setAnswered(0)
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Área de juegos</p>
        <h1>Trivia</h1>
        <p>Pon a prueba tu criterio con preguntas reales del reglamento. Cada respuesta enlaza a la regla.</p>
      </div>

      <div className="scoreboard">
        <div><div className="lab">Aciertos</div><div className="val">{String(score).padStart(2, '0')}</div></div>
        <div style={{ textAlign: 'center' }}><div className="lab">Pregunta</div><div className="val">{String(i + 1).padStart(2, '0')}/{deck.length}</div></div>
        <div style={{ textAlign: 'right' }}><div className="lab">Respondidas</div><div className="val">{String(answered).padStart(2, '0')}</div></div>
      </div>

      <div className="q-card">
        <div className="q-meta">{q.regla_id} · {q.dificultad}</div>
        <div className="q-text">{q.pregunta}</div>
        {opts.map(o => {
          let cls = 'opt'
          if (picked) {
            if (o.k === correct) cls += ' correct'
            else if (o.k === picked) cls += ' wrong'
          }
          return (
            <button key={o.k} className={cls} disabled={!!picked} onClick={() => choose(o.k)}>
              <span className="k">{o.k}</span>{o.t}
            </button>
          )
        })}

        {picked && (
          <>
            <div className="explain">
              <b>{picked === correct ? '✓ Correcto' : '✗ La correcta es ' + correct}.</b> {q.explicacion}
            </div>
            <button className="btn" onClick={next}>
              {i + 1 >= deck.length ? 'Reiniciar ronda' : 'Siguiente pregunta'}
            </button>
          </>
        )}
      </div>

      <p className="disclaimer">Banco de {trivia.length} preguntas basadas en el OBR 2024. Verifica siempre contra el reglamento oficial.</p>
    </div>
  )
}
