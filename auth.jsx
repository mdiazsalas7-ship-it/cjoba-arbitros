import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub
    try {
      unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u)
        if (u) {
          try {
            const ref = doc(db, 'usuarios', u.uid)
            const snap = await getDoc(ref)
            if (snap.exists()) {
              setPerfil({ id: u.uid, ...snap.data() })
            } else {
              const nuevo = { nombre: u.displayName || 'Árbitro', email: u.email || '', rol: 'arbitro', creado: serverTimestamp() }
              await setDoc(ref, nuevo)
              setPerfil({ id: u.uid, ...nuevo })
            }
          } catch (_) {
            setPerfil({ id: u.uid, nombre: u.displayName || 'Árbitro', rol: 'arbitro' })
          }
        } else { setPerfil(null) }
        setLoading(false)
      })
    } catch (_) { setLoading(false) }
    return () => { if (unsub) unsub() }
  }, [])

  async function login() {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (_) {
      alert('No se pudo iniciar sesión. Activa el acceso con Google en Firebase Authentication y añade tu dominio de Vercel a los dominios autorizados.')
    }
  }
  async function logout() { try { await signOut(auth) } catch (_) {} }

  return (
    <AuthCtx.Provider value={{ user, perfil, loading, login, logout, esInstructor: perfil?.rol === 'instructor', nombre: perfil?.nombre || user?.displayName || '' }}>
      {children}
    </AuthCtx.Provider>
  )
}
