'use client'

import { useEffect, useState } from 'react'
import { subscribeToPedidosDespacho, marcarComoEnviado, marcarComoEntregado, isFirebaseConfigured } from '@/lib/firebase'
import { Package, Truck, CheckCircle, MapPin, Phone, Calendar, DollarSign, Printer, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DatosEnvio {
    nombre_completo: string
    direccion: string
    ciudad: string
    codigo_postal?: string
    telefono: string
    notas?: string
}

interface PedidoDespacho {
    id: string
    conversacion_id: string
    cliente_datos: DatosEnvio
    producto_id: string
    producto_nombre: string
    cantidad: number
    precio_unitario: number
    total: number
    costo_total: number
    ganancia_neta: number
    plataforma: string
    estado: 'pendiente' | 'preparando' | 'enviado' | 'entregado' | 'devuelto'
    tracking_number?: string
    notas_despacho?: string
    created_at: string
    despachado_at?: string
}

const demoPedidos: PedidoDespacho[] = [
    {
        id: '1',
        conversacion_id: 'conv-1',
        cliente_datos: {
            nombre_completo: 'María García López',
            direccion: 'Calle 45 #23-10, Edificio Centro',
            ciudad: 'Medellín, Antioquia',
            telefono: '+57 300 123 4567'
        },
        producto_id: 'prod-1',
        producto_nombre: 'iPhone 15 Pro Case - Negro',
        cantidad: 1,
        precio_unitario: 29.99,
        total: 29.99,
        costo_total: 12.00,
        ganancia_neta: 17.99,
        plataforma: 'whatsapp',
        estado: 'pendiente',
        created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: '2',
        conversacion_id: 'conv-2',
        cliente_datos: {
            nombre_completo: 'Carlos Andrés Pérez',
            direccion: 'Carrera 15 #80-45, Apto 501',
            ciudad: 'Bogotá',
            telefono: '+57 311 987 6543'
        },
        producto_id: 'prod-2',
        producto_nombre: 'Cable USB-C 2m Premium',
        cantidad: 2,
        precio_unitario: 12.99,
        total: 25.98,
        costo_total: 8.00,
        ganancia_neta: 17.98,
        plataforma: 'facebook',
        estado: 'pendiente',
        created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: '3',
        conversacion_id: 'conv-3',
        cliente_datos: {
            nombre_completo: 'Ana María Martínez',
            direccion: 'Calle 10 #5-20',
            ciudad: 'Cali',
            telefono: '+57 320 456 7890'
        },
        producto_id: 'prod-3',
        producto_nombre: 'AirPods Pro Case Silicona',
        cantidad: 1,
        precio_unitario: 19.99,
        total: 19.99,
        costo_total: 6.00,
        ganancia_neta: 13.99,
        plataforma: 'instagram',
        estado: 'enviado',
        tracking_number: 'COL123456789',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        despachado_at: new Date(Date.now() - 43200000).toISOString()
    }
]

const estadoConfig = {
    pendiente: { label: 'Listo para enviar', className: 'badge badge--warning', color: '#f59e0b' },
    preparando: { label: 'Preparando', className: 'badge badge--info', color: '#3b82f6' },
    enviado: { label: 'Enviado', className: 'badge badge--primary', color: '#6366f1' },
    entregado: { label: 'Entregado', className: 'badge badge--success', color: '#22c55e' },
    devuelto: { label: 'Devuelto', className: 'badge badge--danger', color: '#ef4444' }
}

const plataformaEmoji: Record<string, string> = {
    whatsapp: '💬',
    facebook: '📘',
    instagram: '📸',
    web: '🌐'
}

export default function DespachosPage() {
    const [pedidos, setPedidos] = useState<PedidoDespacho[]>(demoPedidos)
    const [isDemo, setIsDemo] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState<string>('todos')
    const [busqueda, setBusqueda] = useState('')
    const [selectedPedido, setSelectedPedido] = useState<PedidoDespacho | null>(null)
    const [trackingInput, setTrackingInput] = useState('')

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setIsDemo(true)
            return
        }

        setIsDemo(false)
        const unsubscribe = subscribeToPedidosDespacho((data) => {
            setPedidos(data as PedidoDespacho[])
        })

        return () => unsubscribe()
    }, [])

    const handleMarcarEnviado = async (pedidoId: string) => {
        if (isDemo) {
            setPedidos(prev => prev.map(p =>
                p.id === pedidoId
                    ? { ...p, estado: 'enviado' as const, tracking_number: trackingInput, despachado_at: new Date().toISOString() }
                    : p
            ))
        } else {
            await marcarComoEnviado(pedidoId, trackingInput)
        }
        setSelectedPedido(null)
        setTrackingInput('')
    }

    const handleMarcarEntregado = async (pedidoId: string) => {
        if (isDemo) {
            setPedidos(prev => prev.map(p =>
                p.id === pedidoId
                    ? { ...p, estado: 'entregado' as const }
                    : p
            ))
        } else {
            await marcarComoEntregado(pedidoId)
        }
    }

    const pedidosFiltrados = pedidos.filter(p => {
        const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado
        const matchBusqueda = !busqueda ||
            p.cliente_datos.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.producto_nombre.toLowerCase().includes(busqueda.toLowerCase())
        return matchEstado && matchBusqueda
    })

    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length
    const enviados = pedidos.filter(p => p.estado === 'enviado').length
    const entregados = pedidos.filter(p => p.estado === 'entregado').length
    const gananciaTotal = pedidos.reduce((sum, p) => sum + p.ganancia_neta, 0)

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">Centro de Despachos</h1>
                    <p className="page-subtitle">Gestiona los envíos de las ventas cerradas por la IA</p>
                </div>
            </header>

            {/* Stats */}
            <section className="grid grid--4" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div className="card-icon card-icon--warning">
                            <Package />
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Pendientes</p>
                            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#f59e0b' }}>{pendientes}</p>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div className="card-icon card-icon--primary">
                            <Truck />
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>En Camino</p>
                            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#6366f1' }}>{enviados}</p>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div className="card-icon card-icon--success">
                            <CheckCircle />
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Entregados</p>
                            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#22c55e' }}>{entregados}</p>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div className="card-icon card-icon--success">
                            <DollarSign />
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Ganancia Neta</p>
                            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#22c55e' }}>${gananciaTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="input-group" style={{ flex: 1, maxWidth: '400px' }}>
                    <div className="input-icon"><Search /></div>
                    <input
                        type="text"
                        className="input input--with-icon"
                        placeholder="Buscar por cliente o producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <select
                    className="input select"
                    style={{ width: 'auto' }}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="enviado">Enviados</option>
                    <option value="entregado">Entregados</option>
                </select>
            </section>

            {/* Pedidos Grid */}
            <section className="despachos-grid">
                {pedidosFiltrados.length === 0 ? (
                    <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                        <div className="empty-state-icon">
                            <Package />
                        </div>
                        <p className="empty-state-title">No hay pedidos</p>
                        <p className="empty-state-text">Los pedidos cerrados por la IA aparecerán aquí</p>
                    </div>
                ) : (
                    pedidosFiltrados.map(pedido => {
                        const estadoCfg = estadoConfig[pedido.estado]
                        return (
                            <article key={pedido.id} className="despacho-card">
                                <div className="despacho-header">
                                    <span className="despacho-plataforma">
                                        {plataformaEmoji[pedido.plataforma]} Venta IA
                                    </span>
                                    <span className={estadoCfg.className}>{estadoCfg.label}</span>
                                </div>

                                <h3 className="despacho-producto">{pedido.producto_nombre}</h3>
                                <p className="despacho-cantidad">Cantidad: {pedido.cantidad}</p>

                                <div className="despacho-cliente">
                                    <div className="despacho-cliente-row">
                                        <MapPin style={{ width: '16px', height: '16px' }} />
                                        <div>
                                            <strong>{pedido.cliente_datos.nombre_completo}</strong>
                                            <p>{pedido.cliente_datos.direccion}</p>
                                            <p>{pedido.cliente_datos.ciudad}</p>
                                        </div>
                                    </div>
                                    <div className="despacho-cliente-row">
                                        <Phone style={{ width: '16px', height: '16px' }} />
                                        <span>{pedido.cliente_datos.telefono}</span>
                                    </div>
                                </div>

                                <div className="despacho-financials">
                                    <div className="despacho-financial-item">
                                        <span>Total</span>
                                        <strong>${pedido.total.toFixed(2)}</strong>
                                    </div>
                                    <div className="despacho-financial-item profit">
                                        <span>Ganancia</span>
                                        <strong>${pedido.ganancia_neta.toFixed(2)}</strong>
                                    </div>
                                </div>

                                <div className="despacho-meta">
                                    <Calendar style={{ width: '14px', height: '14px' }} />
                                    <span>{format(new Date(pedido.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</span>
                                </div>

                                {pedido.tracking_number && (
                                    <div className="despacho-tracking">
                                        <Truck style={{ width: '14px', height: '14px' }} />
                                        <span>Tracking: {pedido.tracking_number}</span>
                                    </div>
                                )}

                                <div className="despacho-actions">
                                    {pedido.estado === 'pendiente' && (
                                        <>
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => window.print()}
                                            >
                                                <Printer style={{ width: '16px', height: '16px' }} />
                                                Etiqueta
                                            </button>
                                            <button
                                                className="btn btn--primary btn--sm"
                                                onClick={() => setSelectedPedido(pedido)}
                                            >
                                                <Truck style={{ width: '16px', height: '16px' }} />
                                                Marcar Enviado
                                            </button>
                                        </>
                                    )}
                                    {pedido.estado === 'enviado' && (
                                        <button
                                            className="btn btn--success btn--sm"
                                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                            onClick={() => handleMarcarEntregado(pedido.id)}
                                        >
                                            <CheckCircle style={{ width: '16px', height: '16px' }} />
                                            Confirmar Entrega
                                        </button>
                                    )}
                                </div>
                            </article>
                        )
                    })
                )}
            </section>

            {/* Modal para tracking */}
            {selectedPedido && (
                <div className="modal-overlay" onClick={() => setSelectedPedido(null)}>
                    <div className="modal animate-fade-in" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2 className="modal-title">Marcar como Enviado</h2>
                            <button className="modal-close" onClick={() => setSelectedPedido(null)}>×</button>
                        </header>
                        <div className="modal-body">
                            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                                Ingresa el número de tracking (opcional)
                            </p>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej: COL123456789"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                            />
                        </div>
                        <footer className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setSelectedPedido(null)}>
                                Cancelar
                            </button>
                            <button className="btn btn--primary" onClick={() => handleMarcarEnviado(selectedPedido.id)}>
                                Confirmar Envío
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            <style>{`
                .despachos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: var(--space-6);
                }

                .despacho-card {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-xl);
                    padding: var(--space-6);
                    transition: all var(--transition-base);
                }

                .despacho-card:hover {
                    border-color: rgba(99, 102, 241, 0.3);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
                }

                .despacho-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-4);
                }

                .despacho-plataforma {
                    font-size: var(--font-size-sm);
                    color: var(--color-text-muted);
                }

                .despacho-producto {
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin-bottom: var(--space-1);
                }

                .despacho-cantidad {
                    font-size: var(--font-size-sm);
                    color: var(--color-text-muted);
                    margin-bottom: var(--space-5);
                }

                .despacho-cliente {
                    background: var(--color-bg-tertiary);
                    border-radius: var(--radius-lg);
                    padding: var(--space-4);
                    margin-bottom: var(--space-5);
                }

                .despacho-cliente-row {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--space-3);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm);
                }

                .despacho-cliente-row + .despacho-cliente-row {
                    margin-top: var(--space-3);
                    padding-top: var(--space-3);
                    border-top: 1px solid var(--color-border);
                }

                .despacho-cliente-row strong {
                    color: var(--color-text-primary);
                    display: block;
                    margin-bottom: var(--space-1);
                }

                .despacho-cliente-row svg {
                    color: var(--color-text-muted);
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .despacho-financials {
                    display: flex;
                    gap: var(--space-4);
                    margin-bottom: var(--space-4);
                }

                .despacho-financial-item {
                    flex: 1;
                    text-align: center;
                    padding: var(--space-3);
                    background: var(--color-bg-tertiary);
                    border-radius: var(--radius-md);
                }

                .despacho-financial-item span {
                    display: block;
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    margin-bottom: var(--space-1);
                }

                .despacho-financial-item strong {
                    font-size: var(--font-size-lg);
                    color: var(--color-text-primary);
                }

                .despacho-financial-item.profit strong {
                    color: var(--color-accent-emerald);
                }

                .despacho-meta,
                .despacho-tracking {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    margin-bottom: var(--space-3);
                }

                .despacho-tracking {
                    color: var(--color-primary-light);
                }

                .despacho-actions {
                    display: flex;
                    gap: var(--space-3);
                    margin-top: var(--space-5);
                    padding-top: var(--space-5);
                    border-top: 1px solid var(--color-border);
                }

                .despacho-actions .btn {
                    flex: 1;
                }

                @media (max-width: 640px) {
                    .despachos-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    )
}
