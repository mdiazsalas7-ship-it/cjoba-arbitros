import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import seed from '../data/casos.json'

// Normaliza un caso semilla al formato de la app
const fromSeed = (c) => ({
  id: c.id,
  titulo: c.titulo,
  regla_id: c.regla_id,
  descripcion: c.descripcion,
  estado: (c.estado || '').toLowerCase().includes('resuelto') ? 'Resuelto' : 'Abierto',
  verificada: c.respuesta_verificada || '',
  verificado_por: c.verificado_por || '',
  origen: 'seed',
})

export default function Interactiva() {
  const [cases, setCases] = useState(() => seed.map(fromSeed))
  const [status, setStatus] = useState('cargando') // cargando | online | offline
  const [form, setForm] = useState({ titulo: '', regla_id: '', descripcion: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'casos'), orderBy('creado', 'desc')))
        if (!alive) return
        const online = snap.docs.map(d => ({ id: d.id, ...d.data(), origen: 'firestore' }))
        setCases([...online, ...seed.map(fromSeed)])
        setStatus('online')
      } catch (_) {
        if (alive) setStatus('offline')
      }
    })()
    return () => { alive = false }
  }, [])

  async function publish() {
    if (!form.titulo.trim() || !form.descripcion.trim()) return
    setSending(true)
    const nuevo = {
      titulo: form.titulo.trim(),
      regla_id: form.regla_id.trim() || 'R-?',
      descripcion: form.descripcion.trim(),
      estado: 'Abierto',
      verificada: '',
      creado: serverTimestamp(),
    }
    try {
      const ref = await addDoc(collection(db, 'casos'), nuevo)
      setCases(c => [{ id: ref.id, ...nuevo, origen: 'firestore' }, ...c])
    } catch (_) {
      // Sin Firestore activo: lo mostramos en esta sesión para no perder el trabajo
      setCases(c => [{ id: 'local-' + Date.now(), ...nuevo, origen: 'local' }, ...c])
    }
    setForm({ titulo: '', regla_id: '', descripcion: '' })
    setSending(false)
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Área interactiva</p>
        <h1>Jugadas dudosas</h1>
        <p>Publica una jugada y debátela con otros árbitros. Las resueltas quedan como referencia.</p>
      </div>

      <div className="card" style={{ display: 'block', padding: 16 }}>
        <strong style={{ fontFamily: 'Archivo' }}>Publicar una jugada</strong>
        <label className="field">
          <label>Título</label>
          <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="¿Pasos o no en la recepción?" />
        </label>
        <label className="field">
          <label>Regla relacionada (opcional)</label>
          <input value={form.regla_id} onChange={e => setForm({ ...form, regla_id: e.target.value })} placeholder="R-25" />
        </label>
        <label className="field">
          <label>Descripción de la jugada</label>
          <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe qué pasó y tu duda…" />
        </label>
        <button className="btn ghost" disabled={sending} onClick={publish}>{sending ? 'Publicando…' : 'Publicar jugada'}</button>
        {status === 'offline' && (
          <p className="note">La base de datos de la comunidad aún no está activa. Tu jugada se muestra solo en esta sesión. Activa Firestore (ver README) para guardarla de verdad.</p>
        )}
      </div>

      <p className="cat-label">Jugadas {status === 'online' ? '· comunidad en vivo' : ''}</p>
      <div className="list">
        {cases.map(c => (
          <div className="case" key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
              <p className="ct">{c.titulo}</p>
              <span className={'badge ' + (c.estado === 'Resuelto' ? 'solved' : 'open')}>{c.estado}</span>
            </div>
            {c.regla_id && <span className="ref">{c.regla_id}</span>}
            <p className="cd">{c.descripcion}</p>
            {c.verificada && (
              <p className="verified">✓ <b>Verificada</b> {c.verificado_por ? '· ' + c.verificado_por : ''}: {c.verificada}</p>
            )}
          </div>
        ))}
      </div>

      <p className="disclaimer">La marca “verificada” debe reservarse a árbitros instructores. El reglamento oficial es el árbitro final.</p>
    </div>
  )
}
