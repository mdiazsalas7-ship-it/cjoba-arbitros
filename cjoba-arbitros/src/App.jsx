import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Estudios from './pages/Estudios.jsx'
import Juegos from './pages/Juegos.jsx'
import Interactiva from './pages/Interactiva.jsx'

function TopBar() {
  return (
    <header className="topbar">
      <div className="bar">
        <span className="brand">CJOBA<small>.</small></span>
        <span className="tagline">Reglamento FIBA 2024</span>
      </div>
      <div className="stripes" aria-hidden="true" />
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="nav" aria-label="Secciones">
      <NavLink to="/estudios"><span className="ico">📖</span>Estudios</NavLink>
      <NavLink to="/juegos"><span className="ico">🎯</span>Juegos</NavLink>
      <NavLink to="/interactiva"><span className="ico">💬</span>Interactiva</NavLink>
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
          <Route path="/juegos" element={<Juegos />} />
          <Route path="/interactiva" element={<Interactiva />} />
          <Route path="*" element={<Navigate to="/estudios" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
