'use client'

import { useEffect, useState } from 'react'
import { getMarketingLeads, getClientesInactivos, isFirebaseConfigured } from '@/lib/firebase'
import { Megaphone, Users, Target, Zap, Clock, TrendingUp, Filter, Plus, Mail, MessageSquare, X, CheckCircle2 } from 'lucide-react'
import { DataTable, Badge, StatsCard } from '@/components/ui'
import { create } from '@/lib/firebase/firestore'

interface ClienteLead {
    id: string
    nombre: string
    telefono: string
    modelo_celular_actual: string
    origen: string
    estado_conversion: 'frio' | 'tibio' | 'caliente' | 'comprador'
    ultima_compra: string
}



export default function MarketingPage() {
    const [leads, setLeads] = useState<ClienteLead[]>([])
    const [inactivos, setInactivos] = useState<ClienteLead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [newCampaign, setNewCampaign] = useState({
        nombre: '',
        segmento: 'Todos los Clientes',
        mensaje: '',
        activa: true,
        presupuesto: 0
    })


    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) {
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

    const handleSaveCampaign = async () => {
        if (!newCampaign.nombre || !newCampaign.mensaje) return
        setIsSaving(true)
        try {
            await create('campanas', newCampaign)
            setIsModalOpen(false)
            setNewCampaign({
                nombre: '',
                segmento: 'Todos los Clientes',
                mensaje: '',
                activa: true,
                presupuesto: 0
            })
            loadData()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

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
                    <button
                        className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2"
                        onClick={() => setIsModalOpen(true)}
                    >
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
                    prefix=""
                />
                <StatsCard
                    title="Clientes Inactivos"
                    value={inactivos.length}
                    icon={Clock}
                    change={{ value: -5, label: 'vs mes anterior' }}
                    variant="warning"
                    prefix=""
                />
                <StatsCard
                    title="Campañas Activas"
                    value={2}
                    icon={Target}
                    variant="info"
                    prefix=""
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

            {/* Modal de Nueva Campaña */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-white/10">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Megaphone className="text-[var(--neon-purple)]" size={24} />
                                Configurar Nueva Campaña
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-widest">Nombre de la Campaña</label>
                                <input
                                    type="text"
                                    className="input-cyber w-full"
                                    placeholder="Ej: Promo Navidad Accesorios"
                                    value={newCampaign.nombre}
                                    onChange={e => setNewCampaign({ ...newCampaign, nombre: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase tracking-widest">Segmento Objetivo</label>
                                    <select
                                        className="input-cyber w-full bg-black/40"
                                        value={newCampaign.segmento}
                                        onChange={e => setNewCampaign({ ...newCampaign, segmento: e.target.value })}
                                    >
                                        <option>Todos los Clientes</option>
                                        <option>Usuarios iPhone 15</option>
                                        <option>Clientes Inactivos</option>
                                        <option>Compradores VIP</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase tracking-widest">Presupuesto Diario</label>
                                    <input
                                        type="number"
                                        className="input-cyber w-full"
                                        placeholder="$ 0.00"
                                        value={newCampaign.presupuesto}
                                        onChange={e => setNewCampaign({ ...newCampaign, presupuesto: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-widest">Script del Mensaje (IA)</label>
                                <textarea
                                    className="input-cyber w-full min-h-[120px]"
                                    placeholder="Escribe el mensaje base que la IA usará para persuadir a los clientes..."
                                    value={newCampaign.mensaje}
                                    onChange={e => setNewCampaign({ ...newCampaign, mensaje: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-500 italic">La IA personalizará este mensaje para cada cliente individualmente.</p>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                            <button
                                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/10 transition-all"
                                onClick={() => setIsModalOpen(false)}
                            >
                                CANCELAR
                            </button>
                            <button
                                className="flex-[2] btn-cyber-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                                onClick={handleSaveCampaign}
                                disabled={isSaving || !newCampaign.nombre || !newCampaign.mensaje}
                            >
                                {isSaving ? 'GUARDANDO...' : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        ACTIVAR CAMPAÑA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
