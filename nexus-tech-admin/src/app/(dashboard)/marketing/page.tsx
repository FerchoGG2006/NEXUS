'use client'

import { useEffect, useState } from 'react'
import { getMarketingLeads, getClientesInactivos, isFirebaseConfigured } from '@/lib/firebase'
import { Megaphone, Users, Target, Zap, Clock, TrendingUp, Filter, Plus, Mail, MessageSquare } from 'lucide-react'
import { DataTable, Badge, StatsCard } from '@/components/ui'

interface ClienteLead {
    id: string
    nombre: string
    telefono: string
    modelo_celular_actual: string
    origen: string
    estado_conversion: 'frio' | 'tibio' | 'caliente' | 'comprador'
    ultima_compra: string
}

const demoLeads: ClienteLead[] = [
    { id: '1', nombre: 'Juan Pérez', telefono: '+57 300 111 2233', modelo_celular_actual: 'iPhone 13', origen: 'TikTok', estado_conversion: 'caliente', ultima_compra: '2023-10-05T10:00:00Z' },
    { id: '2', nombre: 'Ana García', telefono: '+57 311 444 5566', modelo_celular_actual: 'iPhone 15 Pro', origen: 'Instagram', estado_conversion: 'comprador', ultima_compra: '2023-08-15T10:00:00Z' },
    { id: '3', nombre: 'Roberto Soto', telefono: '+57 320 777 8899', modelo_celular_actual: 'iPhone 12', origen: 'Feria Presencial', estado_conversion: 'frio', ultima_compra: '2023-05-20T10:00:00Z' },
]

export default function MarketingPage() {
    const [leads, setLeads] = useState<ClienteLead[]>([])
    const [inactivos, setInactivos] = useState<ClienteLead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) {
            setIsDemo(true)
            setLeads(demoLeads)
            setInactivos(demoLeads.filter(l => new Date(l.ultima_compra) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)))
            setIsLoading(false)
            return
        }

        try {
            const [leadsData, inactivosData] = await Promise.all([
                getMarketingLeads(),
                getClientesInactivos(3)
            ])
            setLeads(leadsData as ClienteLead[])
            setInactivos(inactivosData as ClienteLead[])
        } catch (error) {
            console.error(error)
            setIsDemo(true)
            setLeads(demoLeads)
        } finally {
            setIsLoading(false)
        }
    }

    const columns = [
        {
            key: 'nombre', header: 'Cliente', render: (l: ClienteLead) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {l.nombre.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium text-white">{l.nombre}</p>
                        <p className="text-[10px] text-gray-500">{l.telefono}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'modelo_celular_actual', header: 'Dispositivo', render: (l: ClienteLead) => (
                <span className="text-xs text-gray-400 font-mono">{l.modelo_celular_actual || 'Desconocido'}</span>
            )
        },
        {
            key: 'origen', header: 'Origen', render: (l: ClienteLead) => (
                <Badge variant="info">{l.origen}</Badge>
            )
        },
        {
            key: 'estado_conversion', header: 'Estado', render: (l: ClienteLead) => (
                <Badge variant={
                    l.estado_conversion === 'comprador' ? 'success' :
                        l.estado_conversion === 'caliente' ? 'warning' :
                            l.estado_conversion === 'tibio' ? 'info' : 'danger'
                }>
                    {l.estado_conversion.toUpperCase()}
                </Badge>
            )
        },
        {
            key: 'ultima_compra', header: 'Última Compra', render: (l: ClienteLead) => (
                <div className="flex flex-col">
                    <span className="text-xs text-gray-300">
                        {new Date(l.ultima_compra).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                        Hace {Math.floor((Date.now() - new Date(l.ultima_compra).getTime()) / (1000 * 60 * 60 * 24))} días
                    </span>
                </div>
            )
        },
        {
            key: 'actions', header: '', render: (l: ClienteLead) => (
                <button className="p-2 hover:bg-white/10 rounded-lg text-[var(--neon-cyan)] transition-colors">
                    <Zap size={16} />
                </button>
            )
        }
    ]

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <header className="flex justify-between items-center bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Megaphone className="text-[var(--neon-purple)] w-8 h-8 animate-pulse" />
                        Marketing Automatizado
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Segmentación inteligente y disparadores de ventas proactivos</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2">
                        <Filter size={16} /> FILTRAR SEGMENTO
                    </button>
                    <button className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2">
                        <Plus size={18} /> NUEVA CAMPAÑA
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Leads Totales"
                    value={leads.length}
                    icon={Users}
                    change={{ value: 12, label: 'vs mes anterior' }}
                    variant="info"
                />
                <StatsCard
                    title="Clientes Inactivos"
                    value={inactivos.length}
                    icon={Clock}
                    change={{ value: -5, label: 'vs mes anterior' }}
                    variant="warning"
                />
                <StatsCard
                    title="Campañas Activas"
                    value={2}
                    icon={Target}
                    variant="info"
                />
                <StatsCard
                    title="ROI Estimado"
                    value="24.5%"
                    icon={TrendingUp}
                    variant="success"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Automation Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Zap className="text-yellow-400" size={20} />
                                Clientes con Oportunidad de Renovación
                            </h2>
                            <button className="text-[var(--neon-cyan)] text-xs font-bold hover:underline">
                                CONTACTAR A TODOS
                            </button>
                        </div>

                        <DataTable
                            data={inactivos}
                            columns={columns}
                            isLoading={isLoading}
                            emptyMessage="No hay clientes inactivos por el momento."
                        />
                    </section>
                </div>

                {/* Campaigns List */}
                <div className="space-y-6">
                    <section className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <Target className="text-pink-500" size={20} />
                            Campañas Programadas
                        </h2>

                        <div className="space-y-4">
                            {[
                                { name: 'Upsell Protector 6 meses', target: 'Usuarios iPhone 15', status: 'activa' },
                                { name: 'Promo Navidad Accesorios', target: 'Toda la Base', status: 'activa' },
                                { name: 'Lanzamiento iPhone 16', target: 'Dueños de iPhone 13/14', status: 'pausada' }
                            ].map((c, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white group-hover:text-[var(--neon-cyan)] transition-colors">{c.name}</h3>
                                        <Badge variant={c.status === 'activa' ? 'success' : 'info'}>{c.status}</Badge>
                                    </div>
                                    <p className="text-xs text-gray-500">Segmento: {c.target}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button className="flex-1 py-1 bg-white/5 rounded border border-white/10 text-[10px] text-gray-400 hover:text-white transition-colors">ESTADÍSTICAS</button>
                                        <button className="flex-1 py-1 bg-indigo-500/20 rounded border border-indigo-500/30 text-[10px] text-indigo-400 hover:bg-indigo-500/30 transition-all">EDITAR</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                <MessageSquare className="text-indigo-400" />
                            </div>
                            <h3 className="font-bold text-white text-sm">Bot de Seguimiento</h3>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mb-6">
                            El sistema detectará automáticamente cuando un cliente cumpla 4 meses desde su última compra y le enviará el catálogo de accesorios vía WhatsApp.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Estado: Activo</span>
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
