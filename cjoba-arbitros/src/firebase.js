// Configuración de Firebase del proyecto cjoba-app.
// Nota: la apiKey de una app web NO es un secreto; identifica el proyecto.
// Lo que protege tus datos son las Reglas de Seguridad de Firestore (ver README).
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAjsZYTF8-17cGGhzD2ZOtANIrtgYcDB-A',
  authDomain: 'cjoba-app.firebaseapp.com',
  projectId: 'cjoba-app',
  storageBucket: 'cjoba-app.firebasestorage.app',
  messagingSenderId: '831383313096',
  appId: '1:831383313096:web:5985c36185fc2ecac623fd',
  measurementId: 'G-4HNPNXDBKS',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Analytics solo en navegador y si el entorno lo soporta (evita romper el build).
export async function initAnalytics() {
  if (typeof window === 'undefined') return
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    if (await isSupported()) getAnalytics(app)
  } catch (_) { /* sin analytics, sin problema */ }
}
