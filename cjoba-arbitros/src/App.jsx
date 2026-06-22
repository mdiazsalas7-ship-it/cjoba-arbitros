import { useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import InstallPrompt from './InstallPrompt.jsx'
import Estudios from './pages/Estudios.jsx'
import Senales from './pages/Senales.jsx'
import Juegos from './pages/Juegos.jsx'
import Interactiva from './pages/Interactiva.jsx'

function AuthControl() {
  const { user, perfil, loading, login, logout, esInstructor } = useAuth()
  const [open, setOpen] = useState(false)
  if (loading) return null
  if (!user) return <button className="auth-btn" onClick={login}>Entrar</button>
  const nombre = perfil?.nombre || user.displayName || 'Árbitro'
  const inicial = nombre.trim().charAt(0).toUpperCase()
  return (
    <div className="auth-wrap">
      <button className="auth-ava" onClick={() => setOpen(o => !o)} aria-label="Cuenta">
        {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{inicial}</span>}
      </button>
      {open && (
        <div className="auth-menu" onClick={() => setOpen(false)}>
          <div className="auth-name">{nombre}</div>
          <div className={'auth-role ' + (esInstructor ? 'ins' : '')}>{esInstructor ? 'Instructor' : 'Árbitro'}</div>
          <button className="auth-logout" onClick={logout}>Cerrar sesión</button>
        </div>
      )}
    </div>
  )
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="bar">
        <img src="/icon-192.png" alt="Árbitro Virtual" className="logo" />
        <span className="brand">Árbitro<small> Virtual</small></span>
        <AuthControl />
      </div>
      <div className="stripes" aria-hidden="true" />
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="nav cols-4" aria-label="Secciones">
      <NavLink to="/estudios"><span className="ico">📖</span>Estudios</NavLink>
      <NavLink to="/senales"><span className="ico">✋</span>Señales</NavLink>
      <NavLink to="/juegos"><span className="ico">🎯</span>Juegos</NavLink>
      <NavLink to="/comunidad"><span className="ico">💬</span>Comunidad</NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <div className="app">
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/estudios" replace />} />
          <Route path="/estudios" element={<Estudios />} />
          <Route path="/senales" element={<Senales />} />
          <Route path="/juegos" element={<Juegos />} />
          <Route path="/comunidad" element={<Interactiva />} />
          <Route path="*" element={<Navigate to="/estudios" replace />} />
        </Routes>
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
