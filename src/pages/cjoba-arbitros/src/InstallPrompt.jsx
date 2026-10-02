import { useEffect, useState } from 'react'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone()) return // ya está instalada
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); setShow(true) }
    const onInstalled = () => setShow(false)
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    if (isIOS()) { setIos(true); setShow(true) } // iOS no dispara el evento
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!deferred) return
    deferred.prompt()
    try { await deferred.userChoice } catch (_) {}
    setDeferred(null); setShow(false)
  }

  if (!show) return null
  return (
    <div className="install-bar" role="dialog" aria-label="Instalar la app">
      <img src="/icon-192.png" alt="" className="install-ico" />
      <div className="install-txt">
        <strong>Instala Árbitro Virtual</strong>
        {ios
          ? <span>Toca Compartir <b>↑</b> abajo y luego “Añadir a pantalla de inicio”.</span>
          : <span>Tenla en tu teléfono como una app, a un toque.</span>}
      </div>
      {!ios && <button className="install-go" onClick={install}>Instalar</button>}
      <button className="install-x" onClick={() => setShow(false)} aria-label="Cerrar">✕</button>
    </div>
  )
}
