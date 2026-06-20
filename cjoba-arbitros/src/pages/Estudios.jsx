import { useMemo, useState } from 'react'
import reglas from '../data/reglas.json'
import subarticulos from '../data/subarticulos.json'

const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const CATS = [...new Set(reglas.map(r => r.categoria))]

export default function Estudios() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const [open, setOpen] = useState(null) // regla seleccionada

  const subByRegla = useMemo(() => {
    const m = {}
    for (const s of subarticulos) (m[s.regla_id] ||= []).push(s)
    return m
  }, [])

  const query = norm(q)

  // Resultados de búsqueda directa sobre artículos y sub-artículos
  const results = useMemo(() => {
    if (!query) return null
    const arts = reglas.filter(r =>
      norm(r.titulo).includes(query) || norm(r.articulo).includes(query) || norm(r.categoria).includes(query))
    const subs = subarticulos.filter(s =>
      norm(s.resumen_propio).includes(query) || norm(s.num).includes(query))
    return { arts, subs }
  }, [query])

  if (open) {
    const r = reglas.find(x => x.id === open)
    const subs = subByRegla[open] || []
    return (
      <div className="wrap">
        <button className="backlink" onClick={() => setOpen(null)}>← Volver</button>
        <div className="detail-head">
          <span className="num">{r.articulo.replace('Art. ', '')}<small>ART.</small></span>
          <div>
            <p className="eyebrow">{r.categoria}</p>
            <h1 style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 24, margin: 0 }}>{r.titulo}</h1>
          </div>
        </div>
        <div className="list">
          {subs.length === 0 && (
            <p className="note">Este artículo no tiene sub-artículos numerados. Sus especificaciones están en el documento OBR 2024 – Basketball Equipment.</p>
          )}
          {subs.map(s => (
            <div className="sub" key={s.num}>
              <span className="sn">{s.num}</span>
              <p>{s.resumen_propio}</p>
              {s['sub_detalle (X.Y.Z)'] && (
                <div className="leaves">Detalle: {s['sub_detalle (X.Y.Z)']}</div>
              )}
            </div>
          ))}
        </div>
        <p className="disclaimer">Resumen redactado con palabras propias. Verifica siempre contra el OBR 2024 oficial.</p>
      </div>
    )
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Área de estudios</p>
        <h1>Reglamento</h1>
        <p>Las 8 reglas, 50 artículos y 195 sub-artículos del OBR 2024, para consultar sin cargar el físico.</p>
      </div>

      <div className="search">
        <span className="mag" aria-hidden="true">🔎</span>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar: pasos, 24 segundos, falta antideportiva…"
          aria-label="Buscar en el reglamento"
        />
      </div>

      {results ? (
        <SearchResults results={results} onOpen={setOpen} />
      ) : (
        <>
          <div className="chips">
            <button className={'chip' + (cat === null ? ' on' : '')} onClick={() => setCat(null)}>Todas</button>
            {CATS.map(c => (
              <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
            ))}
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
  if (arts.length === 0 && subs.length === 0) {
    return <p className="empty">Sin resultados. Prueba con otra palabra, como “regate” o “tiempo muerto”.</p>
  }
  return (
    <div>
      {arts.length > 0 && <p className="cat-label">Artículos ({arts.length})</p>}
      <div className="list">
        {arts.map(r => (
          <button className="card" key={r.id} onClick={() => onOpen(r.id)}>
            <span className="num">{r.articulo.replace('Art. ', '')}<small>ART.</small></span>
            <span className="body">
              <span className="title">{r.titulo}</span>
              <span className="meta">{r.categoria}</span>
            </span>
          </button>
        ))}
      </div>
      {subs.length > 0 && <p className="cat-label">Sub-artículos ({subs.length})</p>}
      <div className="list">
        {subs.slice(0, 60).map(s => (
          <button className="card" key={s.id} onClick={() => onOpen(s.regla_id)}>
            <span className="num">{s.num}</span>
            <span className="body">
              <span className="summary" style={{ marginTop: 0 }}>{s.resumen_propio}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
