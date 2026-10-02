import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'
import { useAuth } from '../auth.jsx'
import seed from '../data/casos.json'

const fromSeed = (c) => ({
  id: c.id, titulo: c.titulo, regla_id: c.regla_id, descripcion: c.descripcion, foto: '',
  estado: (c.estado || '').toLowerCase().includes('resuelto') ? 'Resuelto' : 'Abierto',
  verificada: c.respuesta_verificada || '', verificado_por: c.verificado_por || '', origen: 'seed',
})
const ts = (x) => (x && x.creado && x.creado.seconds) ? x.creado.seconds : (x.localTs || 0)
const esFirestore = (c) => c.origen === 'firestore' || (typeof c.id === 'string' && !c.id.startsWith('C-') && !c.id.startsWith('local-'))

export default function Interactiva() {
  const { user, nombre, login, esInstructor } = useAuth()
  const [cases, setCases] = useState(() => seed.map(fromSeed))
  const [status, setStatus] = useState('cargando')
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState({ titulo: '', regla_id: '', descripcion: '' })
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, 'casos'))
        if (!alive) return
        const online = snap.docs.map(d => ({ id: d.id, ...d.data(), origen: 'firestore' }))
        online.sort((a, b) => ts(b) - ts(a))
        setCases([...online, ...seed.map(fromSeed)])
        setStatus('online')
      } catch (_) { if (alive) setStatus('offline') }
    })()
    return () => { alive = false }
  }, [])

  async function publish() {
    if (!form.titulo.trim() || !form.descripcion.trim()) return
    setSending(true)
    let foto = ''
    if (file) {
      try {
        const r = ref(storage, `casos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`)
        await uploadBytes(r, file); foto = await getDownloadURL(r)
      } catch (_) {}
    }
    const nuevo = { titulo: form.titulo.trim(), regla_id: form.regla_id.trim() || 'R-?', descripcion: form.descripcion.trim(), foto, estado: 'Abierto', verificada: '', autor: nombre, autorUid: user.uid, creado: serverTimestamp() }
    try {
      const r = await addDoc(collection(db, 'casos'), nuevo)
      setCases(c => [{ id: r.id, ...nuevo, origen: 'firestore' }, ...c])
    } catch (_) {
      setCases(c => [{ id: 'local-' + Date.now(), ...nuevo, localTs: Date.now(), origen: 'local' }, ...c])
    }
    setForm({ titulo: '', regla_id: '', descripcion: '' }); setFile(null); setSending(false)
  }

  function onVerify(updated) {
    setCases(cs => cs.map(c => c.id === updated.id ? updated : c))
    setOpen(updated)
  }

  if (open) return <Detalle caso={open} onBack={() => setOpen(null)} onVerify={onVerify} />

  return (
    <div className="wrap">
      <div className="page-head">
        <p className="eyebrow">Comunidad arbitral</p>
        <h1>Jugadas dudosas</h1>
        <p>¿Una jugada que te dejó dudando? Súbela con foto y deja que otros árbitros la analicen.</p>
      </div>

      {user ? (
        <div className="case" style={{ marginBottom: 18 }}>
          <strong style={{ fontFamily: 'Sora', fontSize: 15 }}>Publicar una jugada</strong>
          <div className="field"><label>Título</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="¿Pasos o no en la recepción?" /></div>
          <div className="field"><label>Regla relacionada (opcional)</label>
            <input value={form.regla_id} onChange={e => setForm({ ...form, regla_id: e.target.value })} placeholder="R-25" /></div>
          <div className="field"><label>Descripción</label>
            <textarea rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe qué pasó y tu duda…" /></div>
          <label className="filebtn">📷 {file ? file.name : 'Adjuntar foto (opcional)'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} /></label>
          <button className="btn ghost" disabled={sending} onClick={publish} style={{ marginTop: 12 }}>{sending ? 'Publicando…' : `Publicar como ${nombre}`}</button>
          {status === 'offline' && <p className="note">La base de datos aún no está activa. Tu jugada se muestra solo en esta sesión.</p>}
        </div>
      ) : (
        <div className="case" style={{ marginBottom: 18, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: '4px 0 12px' }}>Inicia sesión para publicar tu jugada y opinar sobre las de otros árbitros.</p>
          <button className="btn" onClick={login}>Entrar con Google</button>
        </div>
      )}

      <p className="cat-label">Jugadas {status === 'online' ? '· comunidad en vivo' : ''}</p>
      <div className="list">
        {cases.map(c => (
          <button className="case" key={c.id} onClick={() => setOpen(c)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
              <p className="ct">{c.titulo}</p>
              <span className={'badge ' + (c.estado === 'Resuelto' ? 'solved' : 'open')}>{c.estado}</span>
            </div>
            {c.regla_id && c.regla_id !== 'R-?' && <span className="ref">{c.regla_id}</span>}
            {c.foto && <img className="foto" src={c.foto} alt="" />}
            <p className="cd">{c.descripcion}</p>
            {c.autor && <p className="opn-count">Por {c.autor} · toca para opinar →</p>}
            {!c.autor && <p className="opn-count">Toca para opinar →</p>}
          </button>
        ))}
      </div>
      <p className="disclaimer">Solo los instructores pueden marcar una respuesta como verificada. El reglamento oficial es el árbitro final.</p>
    </div>
  )
}

