'use client'

import { useEffect, useState } from 'react'
import { getMetricasDashboard, subscribeToConversaciones, subscribeToPedidosDespacho, isFirebaseConfigured } from '@/lib/firebase'
import { formatPrice } from '@/lib/currency'
import { TrendingUp, DollarSign, MessageSquare, Truck, Bot, Package, ArrowRight, Sparkles } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Metrics {
    ganancia_neta_total: number
    total_ventas: number
    numero_transacciones: number
    conversaciones_activas: number
    pedidos_pendientes: number
    productos_stock_critico: number
    afiliados_activos: number
}

interface Conversacion {
    id: string
    cliente_nombre: string
    producto_nombre: string
    estado: string
    plataforma: string
    updated_at: string
}

interface PedidoDespacho {
    id: string
    producto_nombre: string
    cliente_datos: { nombre_completo: string }
    total: number
    ganancia_neta: number
    estado: string
    created_at: string
}

const demoMetrics: Metrics = {
    ganancia_neta_total: 61682000,
    total_ventas: 169400000,
    numero_transacciones: 156,
    conversaciones_activas: 5,
    pedidos_pendientes: 3,
    productos_stock_critico: 2,
    afiliados_activos: 12,
}

const demoConversaciones: Conversacion[] = [
    { id: '1', cliente_nombre: 'María García', producto_nombre: 'iPhone 15 Case', estado: 'negociando', plataforma: 'whatsapp', updated_at: new Date().toISOString() },
    { id: '2', cliente_nombre: 'Carlos Pérez', producto_nombre: 'Cable USB-C', estado: 'esperando_pago', plataforma: 'facebook', updated_at: new Date(Date.now() - 300000).toISOString() },
]

const demoPedidos: PedidoDespacho[] = [
    { id: '1', producto_nombre: 'AirPods Case', cliente_datos: { nombre_completo: 'Ana Martínez' }, total: 79900, ganancia_neta: 55900, estado: 'pendiente', created_at: new Date().toISOString() },
    { id: '2', producto_nombre: 'iPhone 15 Pro Case', cliente_datos: { nombre_completo: 'Juan López' }, total: 119900, ganancia_neta: 71900, estado: 'pendiente', created_at: new Date(Date.now() - 3600000).toISOString() },
]

const plataformaEmoji: Record<string, string> = {
    whatsapp: '💬',
    facebook: '📘',
    instagram: '📸',
    web: '🌐'
}

