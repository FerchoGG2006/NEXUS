'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut, onAuthChange } from '@/lib/firebase'
import type { User } from 'firebase/auth'
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    Building2,
    FileText,
    BarChart3,
    AlertTriangle,
    Settings,
    LogOut,
    Menu,
    X,
    MessageSquare,
    Truck,
    Bot,
    Sparkles
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'divider', label: 'VENTAS AUTÓNOMAS' },
    { href: '/conversaciones', label: 'Conversaciones IA', icon: MessageSquare, badge: 'LIVE' },
    { href: '/despachos', label: 'Despachos', icon: Truck },
    { type: 'divider', label: 'INVENTARIO' },
    { href: '/productos', label: 'Productos', icon: Package },
    { href: '/alertas', label: 'Alertas Stock', icon: AlertTriangle },
    { type: 'divider', label: 'VENTAS TRADICIONALES' },
    { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { href: '/afiliados', label: 'Afiliados', icon: Users },
    { href: '/clientes-b2b', label: 'Clientes B2B', icon: Building2 },
    { href: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
    { type: 'divider', label: 'ANÁLISIS' },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
    { type: 'divider', label: 'CONFIGURACIÓN' },
    { href: '/configuracion-ia', label: 'Agente IA', icon: Bot },
    { href: '/configuracion', label: 'General', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthChange((u) => setUser(u))
        return () => unsubscribe()
    }, [])

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 glass-panel rounded-lg text-white md:hidden hover:text-cyan-400 transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed top-4 bottom-4 left-4 w-64 glass-panel rounded-2xl z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'
                    }`}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3 border-b border-[var(--glass-border)]">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-cyan)] flex items-center justify-center shadow-[0_0_15px_var(--neon-cyan-glow)]">
                        <Sparkles className="text-white w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-wider text-white">NEXUS</h1>
                        <p className="text-[10px] font-mono text-[var(--neon-cyan)] tracking-[0.2em]">AUTO-SALES</p>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {navItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return (
                                <div key={index} className="px-4 mt-6 mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold font-mono">
                                        {item.label}
                                    </span>
                                </div>
                            )
                        }

                        const Icon = item.icon!
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'text-white bg-gradient-to-r from-[rgba(139,92,246,0.15)] to-transparent'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                {/* Active Indicator Line */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--neon-cyan)] rounded-r-full shadow-[0_0_10px_var(--neon-cyan)]" />
                                )}

                                <Icon
                                    size={18}
                                    className={`transition-colors ${isActive ? 'text-[var(--neon-cyan)]' : 'group-hover:text-[var(--neon-purple)]'}`}
                                />
                                <span className={`text-sm font-medium ${isActive ? 'tracking-wide' : ''}`}>
                                    {item.label}
                                </span>

                                {item.badge && (
                                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[rgba(16,185,129,0.2)] text-[var(--neon-green)] border border-[rgba(16,185,129,0.3)] rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User/Footer Section */}
                <div className="p-4 border-t border-[var(--glass-border)] bg-black/20 rounded-b-2xl">
                    {user && (
                        <div className="mb-3 px-2">
                            <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-1">Operador Conectado</p>
                            <p className="text-xs text-white font-mono truncate">{user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium"
                    >
                        <LogOut size={16} />
                        <span>DESCONECTAR</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
