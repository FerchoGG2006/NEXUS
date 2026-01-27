'use client'

import { useEffect, useState } from 'react'
import { getAfiliados, create, update, remove, generarCodigoAfiliado, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Modal, Alert, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, Users, Copy, Check } from 'lucide-react'

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

const demoAfiliados: Afiliado[] = [
    { id: '1', nombre: 'Carlos Martinez', email: 'carlos@email.com', telefono: '+1234567890', codigo_referido: 'CARLOS2024', comision_porcentaje: 10, balance_acumulado: 450.00, balance_pagado: 200.00, activo: true, nivel: 'Plata' },
    { id: '2', nombre: 'Ana Rodriguez', email: 'ana@email.com', telefono: '+0987654321', codigo_referido: 'ANA2024', comision_porcentaje: 12, balance_acumulado: 890.50, balance_pagado: 500.00, activo: true, nivel: 'Oro' },
]

const niveles = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante']

export default function AfiliadosPage() {
    const [afiliados, setAfiliados] = useState<Afiliado[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
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
            setIsDemo(true)
            setAfiliados(demoAfiliados)
            setIsLoading(false)
            return
        }
        try {
            const data = await getAfiliados()
            if (data.length > 0) { setAfiliados(data as Afiliado[]) }
            else { setIsDemo(true); setAfiliados(demoAfiliados) }
        } catch { setIsDemo(true); setAfiliados(demoAfiliados) }
        finally { setIsLoading(false) }
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
            if (isDemo) {
                if (editingAfiliado) {
                    setAfiliados(prev => prev.map(a => a.id === editingAfiliado.id ? { ...a, ...dataToSave } : a))
                } else {
                    setAfiliados(prev => [...prev, { ...dataToSave, id: `temp-${Date.now()}`, balance_acumulado: 0, balance_pagado: 0 } as Afiliado])
                }
                setIsModalOpen(false)
                return
            }

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
        if (isDemo) { setAfiliados(prev => prev.filter(a => a.id !== id)); return }
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">{a.nombre.charAt(0)}</div>
                    <div><p className="font-medium text-white">{a.nombre}</p><p className="text-xs text-gray-500">{a.email}</p></div>
                </div>
            )
        },
        {
            key: 'codigo_referido', header: 'Código', render: (a: Afiliado) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400">{a.codigo_referido}</span>
                    <button onClick={() => copyLink(a.codigo_referido, a.id)} className="btn btn-ghost btn-sm btn-icon">
                        {copiedId === a.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            )
        },
        { key: 'nivel', header: 'Nivel', render: (a: Afiliado) => <Badge variant="primary">{a.nivel}</Badge> },
        { key: 'comision_porcentaje', header: 'Comisión', render: (a: Afiliado) => <span className="text-emerald-400 font-semibold">{a.comision_porcentaje}%</span> },
        { key: 'balance', header: 'Balance', render: (a: Afiliado) => <span className="text-cyan-400 font-semibold">${(a.balance_acumulado - a.balance_pagado).toFixed(2)}</span> },
        { key: 'activo', header: 'Estado', render: (a: Afiliado) => <Badge variant={a.activo ? 'success' : 'danger'}>{a.activo ? 'Activo' : 'Inactivo'}</Badge> },
        {
            key: 'actions', header: '', render: (a: Afiliado) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(a)} className="btn btn-ghost btn-sm btn-icon"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(a.id)} className="btn btn-ghost btn-sm btn-icon text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        },
    ]

    return (
        <div className="animate-fade-in">
            <div className="header">
                <div><h1 className="header-title">Afiliados</h1><p className="header-subtitle">Gestiona tu red de referidos</p></div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus className="w-4 h-4" />Nuevo Afiliado</button>
            </div>

            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center"><Users className="w-6 h-6 text-indigo-400" /></div>
                    <div><p className="text-2xl font-bold text-white">{afiliados.filter(a => a.activo).length}</p><p className="text-sm text-gray-400">Afiliados activos</p></div>
                </div>
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Users className="w-6 h-6 text-emerald-400" /></div>
                    <div><p className="text-2xl font-bold text-white">${afiliados.reduce((a, af) => a + af.balance_acumulado, 0).toFixed(2)}</p><p className="text-sm text-gray-400">Total generado</p></div>
                </div>
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><Users className="w-6 h-6 text-amber-400" /></div>
                    <div><p className="text-2xl font-bold text-white">${afiliados.reduce((a, af) => a + (af.balance_acumulado - af.balance_pagado), 0).toFixed(2)}</p><p className="text-sm text-gray-400">Por pagar</p></div>
                </div>
            </div>

            <div className="card-glass p-6">
                <DataTable data={afiliados} columns={columns} searchKeys={['nombre', 'email', 'codigo_referido']} isLoading={isLoading} emptyMessage="No hay afiliados" />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAfiliado ? 'Editar Afiliado' : 'Nuevo Afiliado'}
                footer={<><button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button><button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">{isSaving ? 'Guardando...' : 'Guardar'}</button></>}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && <Alert type="danger" message={formError} />}
                    <div><label className="label">Nombre *</label><input type="text" value={formData.nombre} onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))} className="input" required /></div>
                    <div><label className="label">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="input" required /></div>
                    <div><label className="label">Teléfono</label><input type="tel" value={formData.telefono} onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))} className="input" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label">Nivel</label><select value={formData.nivel} onChange={(e) => setFormData(p => ({ ...p, nivel: e.target.value }))} className="input select">{niveles.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                        <div><label className="label">Comisión %</label><input type="number" value={formData.comision_porcentaje} onChange={(e) => setFormData(p => ({ ...p, comision_porcentaje: parseFloat(e.target.value) || 0 }))} className="input" min="0" max="50" /></div>
                    </div>
                    <div><label className="label">Código (auto-generado si vacío)</label><input type="text" value={formData.codigo_referido} onChange={(e) => setFormData(p => ({ ...p, codigo_referido: e.target.value.toUpperCase() }))} className="input" placeholder="Ej: CARLOS2024" /></div>
                </form>
            </Modal>
        </div>
    )
}