function Detalle({ caso, onBack, onVerify }) {
  const { user, nombre, login, esInstructor } = useAuth()
  const [op, setOp] = useState([])
  const [status, setStatus] = useState('cargando')
  const [txt, setTxt] = useState('')
  const [sending, setSending] = useState(false)
  const [vtext, setVtext] = useState('')
  const [vsending, setVsending] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'opiniones'), where('casoId', '==', caso.id)))
        if (!alive) return
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => ts(a) - ts(b))
        setOp(list); setStatus('online')
      } catch (_) { if (alive) setStatus('offline') }
    })()
    return () => { alive = false }
  }, [caso.id])

  async function enviar() {
    if (!txt.trim()) return
    setSending(true)
    const nueva = { casoId: caso.id, autor: nombre, autorUid: user.uid, texto: txt.trim(), creado: serverTimestamp() }
    try {
      const r = await addDoc(collection(db, 'opiniones'), nueva)
      setOp(o => [...o, { id: r.id, ...nueva }])
    } catch (_) {
      setOp(o => [...o, { id: 'local-' + Date.now(), ...nueva, localTs: Date.now() }])
    }
    setTxt(''); setSending(false)
  }

  async function verificar() {
    if (!vtext.trim()) return
    setVsending(true)
    const cambios = { estado: 'Resuelto', verificada: vtext.trim(), verificado_por: nombre }
    try {
      await updateDoc(doc(db, 'casos', caso.id), cambios)
      onVerify({ ...caso, ...cambios })
    } catch (_) {
      alert('No se pudo guardar la verificación. Revisa los permisos de Firestore para instructores.')
    }
    setVsending(false)
  }

  return (
    <div className="wrap">
      <button className="backlink" onClick={onBack}>← Volver a las jugadas</button>
      <div className="case" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
          <p className="ct">{caso.titulo}</p>
          <span className={'badge ' + (caso.estado === 'Resuelto' ? 'solved' : 'open')}>{caso.estado}</span>
        </div>
        {caso.regla_id && caso.regla_id !== 'R-?' && <span className="ref">{caso.regla_id}</span>}
        {caso.foto && <img className="foto" src={caso.foto} alt="" />}
        <p className="cd">{caso.descripcion}</p>
        {caso.autor && <p className="opn-count">Publicado por {caso.autor}</p>}
        {caso.verificada && <p className="verified">✓ <b>Verificada</b> {caso.verificado_por ? '· ' + caso.verificado_por : ''}: {caso.verificada}</p>}
      </div>

      {esInstructor && esFirestore(caso) && !caso.verificada && (
        <div className="case" style={{ marginBottom: 16, borderColor: 'var(--ok)' }}>
          <strong style={{ fontFamily: 'Sora', fontSize: 14, color: 'var(--ok)' }}>✓ Verificar (instructor)</strong>
          <div className="field"><label>Resolución oficial</label>
            <textarea rows={2} value={vtext} onChange={e => setVtext(e.target.value)} placeholder="La decisión correcta, citando la regla…" /></div>
          <button className="btn" disabled={vsending} onClick={verificar} style={{ background: 'var(--ok)' }}>{vsending ? 'Guardando…' : 'Marcar como verificada'}</button>
        </div>
      )}

      <p className="cat-label">Opiniones ({op.length})</p>
      <div className="list" style={{ paddingBottom: 8 }}>
        {op.length === 0 && <p className="note">Todavía nadie opina sobre esta jugada. Sé el primero.</p>}
        {op.map(o => (
          <div className="opn" key={o.id}>
            <div className="who">{o.autor}</div>
            <div className="txt">{o.texto}</div>
          </div>
        ))}
      </div>

      {user ? (
        <div className="case">
          <div className="field"><label>Tu opinión, {nombre}</label>
            <textarea rows={3} value={txt} onChange={e => setTxt(e.target.value)} placeholder="¿Cómo resolverías esta jugada? Cita la regla si puedes…" /></div>
          <button className="btn" disabled={sending} onClick={enviar}>{sending ? 'Enviando…' : 'Publicar opinión'}</button>
        </div>
      ) : (
        <div className="case" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: '4px 0 12px' }}>Inicia sesión para opinar sobre esta jugada.</p>
          <button className="btn" onClick={login}>Entrar con Google</button>
        </div>
      )}
      <p className="disclaimer">Debate con respeto. El reglamento oficial es el árbitro final.</p>
    </div>
  )
}
