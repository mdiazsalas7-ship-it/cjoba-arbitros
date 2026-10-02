// Configuración de Firebase del proyecto cjoba-app.
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

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
export const storage = getStorage(app)
export const auth = getAuth(app)

export async function initAnalytics() {
  if (typeof window === 'undefined') return
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    if (await isSupported()) getAnalytics(app)
  } catch (_) {}
}
