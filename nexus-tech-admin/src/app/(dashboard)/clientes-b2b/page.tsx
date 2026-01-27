'use client'

import { useEffect, useState } from 'react'
import { getClientesB2B, create, update, remove, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Badge, Modal, Alert } from '@/components/ui'
import { Plus, Pencil, Trash2, Building2, DollarSign } from 'lucide-react'

interface ClienteB2B {
    id: string
    razon_social: string
    ruc: string | null
    contacto_nombre: string | null
    contacto_email: string | null
    contacto_telefono: string | null
    direccion: string | null
    linea_credito: number
    saldo_pendiente: number
    activo: boolean
}

const demoClientes: ClienteB2B[] = [
    { id: '1', razon_social: 'TechStore S.A.', ruc: '20123456789', contacto_nombre: 'Juan Pérez', contacto_email: 'juan@techstore.com', contacto_telefono: '+123456789', direccion: 'Av. Principal 123', linea_credito: 5000, saldo_pendiente: 1200, activo: true },
    { id: '2', razon_social: 'Gadgets Plus', ruc: '20987654321', contacto_nombre: 'María López', contacto_email: 'maria@gadgets.com', contacto_telefono: '+987654321', direccion: 'Calle Comercio 456', linea_credito: 10000, saldo_pendiente: 0, activo: true },
]

