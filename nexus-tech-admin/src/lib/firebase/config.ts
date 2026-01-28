import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Verificar si Firebase está configurado
export const isFirebaseConfigured = () => {
    return (
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== 'your_firebase_api_key' &&
        firebaseConfig.projectId &&
        firebaseConfig.projectId !== 'your_project_id'
    )
}

// Inicializar Firebase solo si está configurado
const app = getApps().length > 0 ? getApp() : (isFirebaseConfigured() ? initializeApp(firebaseConfig) : null)

// Configuración robusta de Firestore para evitar timeouts locales
import { initializeFirestore } from 'firebase/firestore'

export const db = app ? initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true, // Fuerza modo polling si websockets falla
}) : null

export const auth = app ? getAuth(app) : null
export { app }
