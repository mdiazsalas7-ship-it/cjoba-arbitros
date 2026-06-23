import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../auth.jsx'
import seed from '../data/videos.json'

const FIBA_LIB = 'https://refereeing.fiba.basketball/en/material-library'
const ts = (x) => (x && x.creado && x.creado.seconds) ? x.creado.seconds : (x.localTs || 0)

function ytId(url) {
  if (!url) return ''
  const s = url.trim()
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  if (m) return m[1]
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  return ''
}

export default function Videos() {
  const { user, nombre, login, esInstructor } = useAuth()
  const [vids, setVids] = useState(() => seed.map(v => ({ ...v, origen: 'seed' })))
  const [cat, setCat] = useState(null)
  const [play, setPlay] = useState(null)
  const [form, setForm] = useState({ url: '', titulo: '', categoria: 'Mecánica' })
  const [sending, setSending] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, 'videos'))
        if (!alive) return
        const online = snap.docs.map(d => ({ id: d.data().youtubeId, docId: d.id, ...d.data(), origen: 'firestore' }))
        online.sort((a, b) => ts(b) - ts(a))
        setVids([...online, ...seed.map(v => ({ ...v, origen: 'seed' }))])
      } catch (_) {}
    })()
    return () => { alive = false }
  }, [])

  const cats = useMemo(() => [...new Set(vids.map(v => v.categoria))], [vids])
  const list = vids.filter(v => !cat || v.categoria === cat)

  async function add() {
    const id = ytId(form.url)
    if (!id || !form.titulo.trim()) { alert('Pega un enlace de YouTube válido y un título.'); return }
    setSending(true)
    const nuevo = { youtubeId: id, titulo: form.titulo.trim(), categoria: form.categoria, autor: nombre, creado: serverTimestamp() }
    try {
      const r = await addDoc(collection(db, 'videos'), nuevo)
      setVids(v => [{ id, docId: r.id, ...nuevo, origen: 'firestore' }, ...v])
    } catch (_) {
      setVids(v => [{ id, ...nuevo, localTs: Date.now(), origen: 'local' }, ...v])
    }
    setForm({ url: '', titulo: '', categoria: 'Mecánica' }); setShowAdd(false); setSending(false)
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Videoteca</p>
        <h1>Videos</h1>
        <p>Aprende viendo. Clips de señales, mecánica y jugadas para estudiar.</p>
      </div>

      <a className="fiba-link" href={FIBA_LIB} target="_blank" rel="noopener noreferrer">
        ▶ Videoteca oficial de FIBA (iRef) →
      </a>

      {esInstructor && (
        <>
          {!showAdd
            ? <button className="btn ghost" onClick={() => setShowAdd(true)} style={{ marginTop: 12 }}>+ Agregar un video</button>
            : (
              <div className="case" style={{ marginTop: 12 }}>
                <strong style={{ fontFamily: 'Sora', fontSize: 14 }}>Agregar video (instructor)</strong>
                <div className="field"><label>Enlace de YouTube</label>
                  <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://youtu.be/..." /></div>
                <div className="field"><label>Título</label>
                  <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Mecánica de transición · Lead" /></div>
                <div className="field"><label>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                    style={{ width: '100%', padding: 12, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--line-2)' }}>
                    <option>Mecánica</option><option>Señales</option><option>Interpretaciones</option><option>Jugadas</option><option>Físico</option>
                  </select></div>
                <button className="btn" disabled={sending} onClick={add}>{sending ? 'Guardando…' : 'Agregar'}</button>
                <button className="rank-reset" style={{ marginTop: 8 }} onClick={() => setShowAdd(false)}>Cancelar</button>
              </div>
            )}
        </>
      )}

      <div className="chips" style={{ marginTop: 14 }}>
        <button className={'chip' + (cat === null ? ' on' : '')} onClick={() => setCat(null)}>Todos</button>
        {cats.map(c => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      <div className="vid-grid">
        {list.map((v, i) => (
          <button className="vid-card" key={v.id + i} onClick={() => setPlay(v)}>
            <div className="vid-thumb">
              <img src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" />
              <span className="vid-play">▶</span>
              <span className="vid-cat">{v.categoria}</span>
            </div>
            <p className="vid-title">{v.titulo}</p>
          </button>
        ))}
      </div>

      {!user && <p className="note" style={{ marginTop: 14 }}>Inicia sesión como instructor para agregar videos a la videoteca. <button className="filebtn" style={{ marginTop: 8 }} onClick={login}>Entrar con Google</button></p>}
      <p className="disclaimer">Los videos se reproducen desde YouTube. La videoteca completa de FIBA está en su app iRef Academy.</p>

      {play && (
        <div className="modal-bg" onClick={() => setPlay(null)} role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{play.titulo}</h3>
            <div className="vid-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${play.id}?rel=0`}
                title={play.titulo} frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a className="fiba-link" href={`https://www.youtube.com/watch?v=${play.id}`} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10 }}>Ver en YouTube →</a>
            <button className="btn ghost" onClick={() => setPlay(null)} style={{ marginTop: 10 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