const estadoLabels: Record<string, { label: string; class: string }> = {
    activa: { label: 'Activa', class: 'badge badge--info' },
    negociando: { label: 'Negociando', class: 'badge badge--warning' },
    esperando_pago: { label: 'Esperando Pago', class: 'badge badge--primary' },
    cerrada: { label: 'Cerrada', class: 'badge badge--success' }
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<Metrics>(demoMetrics)
    const [conversaciones, setConversaciones] = useState<Conversacion[]>(demoConversaciones)
    const [pedidos, setPedidos] = useState<PedidoDespacho[]>(demoPedidos)
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)

        // Si no hay configuración o hay error de conexión, usamos el modo DEMO/OFFLINE para no romper la UI
        const activateDemoMode = () => {
            console.warn('⚠️ Activando Modo Demo/Offline por problemas de conexión a Firebase.')
            setMetrics(demoMetrics)
            setConversaciones(demoConversaciones)
            setPedidos(demoPedidos)
            setIsDemo(true)
            setIsLoading(false)
        }

        if (!isFirebaseConfigured()) {
            activateDemoMode()
            return
        }

        try {
            // Intentar cargar métricas con el timeout que implementamos en firestore.ts
            const metricsData = await getMetricasDashboard()

            // Si metricsData viene vacío (por el timeout), activamos demo parcial si queremos, 
            // pero mejor mostramos ceros reales si la respuesta fue un objeto de ceros válido.
            // Si es null, es error grave.
            if (!metricsData) {
                throw new Error('No se pudieron cargar las métricas (Timeout o Error)')
            }

            setMetrics(metricsData as Metrics)
            setIsDemo(false)

            // Suscripciones con manejo de errores (no bloqueantes)
            try {
                // Conversaciones
                const unsubConv = subscribeToConversaciones((data) => {
                    setConversaciones(data.slice(0, 5) as Conversacion[])
                })

                // Pedidos
                const unsubPending = subscribeToPedidosDespacho((data) => {
                    setPedidos(data.filter((p: any) => p.estado === 'pendiente').slice(0, 5) as PedidoDespacho[])
                }, 'pendiente')

                // Limpieza al desmontar (opcional en este scope, pero buena práctica)
                // En este caso useEffect vacío ya maneja montaje único, pero idealmente deberíamos guardar los unsubs.
            } catch (subError) {
                console.warn('Error en suscripciones realtime:', subError)
                // No fallar toda la página por esto, las suscripciones suelen reintentar solas
            }

        } catch (error) {
            console.error('Error loading dashboard (Critical):', error)
            activateDemoMode() // Fallback a Demo si falla la carga inicial crítica
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="animate-fade-in">
                <div className="page-header">
                    <div>
                        <div className="skeleton" style={{ height: '36px', width: '280px', marginBottom: '12px' }} />
                        <div className="skeleton" style={{ height: '20px', width: '360px' }} />
                    </div>
                </div>
                <div className="grid grid--stats">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card" style={{ padding: 'var(--space-6)' }}>
                            <div className="skeleton" style={{ height: '20px', width: '120px', marginBottom: '16px' }} />
                            <div className="skeleton" style={{ height: '40px', width: '160px' }} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-container animate-fade-in">
            {/* Ambient Backgrounds */}
            <div className="glow-bg glow-1" />
            <div className="glow-bg glow-2" />

            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-[var(--neon-purple)] w-8 h-8" />
                        NEXUS COMMAND CENTER
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Sistema Autónomo de Ventas & Gestión</p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tracking-wider">SYSTEM ONLINE</span>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <span className="text-xs text-gray-400 font-mono">{new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
            </header>

            <div className="relative z-10">
                {/* AI Status Banner - Cyberpunk Style */}
                <div className="glass-panel ai-banner mb-8">
                    <div className="flex items-center gap-4">
                        <div className="ai-core-indicator">
                            <div className="core-ring"></div>
                            <Bot size={24} className="text-white relative z-10" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                Nexus AI: <span className="text-emerald-400">EN LÍNEA</span>
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {metrics.conversaciones_activas} negociaciones activas en tiempo real.
                                {isDemo && <span className="ml-2 text-amber-400">(Modo Simulación)</span>}
                            </p>
                        </div>
                        <Link href="/conversaciones" className="btn-cyber">
                            MONITORIZAR CHATS <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Integraciones (Preparación) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="integration-chip off">
                        <span className="dot off"></span> MercadoLibre
                    </div>
                    <div className="integration-chip off">
                        <span className="dot off"></span> Facebook Marketplace
                    </div>
                    <div className="integration-chip on">
                        <span className="dot on"></span> WhatsApp Business
                    </div>
                    <div className="integration-chip off">
                        <span className="dot off"></span> Instagram DM
                    </div>
                </div>

                {/* Stats Grid - Neon Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <article className="glass-card stat-card accent-green">
                        <div className="stat-icon"><DollarSign size={24} /></div>
                        <div>
                            <p className="stat-label">Ganancia Neta</p>
                            <p className="stat-value text-emerald-400">{formatPrice(metrics.ganancia_neta_total)}</p>
                        </div>
                    </article>

                    <article className="glass-card stat-card accent-blue">
                        <div className="stat-icon"><TrendingUp size={24} /></div>
                        <div>
                            <p className="stat-label">Ventas Totales</p>
                            <p className="stat-value text-blue-400">{formatPrice(metrics.total_ventas)}</p>
                        </div>
                    </article>

                    <article className="glass-card stat-card accent-purple">
                        <div className="stat-icon"><MessageSquare size={24} /></div>
                        <div>
                            <p className="stat-label">Conversaciones</p>
                            <p className="stat-value text-purple-400">{metrics.conversaciones_activas}</p>
                        </div>
                    </article>

                    <article className="glass-card stat-card accent-orange">
                        <div className="stat-icon"><Truck size={24} /></div>
                        <div>
                            <p className="stat-label">Pendientes</p>
                            <p className="stat-value text-orange-400">{metrics.pedidos_pendientes}</p>
                        </div>
                    </article>
                </section>

                {/* Main Activity Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Conversations */}
                    <article className="glass-panel">
                        <div className="panel-header">
                            <h3 className="panel-title flex items-center gap-2">
                                <MessageSquare size={18} className="text-purple-400" />
                                Actividad Reciente
                            </h3>
                            <Link href="/conversaciones" className="text-xs text-gray-400 hover:text-white transition-colors">
                                VER TODO
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {conversaciones.map(conv => (
                                <div key={conv.id} className="list-item-cyber">
                                    <div className="flex items-center gap-3">
                                        <div className="platform-icon">
                                            {plataformaEmoji[conv.plataforma] || '💬'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white text-sm">{conv.cliente_nombre}</div>
                                            <div className="text-xs text-gray-500">{conv.producto_nombre}</div>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${conv.estado}`}>
                                        {estadoLabels[conv.estado]?.label || conv.estado}
                                    </div>
                                </div>
                            ))}
                            {conversaciones.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Sin actividad detectada.
                                </div>
                            )}
                        </div>
                    </article>

                    {/* Pending Shipments */}
                    <article className="glass-panel">
                        <div className="panel-header">
                            <h3 className="panel-title flex items-center gap-2">
                                <Truck size={18} className="text-orange-400" />
                                Cola de Despacho
                            </h3>
                            <Link href="/despachos" className="text-xs text-gray-400 hover:text-white transition-colors">
                                GESTIONAR
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {pedidos.map(pedido => (
                                <div key={pedido.id} className="list-item-cyber">
                                    <div>
                                        <div className="font-semibold text-white text-sm">{pedido.producto_nombre}</div>
                                        <div className="text-xs text-gray-500">{pedido.cliente_datos.nombre_completo}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-emerald-400 text-sm">+{formatPrice(pedido.ganancia_neta)}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ganancia</div>
                                    </div>
                                </div>
                            ))}
                            {pedidos.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Todo despachado. ¡Buen trabajo!
                                </div>
                            )}
                        </div>
                    </article>
                </section>
            </div>

            <style jsx>{`
                /* Base Styles */
                .dashboard-container {
                    position: relative;
                    min-height: 85vh;
                    color: white;
                }

                .glow-bg {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.15;
                    z-index: 0;
                    pointer-events: none;
                }
                .glow-1 { top: -100px; left: -100px; background: #6366f1; }
                .glow-2 { bottom: -100px; right: -100px; background: #a855f7; }



                /* Glass Panels */
                .glass-panel {
                    background: rgba(13, 17, 23, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 24px;
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: transform 0.2s, background 0.2s;
                }
                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.07);
                    transform: translateY(-2px);
                }

                /* Integration Chips */
                .integration-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 50px;
                    border: 1px solid rgba(255,255,255,0.05);
                    font-size: 12px;
                    color: #94a3b8;
                }
                .integration-chip.on { border-color: rgba(34, 197, 94, 0.3); color: #fff; background: rgba(34, 197, 94, 0.05); }
                .dot { width: 6px; height: 6px; border-radius: 50%; }
                .dot.on { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
                .dot.off { background: #475569; }

                /* AI Banner Elements */
                .ai-core-indicator {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0f172a;
                    border-radius: 50%;
                    border: 1px solid rgba(56, 189, 248, 0.3);
                }
                .core-ring {
                    position: absolute;
                    inset: -3px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    border-top-color: #38bdf8;
                    border-right-color: #38bdf8;
                    animation: spin 3s linear infinite;
                }

                .btn-cyber {
                    background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.3), 
                                0 2px 4px -1px rgba(14, 165, 233, 0.1),
                                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                }
                
                .btn-cyber::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.2), 
                        transparent
                    );
                    transition: 0.5s;
                }

                .btn-cyber:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.4), 
                                0 4px 6px -2px rgba(14, 165, 233, 0.2),
                                0 0 20px rgba(56, 189, 248, 0.5);
                }

                .btn-cyber:hover::before {
                    left: 100%;
                }

                /* Stats Typography */
                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                }
                .accent-green .stat-icon { color: #34d399; }
                .accent-blue .stat-icon { color: #60a5fa; }
                .accent-purple .stat-icon { color: #c084fc; }
                .accent-orange .stat-icon { color: #fb923c; }

                .stat-label { font-size: 12px; color: #94a3b8; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-value { font-size: 20px; font-weight: 700; font-family: 'Inter', monospace; }

                /* List Items */
                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 16px;
                }
                .panel-title { font-size: 16px; font-weight: 600; }

                .list-item-cyber {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .list-item-cyber:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                }

                .status-badge {
                    font-size: 10px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .status-badge.activa { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
                .status-badge.negociando { background: rgba(250, 204, 21, 0.1); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.2); }
                .status-badge.esperando_pago { background: rgba(96, 165, 250, 0.1); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.2); }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
