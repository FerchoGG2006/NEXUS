'use client'

import { useEffect, useState } from 'react'
import { getAfiliados, create, update, remove, generarCodigoAfiliado, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Modal, Alert, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, Users, Copy, Check, TrendingUp, Award, Share2 } from 'lucide-react'

interface Afiliado {
    id: string
    nombre: string
    email: string
    telefono: string
    codigo_referido: string
    comision_porcentaje: number
    balance_acumulado: number
    balance_pagado: number
    activo: boolean
    nivel: string
}



const niveles = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante']

export default function AfiliadosPage() {
    const [afiliados, setAfiliados] = useState<Afiliado[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAfiliado, setEditingAfiliado] = useState<Afiliado | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nombre: '', email: '', telefono: '', codigo_referido: '',
        comision_porcentaje: 10, nivel: 'Bronce', activo: true
    })

    useEffect(() => { loadAfiliados() }, [])

    const loadAfiliados = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) {
            setIsLoading(false)
            return
        }
        try {
            const data = await getAfiliados()
            setAfiliados(data as Afiliado[])
        } catch (error) {
            console.error(error)
        } finally { setIsLoading(false) }
    }

    const openModal = (afiliado?: Afiliado) => {
        if (afiliado) {
            setEditingAfiliado(afiliado)
            setFormData({
                nombre: afiliado.nombre, email: afiliado.email, telefono: afiliado.telefono || '',
                codigo_referido: afiliado.codigo_referido, comision_porcentaje: afiliado.comision_porcentaje,
                nivel: afiliado.nivel, activo: afiliado.activo
            })
        } else {
            setEditingAfiliado(null)
            setFormData({
                nombre: '', email: '', telefono: '', codigo_referido: '',
                comision_porcentaje: 10, nivel: 'Bronce', activo: true
            })
        }
        setFormError(null)
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setIsSaving(true)

        const codigo = formData.codigo_referido || generarCodigoAfiliado(formData.nombre)
        const dataToSave = { ...formData, codigo_referido: codigo }

        try {


            if (editingAfiliado) {
                await update(COLLECTIONS.AFILIADOS, editingAfiliado.id, dataToSave)
            } else {
                await create(COLLECTIONS.AFILIADOS, { ...dataToSave, balance_acumulado: 0, balance_pagado: 0 })
            }
            await loadAfiliados()
            setIsModalOpen(false)
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este afiliado?')) return

        await remove(COLLECTIONS.AFILIADOS, id)
        await loadAfiliados()
    }

    const copyLink = async (codigo: string, id: string) => {
        const link = `${window.location.origin}/socio/${codigo}`
        await navigator.clipboard.writeText(link)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const columns = [
        {
            key: 'nombre', header: 'Afiliado', sortable: true, render: (a: Afiliado) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-white font-bold relative overflow-hidden group">
                        <span className="relative z-10 group-hover:scale-110 transition-transform">{a.nombre.charAt(0)}</span>
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <p className="font-medium text-white group-hover:text-[var(--neon-purple)] transition-colors">{a.nombre}</p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'codigo_referido', header: 'Código REF', render: (a: Afiliado) => (
                <div className="flex items-center gap-2 group">
                    <span className="font-mono text-[var(--neon-cyan)] text-sm tracking-wider bg-[var(--neon-cyan)]/5 px-2 py-0.5 rounded border border-[var(--neon-cyan)]/20">
                        {a.codigo_referido}
                    </span>
                    <button
                        onClick={() => copyLink(a.codigo_referido, a.id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Copiar Link"
                    >
                        {copiedId === a.id ? <Check size={14} className="text-[var(--neon-green)]" /> : <Copy size={14} />}
                    </button>
                </div>
            )
        },
        {
            key: 'nivel',
            header: 'Nivel',
            render: (a: Afiliado) => (
                <Badge variant={a.nivel === 'Oro' || a.nivel === 'Diamante' || a.nivel === 'Platino' ? 'warning' : 'info'}>
                    {a.nivel}
                </Badge>
            )
        },
        {
            key: 'comision_porcentaje',
            header: '% Com',
            render: (a: Afiliado) => <span className="text-emerald-400 font-bold font-mono">{a.comision_porcentaje}%</span>
        },
        {
            key: 'balance',
            header: 'Balance',
            render: (a: Afiliado) => (
                <div className="flex flex-col">
                    <span className="text-white font-bold">${(a.balance_acumulado - a.balance_pagado).toFixed(2)}</span>
                    <span className="text-[10px] text-gray-500">Pendiente</span>
                </div>
            )
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (a: Afiliado) => <Badge variant={a.activo ? 'success' : 'danger'}>{a.activo ? 'Activo' : 'Inactivo'}</Badge>
        },
        {
            key: 'actions', header: '', render: (a: Afiliado) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(a)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        },
    ]

    return (
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="text-[var(--neon-purple)] w-8 h-8" />
                        Red de Afiliados
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión de socios estratégicos y referidos</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Plus size={18} />
                    <span>NUEVO SOCIO</span>
                </button>
            </header>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--neon-purple)]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-[var(--neon-purple)]/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-[var(--neon-purple)]/20 flex items-center justify-center border border-[var(--neon-purple)]/30">
                        <Users className="w-6 h-6 text-[var(--neon-purple)]" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{afiliados.filter(a => a.activo).length}</p>
                        <p className="text-xs text-purple-300 uppercase tracking-wider font-bold">Socios Activos</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">${afiliados.reduce((a, af) => a + af.balance_acumulado, 0).toFixed(2)}</p>
                        <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold">Ventas Generadas</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">${afiliados.reduce((a, af) => a + (af.balance_acumulado - af.balance_pagado), 0).toFixed(2)}</p>
                        <p className="text-xs text-amber-400 uppercase tracking-wider font-bold">Comisiones x Pagar</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <DataTable
                    data={afiliados}
                    columns={columns}
                    searchKeys={['nombre', 'email', 'codigo_referido']}
                    isLoading={isLoading}
                    emptyMessage="No hay afiliados registrados en el sistema."
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAfiliado ? 'Editar Socio' : 'Registrar Nuevo Socio'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6 text-gray-200">
                    {formError && <Alert type="danger" message={formError} />}

                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-[var(--neon-purple)] uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Share2 size={14} /> Información de Contacto
                        </h4>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Nombre Completo *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                className="input-cyber w-full"
                                required
                                placeholder="Ej: John Doe"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Email Corporativo *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    className="input-cyber w-full"
                                    required
                                    placeholder="john@nexus.tech"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Teléfono / WhatsApp</label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))}
                                    className="input-cyber w-full"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-6 rounded-xl border border-indigo-500/20 space-y-4">
                        <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Award size={14} /> Nivel y Comisiones
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Nivel de Socio</label>
                                <select
                                    value={formData.nivel}
                                    onChange={(e) => setFormData(p => ({ ...p, nivel: e.target.value }))}
                                    className="input-cyber w-full bg-black/50"
                                >
                                    {niveles.map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Comisión (%)</label>
                                <input
                                    type="number"
                                    value={formData.comision_porcentaje}
                                    onChange={(e) => setFormData(p => ({ ...p, comision_porcentaje: parseFloat(e.target.value) || 0 }))}
                                    className="input-cyber w-full bg-black/50 font-mono text-emerald-400"
                                    min="0"
                                    max="50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Código de Referido (Opcional - Autogenerado)</label>
                            <input
                                type="text"
                                value={formData.codigo_referido}
                                onChange={(e) => setFormData(p => ({ ...p, codigo_referido: e.target.value.toUpperCase() }))}
                                className="input-cyber w-full font-mono tracking-wider text-center"
                                placeholder="Ej: JOHN2024"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Si se deja vacío, se generará uno automáticamente basado en el nombre.</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="btn-cyber-primary px-6 py-2 rounded-lg">
                            {isSaving ? 'Procesando...' : 'Guardar Socio'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
