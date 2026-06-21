import { useMemo, useState } from 'react'
import reglas from '../data/reglas.json'
import subarticulos from '../data/subarticulos.json'
import obri from '../data/obri.json'
import manuales from '../data/manuales.json'

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const CATS = [...new Set(reglas.map(r => r.categoria))]

export default function Estudios() {
  const [seg, setSeg] = useState('reglamento')
  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Biblioteca</p>
        <h1>Estudios</h1>
        <p>Todo el material oficial para consultar sin cargar el físico.</p>
      </div>
      <div className="seg">
        <button className={seg === 'reglamento' ? 'on' : ''} onClick={() => setSeg('reglamento')}>Reglamento</button>
        <button className={seg === 'obri' ? 'on' : ''} onClick={() => setSeg('obri')}>OBRI</button>
        <button className={seg === 'manuales' ? 'on' : ''} onClick={() => setSeg('manuales')}>Manuales</button>
      </div>
      {seg === 'reglamento' && <Reglamento />}
      {seg === 'obri' && <Coleccion items={obri} nombre="interpretaciones del OBRI" />}
      {seg === 'manuales' && <Coleccion items={manuales} nombre="manuales del árbitro" />}
    </div>
  )
}

function Coleccion({ items, nombre }) {
  if (!items || items.length === 0) {
    return (
      <div className="empty"><div className="big">📚</div>Aún no hay {nombre} cargados.<br />Sube el documento oficial y aparecerán aquí, igual que el reglamento.</div>
    )
  }
  return (
    <div className="list">
      {items.map((it, i) => (
        <div className="sub" key={i}>
          <span className="sn">{it.num || it.id}</span>
          <p>{it.resumen_propio || it.texto || it.descripcion}</p>
        </div>
      ))}
    </div>
  )
}

function Reglamento() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const [open, setOpen] = useState(null)

  const subByRegla = useMemo(() => {
    const m = {}
    for (const s of subarticulos) (m[s.regla_id] ||= []).push(s)
    return m
  }, [])
  const query = norm(q)

  const results = useMemo(() => {
    if (!query) return null
    const arts = reglas.filter(r => norm(r.titulo).includes(query) || norm(r.articulo).includes(query) || norm(r.categoria).includes(query))
    const subs = subarticulos.filter(s => norm(s.resumen_propio).includes(query) || norm(s.num).includes(query))
    return { arts, subs }
  }, [query])

  if (open) {
    const r = reglas.find(x => x.id === open)
    const subs = subByRegla[open] || []
    return (
      <div>
        <button className="backlink" onClick={() => setOpen(null)}>← Volver</button>
        <div className="detail-head">
          <span className="num">{r.articulo.replace('Art. ', '')}<small>ART.</small></span>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>{r.categoria}</p>
            <h2 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 22, margin: '2px 0 0' }}>{r.titulo}</h2>
          </div>
        </div>
        <div className="list">
          {subs.length === 0 && <p className="note">Este artículo no tiene sub-artículos numerados. Sus especificaciones están en el documento OBR 2024 – Basketball Equipment.</p>}
          {subs.map(s => (
            <div className="sub" key={s.num}>
              <span className="sn">{s.num}</span>
              <p>{s.resumen_propio}</p>
              {s['sub_detalle (X.Y.Z)'] && <div className="leaves">Detalle: {s['sub_detalle (X.Y.Z)']}</div>}
            </div>
          ))}
        </div>
        <p className="disclaimer">Resumen redactado con palabras propias. Verifica contra el OBR 2024 oficial.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="search">
        <span className="mag" aria-hidden="true">🔎</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar: pasos, 24 segundos, antideportiva…" aria-label="Buscar en el reglamento" />
      </div>
      {results ? (
        <SearchResults results={results} onOpen={setOpen} />
      ) : (
        <>
          <div className="chips">
            <button className={'chip' + (cat === null ? ' on' : '')} onClick={() => setCat(null)}>Todas</button>
            {CATS.map(c => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="list">
            {reglas.filter(r => !cat || r.categoria === cat).map(r => (
              <button className="card" key={r.id} onClick={() => setOpen(r.id)}>
                <span className="num">{r.articulo.replace('Art. ', '')}<small>ART.</small></span>
                <span className="body">
                  <span className="title">{r.titulo}</span>
                  <span className="meta">{r.categoria} · {r.n_secciones} secciones</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SearchResults({ results, onOpen }) {
  const { arts, subs } = results
  if (arts.length === 0 && subs.length === 0) return <div className="empty"><div className="big">🔍</div>Sin resultados. Prueba con “regate” o “tiempo muerto”.</div>
  return (
    <div>
      {arts.length > 0 && <p className="cat-label">Artículos ({arts.length})</p>}
      <div className="list">
        {arts.map(r => (
          <button className="card" key={r.id} onClick={() => onOpen(r.id)}>
            <span className="num">{r.articulo.replace('Art. ', '')}<small>ART.</small></span>
            <span className="body"><span className="title">{r.titulo}</span><span className="meta">{r.categoria}</span></span>
          </button>
        ))}
      </div>
      {subs.length > 0 && <p className="cat-label">Sub-artículos ({subs.length})</p>}
      <div className="list">
        {subs.slice(0, 60).map(s => (
          <button className="card" key={s.id} onClick={() => onOpen(s.regla_id)}>
            <span className="num">{s.num}</span>
            <span className="body"><span className="summary" style={{ marginTop: 0 }}>{s.resumen_propio}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}
