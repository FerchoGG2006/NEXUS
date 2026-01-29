'use client'

import { useEffect, useState } from 'react'
import { subscribeToPedidosDespacho, marcarComoEnviado, marcarComoEntregado, isFirebaseConfigured } from '@/lib/firebase'
import { Package, Truck, CheckCircle, MapPin, Phone, Calendar, DollarSign, Printer, Search, ArrowRight, Box } from 'lucide-react'
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
    pendiente: { label: 'Listo para Enviar', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    preparando: { label: 'Preparando', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    enviado: { label: 'En Camino', color: 'text-[var(--neon-purple)]', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    entregado: { label: 'Entregado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    devuelto: { label: 'Devuelto', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
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
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Truck className="text-[var(--neon-cyan)] w-8 h-8" />
                        Centro de Despachos
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión logística de pedidos cerrados por IA</p>
                </div>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-blue-400"></div>
                    <span><strong>Modo Demo Activo.</strong> Visualizando pedidos simulados.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500"><Package size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Pendientes</p>
                        <p className="text-2xl font-bold text-white">{pendientes}</p>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-[var(--neon-purple)] flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-[var(--neon-purple)]"><Truck size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">En Camino</p>
                        <p className="text-2xl font-bold text-white">{enviados}</p>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Entregados</p>
                        <p className="text-2xl font-bold text-white">{entregados}</p>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-500 flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-500"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Ganancia Neta</p>
                        <p className="text-2xl font-bold text-white">${gananciaTotal.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        className="input-cyber w-full pl-10"
                        placeholder="Buscar por cliente, dirección o producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <select
                    className="input-cyber w-full md:w-48"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="enviado">Enviados</option>
                    <option value="entregado">Entregados</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pedidosFiltrados.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-700 rounded-2xl bg-white/5">
                        <Box className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-300">No se encontraron pedidos</h3>
                        <p className="text-gray-500 mt-2">Intenta cambiar los filtros de búsqueda.</p>
                    </div>
                ) : (
                    pedidosFiltrados.map(pedido => {
                        const estadoCfg = estadoConfig[pedido.estado] || estadoConfig.pendiente
                        return (
                            <article key={pedido.id} className="glass-panel p-0 rounded-2xl overflow-hidden group hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300 border border-white/5 hover:border-[var(--neon-cyan)]/30">
                                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${estadoCfg.bg} ${estadoCfg.color} border ${estadoCfg.border}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                            {estadoCfg.label}
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
                                            {plataformaEmoji[pedido.plataforma]} {pedido.plataforma.toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 mb-1">{pedido.producto_nombre}</h3>
                                    <p className="text-gray-400 text-sm">Cantidad: <span className="text-white font-medium">{pedido.cantidad} u.</span></p>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="flex items-start gap-3 text-sm">
                                        <div className="p-2 bg-gray-800 rounded-lg text-gray-400 shrink-0"><MapPin size={16} /></div>
                                        <div>
                                            <p className="font-bold text-gray-200">{pedido.cliente_datos.nombre_completo}</p>
                                            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                                                {pedido.cliente_datos.direccion}<br />
                                                {pedido.cliente_datos.ciudad}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-gray-800 rounded-lg text-gray-400 shrink-0"><Phone size={16} /></div>
                                        <span className="text-gray-300 font-mono tracking-wide">{pedido.cliente_datos.telefono}</span>
                                    </div>

                                    <div className="bg-black/30 rounded-xl p-3 grid grid-cols-2 gap-px border border-white/5">
                                        <div className="text-center border-r border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase">Total Venta</p>
                                            <p className="text-white font-mono font-bold">${pedido.total.toFixed(2)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Ganancia</p>
                                            <p className="text-emerald-400 font-mono font-bold">+${pedido.ganancia_neta.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-white/5">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {format(new Date(pedido.created_at), "d MMM, HH:mm", { locale: es })}
                                        </span>
                                        {pedido.tracking_number && (
                                            <span className="flex items-center gap-1.5 text-[var(--neon-purple)]">
                                                <Truck size={12} />
                                                #{pedido.tracking_number}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {(pedido.estado === 'pendiente' || pedido.estado === 'enviado') && (
                                    <div className="p-4 bg-gray-900/50 flex gap-2 border-t border-white/5">
                                        {pedido.estado === 'pendiente' && (
                                            <>
                                                <button onClick={() => window.print()} className="btn-ghost flex-1 py-2 text-xs flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                    <Printer size={16} />
                                                    Etiqueta
                                                </button>
                                                <button onClick={() => setSelectedPedido(pedido)} className="btn-cyber-primary flex-1 py-2 text-xs flex items-center justify-center gap-2">
                                                    Marcar Enviado <ArrowRight size={14} />
                                                </button>
                                            </>
                                        )}
                                        {pedido.estado === 'enviado' && (
                                            <button
                                                onClick={() => handleMarcarEntregado(pedido.id)}
                                                className="w-full py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all text-sm font-medium"
                                            >
                                                <CheckCircle size={16} />
                                                Confirmar Entrega
                                            </button>
                                        )}
                                    </div>
                                )}
                            </article>
                        )
                    })
                )}
            </div>

            {/* Modal para tracking - Futurista */}
            {selectedPedido && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPedido(null)}>
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-[var(--neon-purple)]/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-fade-in relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-transparent"></div>

                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Truck className="text-[var(--neon-purple)]" />
                            Confirmar Despacho
                        </h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Estás marcando el pedido de <strong className="text-white">{selectedPedido.cliente_datos.nombre_completo}</strong> como enviado.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Número de Guía / Tracking (Opcional)</label>
                                <input
                                    type="text"
                                    className="input-cyber w-full"
                                    placeholder="Ej: SERV12345678"
                                    value={trackingInput}
                                    onChange={(e) => setTrackingInput(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm font-medium" onClick={() => setSelectedPedido(null)}>
                                    Cancelar
                                </button>
                                <button className="flex-1 btn-cyber-primary py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20" onClick={() => handleMarcarEnviado(selectedPedido.id)}>
                                    Confirmar Envío
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