export default function ClientesB2BPage() {
    const [clientes, setClientes] = useState<ClienteB2B[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCliente, setEditingCliente] = useState<ClienteB2B | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        razon_social: '', ruc: '', contacto_nombre: '', contacto_email: '',
        contacto_telefono: '', direccion: '', linea_credito: 0, activo: true
    })

    useEffect(() => { loadClientes() }, [])

    const loadClientes = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) { setIsDemo(true); setClientes(demoClientes); setIsLoading(false); return }
        try {
            const data = await getClientesB2B()
            if (data.length > 0) { setClientes(data as ClienteB2B[]) }
            else { setIsDemo(true); setClientes(demoClientes) }
        } catch { setIsDemo(true); setClientes(demoClientes) }
        finally { setIsLoading(false) }
    }

    const openModal = (cliente?: ClienteB2B) => {
        if (cliente) {
            setEditingCliente(cliente)
            setFormData({
                razon_social: cliente.razon_social, ruc: cliente.ruc || '', contacto_nombre: cliente.contacto_nombre || '',
                contacto_email: cliente.contacto_email || '', contacto_telefono: cliente.contacto_telefono || '',
                direccion: cliente.direccion || '', linea_credito: cliente.linea_credito, activo: cliente.activo
            })
        } else {
            setEditingCliente(null)
            setFormData({
                razon_social: '', ruc: '', contacto_nombre: '', contacto_email: '',
                contacto_telefono: '', direccion: '', linea_credito: 0, activo: true
            })
        }
        setFormError(null); setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setFormError(null); setIsSaving(true)
        try {
            if (isDemo) {
                if (editingCliente) { setClientes(prev => prev.map(c => c.id === editingCliente.id ? { ...c, ...formData } as ClienteB2B : c)) }
                else { setClientes(prev => [...prev, { ...formData, id: `temp-${Date.now()}`, saldo_pendiente: 0 } as ClienteB2B]) }
                setIsModalOpen(false); return
            }
            if (editingCliente) { await update(COLLECTIONS.CLIENTES_B2B, editingCliente.id, formData) }
            else { await create(COLLECTIONS.CLIENTES_B2B, { ...formData, saldo_pendiente: 0 }) }
            await loadClientes(); setIsModalOpen(false)
        } catch (error) { setFormError(error instanceof Error ? error.message : 'Error') }
        finally { setIsSaving(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar cliente?')) return
        if (isDemo) { setClientes(prev => prev.filter(c => c.id !== id)); return }
        await remove(COLLECTIONS.CLIENTES_B2B, id)
        await loadClientes()
    }

    const columns = [
        {
            key: 'razon_social', header: 'Empresa', sortable: true, render: (c: ClienteB2B) => (
                <div><p className="font-medium text-white">{c.razon_social}</p><p className="text-xs text-gray-500">RUC: {c.ruc || 'N/A'}</p></div>
            )
        },
        {
            key: 'contacto_nombre', header: 'Contacto', render: (c: ClienteB2B) => (
                <div><p className="text-white">{c.contacto_nombre || '-'}</p><p className="text-xs text-gray-500">{c.contacto_email}</p></div>
            )
        },
        { key: 'linea_credito', header: 'Línea Crédito', render: (c: ClienteB2B) => <span className="text-cyan-400 font-semibold">${c.linea_credito.toFixed(2)}</span> },
        { key: 'saldo_pendiente', header: 'Saldo Pendiente', render: (c: ClienteB2B) => <span className={`font-semibold ${c.saldo_pendiente > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>${c.saldo_pendiente.toFixed(2)}</span> },
        { key: 'activo', header: 'Estado', render: (c: ClienteB2B) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge> },
        {
            key: 'actions', header: '', render: (c: ClienteB2B) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(c)} className="btn btn-ghost btn-sm btn-icon"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm btn-icon text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        },
    ]

    return (
        <div className="animate-fade-in">
            <div className="header">
                <div><h1 className="header-title">Clientes B2B</h1><p className="header-subtitle">Gestiona clientes mayoristas</p></div>
                <button onClick={() => openModal()} className="btn btn-primary"><Plus className="w-4 h-4" />Nuevo Cliente</button>
            </div>
            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-indigo-400" /></div>
                    <div><p className="text-2xl font-bold text-white">{clientes.length}</p><p className="text-sm text-gray-400">Clientes</p></div>
                </div>
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"><DollarSign className="w-6 h-6 text-cyan-400" /></div>
                    <div><p className="text-2xl font-bold text-white">${clientes.reduce((a, c) => a + c.linea_credito, 0).toFixed(2)}</p><p className="text-sm text-gray-400">Línea total</p></div>
                </div>
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><DollarSign className="w-6 h-6 text-amber-400" /></div>
                    <div><p className="text-2xl font-bold text-white">${clientes.reduce((a, c) => a + c.saldo_pendiente, 0).toFixed(2)}</p><p className="text-sm text-gray-400">Por cobrar</p></div>
                </div>
            </div>
            <div className="card-glass p-6">
                <DataTable data={clientes} columns={columns} searchKeys={['razon_social', 'ruc', 'contacto_nombre']} isLoading={isLoading} emptyMessage="No hay clientes B2B" />
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'} footer={<><button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button><button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">{isSaving ? 'Guardando...' : 'Guardar'}</button></>}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && <Alert type="danger" message={formError} />}
                    <div><label className="label">Razón Social *</label><input type="text" value={formData.razon_social} onChange={(e) => setFormData(p => ({ ...p, razon_social: e.target.value }))} className="input" required /></div>
                    <div><label className="label">RUC</label><input type="text" value={formData.ruc} onChange={(e) => setFormData(p => ({ ...p, ruc: e.target.value }))} className="input" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label">Contacto</label><input type="text" value={formData.contacto_nombre} onChange={(e) => setFormData(p => ({ ...p, contacto_nombre: e.target.value }))} className="input" /></div>
                        <div><label className="label">Email</label><input type="email" value={formData.contacto_email} onChange={(e) => setFormData(p => ({ ...p, contacto_email: e.target.value }))} className="input" /></div>
                    </div>
                    <div><label className="label">Teléfono</label><input type="tel" value={formData.contacto_telefono} onChange={(e) => setFormData(p => ({ ...p, contacto_telefono: e.target.value }))} className="input" /></div>
                    <div><label className="label">Dirección</label><input type="text" value={formData.direccion} onChange={(e) => setFormData(p => ({ ...p, direccion: e.target.value }))} className="input" /></div>
                    <div><label className="label">Línea de Crédito</label><input type="number" value={formData.linea_credito} onChange={(e) => setFormData(p => ({ ...p, linea_credito: parseFloat(e.target.value) || 0 }))} className="input" min="0" step="0.01" /></div>
                </form>
            </Modal>
        </div>
    )
}
