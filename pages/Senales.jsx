import { useMemo, useState } from 'react'
import senales from '../data/senales.json'

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const CATS = [
  { id: 'numeros', label: 'Números' },
  { id: 'reloj', label: 'Reloj' },
  { id: 'tanteo', label: 'Tanteo' },
  { id: 'administrativa', label: 'Admin.' },
  { id: 'violacion', label: 'Violaciones' },
  { id: 'falta', label: 'Faltas' },
]

export default function Senales() {
  const [cat, setCat] = useState(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const query = norm(q)

  const list = useMemo(() => senales.filter(s =>
    (!cat || s.categoria === cat) &&
    (!query || norm(s.nombre).includes(query) || norm(s.descripcion).includes(query))
  ), [cat, query])

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Apéndice A</p>
        <h1>Señales</h1>
        <p>Las {senales.length} señales oficiales de los árbitros FIBA, con su gráfica y descripción.</p>
      </div>

      <div className="search">
        <span className="mag" aria-hidden="true">🔎</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar señal: tiempo muerto, 24 segundos…" aria-label="Buscar señal" />
      </div>

      <div className="chips">
        <button className={'chip' + (cat === null ? ' on' : '')} onClick={() => setCat(null)}>Todas</button>
        {CATS.map(c => (
          <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>

      {list.length === 0
        ? <div className="empty"><div className="big">✋</div>No hay señales que coincidan.</div>
        : (
          <div className="signal-grid">
            {list.map(s => (
              <button className="signal-card" key={s.id} onClick={() => setSel(s)}>
                <div className="pic">
                  <img src={s.imagen_url} alt={s.nombre} loading="lazy" />
                  <span className="tag">{s.categoria.slice(0, 3)}</span>
                </div>
                <div className="cap"><h3>{s.nombre}</h3></div>
              </button>
            ))}
          </div>
        )}

      {sel && (
        <div className="modal-bg" onClick={() => setSel(null)} role="dialog" aria-modal="true">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="eyebrow">Apéndice A · {sel.categoria}</p>
            <h3 style={{ marginTop: 0 }}>{sel.nombre}</h3>
            <div className="signal-modal-img"><img src={sel.imagen_url} alt={sel.nombre} /></div>
            <p style={{ color: 'var(--text)', fontSize: 15 }}>{sel.descripcion}</p>
            <button className="btn ghost" onClick={() => setSel(null)} style={{ marginTop: 14 }}>Cerrar</button>
          </div>
        </div>
      )}

      <p className="disclaimer">{senales.length} señales del manual de árbitros FIBA.</p>
    </div>
  )
}
