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
        <p>Las {senales.length} señales oficiales de los árbitros FIBA, con su gesto descrito.</p>
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

      <div className="list">
        {list.length === 0 && <p className="empty">No hay señales que coincidan.</p>}
        {list.map(s => (
          <div className="signal" key={s.id}>
            <div className="signal-fig" aria-hidden="true">✋</div>
            <div className="signal-body">
              <p className="signal-name">{s.nombre}</p>
              <p className="signal-desc">{s.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="disclaimer">Gesto descrito en texto. Las ilustraciones oficiales se añaden con material propio o con permiso de FIBA.</p>
    </div>
  )
}
