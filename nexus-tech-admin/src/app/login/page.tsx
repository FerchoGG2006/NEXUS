'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, isFirebaseConfigured } from '@/lib/firebase'
import { Alert } from '@/components/ui'
import { Eye, EyeOff, Loader2, Zap, Mail, Lock, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react'

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
            await new Promise(r => setTimeout(r, 1500))
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
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030712]">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Grid Pattern mask */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none" />

            <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
                {/* Logo Section */}
                <div className="text-center mb-8 group">
                    <Link href="/" className="inline-flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-3xl shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            N
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-white">
                                NEXUS <span className="text-cyan-400">TECH</span>
                            </h1>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <ShieldCheck size={14} className="text-indigo-400" />
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.3em]">Secure Auth Terminal</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Main Login Card */}
                <div className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden border border-white/10 shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
                                <Zap size={16} />
                                {error}
                            </div>
                        )}

                        {!isFirebaseConfigured() && (
                            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3 text-cyan-400 text-[10px] font-mono leading-tight">
                                <Sparkles size={14} className="animate-pulse flex-shrink-0" />
                                SISTEMA EN MODO DEMOSTRACIÓN: FIREBASE NO DETECTADO
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Mail size={12} /> Correo Electrónico
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-cyber"
                                    placeholder="admin@nexustech.com"
                                    required
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-600 group-focus-within:text-cyan-500/50 transition-colors">
                                    <Sparkles size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Lock size={12} /> Contraseña
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-cyber pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-cyber-primary w-full py-4 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>AUTENTICANDO...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>ACCEDER AL SISTEMA</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Quick Demo Login */}
                    <div className="mt-10 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Acceso Rápido</span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>

                        <button
                            onClick={handleDemoLogin}
                            className="w-full flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
                        >
                            <span className="text-xs text-indigo-400 font-mono group-hover:text-indigo-300">admin@nexustech.com</span>
                            <span className="text-[10px] text-gray-600 font-mono">Contraseña: demo123456</span>
                        </button>
                    </div>
                </div>

                {/* Copyright/Footer */}
                <div className="text-center mt-10 space-y-2">
                    <p className="text-[11px] font-mono text-gray-600 uppercase tracking-widest">
                        © 2026 NEXUS TECH-ADMIN • AUTO-SALES SYSTEM
                    </p>
                    <div className="flex justify-center gap-4 text-[10px] text-gray-700">
                        <Link href="/" className="hover:text-indigo-400 transition-colors uppercase font-bold tracking-widest">Volver al Inicio</Link>
                        <span>|</span>
                        <a href="#" className="hover:text-indigo-400 transition-colors uppercase font-bold tracking-widest">Soporte Técnico</a>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </main>
    )
}
