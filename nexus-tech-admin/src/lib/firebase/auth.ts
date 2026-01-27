import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './config'

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!auth || !isFirebaseConfigured()) {
        return { user: null, error: 'Firebase no está configurado. Usando modo demo.' }
    }

    try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return { user: result.user, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error de autenticación'
        return { user: null, error: message }
    }
}

export async function signOut(): Promise<void> {
    if (!auth) return
    try {
        await firebaseSignOut(auth)
    } catch (error) {
        console.error('Error signing out:', error)
    }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
    if (!auth) {
        callback(null)
        return () => { }
    }
    return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): User | null {
    return auth?.currentUser || null
}

export type { User }
