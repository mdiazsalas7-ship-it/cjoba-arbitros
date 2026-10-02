import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import InstallPrompt from './InstallPrompt.jsx'
import Estudios from './pages/Estudios.jsx'
import Asistente from './pages/Asistente.jsx'

function TopBar() {
  return (
    <header className="topbar">
      <div className="bar">
        <img src="/icon-192.png" alt="Árbitro Virtual" className="logo" />
        <span className="brand">Árbitro<small> Virtual</small></span>
      </div>
      <div className="stripes" aria-hidden="true" />
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="nav" aria-label="Secciones" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      <NavLink to="/asistente"><span className="ico">🎙️</span>Asistente</NavLink>
      <NavLink to="/reglamento"><span className="ico">📖</span>Reglamento</NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <div className="app">
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/asistente" replace />} />
          <Route path="/asistente" element={<Asistente />} />
          <Route path="/reglamento" element={<Estudios />} />
          <Route path="*" element={<Navigate to="/asistente" replace />} />
        </Routes>
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
