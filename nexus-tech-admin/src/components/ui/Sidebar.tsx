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
                className="mobile-menu-btn"
                aria-label="Toggle menu"
            >
                {isOpen ? <X /> : <Menu />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Sparkles style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div>
                        <span className="sidebar-logo-text">NEXUS</span>
                        <span className="sidebar-logo-subtitle">AUTO-SALES</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return (
                                <div key={index} className="sidebar-divider">
                                    <span>{item.label}</span>
                                </div>
                            )
                        }

                        const Icon = item.icon!
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Icon />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="sidebar-badge">{item.badge}</span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer with User & Logout */}
                <div className="sidebar-footer">
                    {user && (
                        <div className="sidebar-user">
                            <p className="sidebar-user-label">Sesión activa</p>
                            <p className="sidebar-user-email">{user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="sidebar-link sidebar-logout"
                    >
                        <LogOut />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            <style>{`
                .mobile-menu-btn {
                    display: none;
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    z-index: 150;
                    width: 44px;
                    height: 44px;
                    border-radius: var(--radius-md);
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    cursor: pointer;
                    align-items: center;
                    justify-content: center;
                }

                .sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 90;
                }

                .sidebar-logo-subtitle {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: var(--color-accent-cyan);
                    letter-spacing: 0.15em;
                    margin-top: -2px;
                }

                .sidebar-divider {
                    padding: var(--space-5) var(--space-4) var(--space-2);
                    margin-top: var(--space-2);
                }

                .sidebar-divider span {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: var(--color-text-disabled);
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .sidebar-badge {
                    margin-left: auto;
                    padding: 2px 8px;
                    font-size: 0.6rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--color-accent-emerald), var(--color-accent-cyan));
                    color: white;
                    border-radius: var(--radius-full);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .sidebar-logout {
                    width: 100%;
                    color: #f87171 !important;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    font-family: inherit;
                    font-size: var(--font-size-sm);
                    text-align: left;
                }

                .sidebar-logout:hover {
                    background: rgba(244, 114, 114, 0.1) !important;
                }

                @media (max-width: 1024px) {
                    .mobile-menu-btn {
                        display: flex;
                    }

                    .sidebar-overlay {
                        display: block;
                    }

                    .sidebar {
                        transform: translateX(-100%);
                    }

                    .sidebar.open {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    )
}
