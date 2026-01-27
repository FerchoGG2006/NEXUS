'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, isFirebaseConfigured } from '@/lib/firebase'
import { Alert } from '@/components/ui'
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        // Modo demo si Firebase no está configurado
        if (!isFirebaseConfigured()) {
            // Simular login en modo demo
            await new Promise(r => setTimeout(r, 1000))
            router.push('/dashboard')
            return
        }

        const { error: authError } = await signIn(email, password)

        if (authError) {
            setError(authError)
            setIsLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    const handleDemoLogin = () => {
        setEmail('admin@nexustech.com')
        setPassword('demo123456')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
                            N
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                            NEXUS TECH
                        </span>
                    </Link>
                    <p className="text-gray-400 mt-4">Ingresa a tu panel de administración</p>
                </div>

                {/* Form Card */}
                <div className="card-glass p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

                        {!isFirebaseConfigured() && (
                            <Alert type="info" message="Modo demo activo. Firebase no configurado." />
                        )}

                        <div>
                            <label htmlFor="email" className="label">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="admin@nexustech.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full btn-lg disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Ingresar
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-sm text-gray-500 text-center mb-3">Credenciales de demostración:</p>
                        <button
                            onClick={handleDemoLogin}
                            className="btn btn-ghost w-full text-sm"
                        >
                            admin@nexustech.com / demo123456
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    © 2026 NEXUS TECH-ADMIN. Todos los derechos reservados.
                </p>
            </div>
        </div>
    )
}
