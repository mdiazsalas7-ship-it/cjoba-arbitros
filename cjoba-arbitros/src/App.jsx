import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Estudios from './pages/Estudios.jsx'
import Senales from './pages/Senales.jsx'
import Juegos from './pages/Juegos.jsx'
import Interactiva from './pages/Interactiva.jsx'

function TopBar() {
  return (
    <header className="topbar">
      <div className="bar">
        <img src="https://i.postimg.cc/hPLX3zVD/download.jpg" alt="CJOBA" className="logo" />
        <span className="brand">CJOBA<small>.</small></span>
        <span className="tagline">Reglamento FIBA 2024</span>
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
      <BottomNav />
    </div>
  )
}
