'use client'

import { useEffect, useState } from 'react'
import { getClientesB2B, create, update, remove, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Badge, Modal, Alert } from '@/components/ui'
import { formatPrice } from '@/lib/currency'
import { Plus, Pencil, Trash2, Building2, DollarSign, Briefcase, MapPin, Mail, Phone, CreditCard } from 'lucide-react'

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



export default function ClientesB2BPage() {
    const [clientes, setClientes] = useState<ClienteB2B[]>([])
    const [isLoading, setIsLoading] = useState(true)

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
        if (!isFirebaseConfigured()) { setIsLoading(false); return }
        try {
            const data = await getClientesB2B()
            setClientes(data as ClienteB2B[])
        } catch (error) { console.error(error) }
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

            if (editingCliente) { await update(COLLECTIONS.CLIENTES_B2B, editingCliente.id, formData) }
            else { await create(COLLECTIONS.CLIENTES_B2B, { ...formData, saldo_pendiente: 0 }) }
            await loadClientes(); setIsModalOpen(false)
        } catch (error) { setFormError(error instanceof Error ? error.message : 'Error') }
        finally { setIsSaving(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar cliente?')) return

        await remove(COLLECTIONS.CLIENTES_B2B, id)
        await loadClientes()
    }

    const columns = [
        {
            key: 'razon_social', header: 'Empresa', sortable: true, render: (c: ClienteB2B) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Building2 size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="font-medium text-white">{c.razon_social}</p>
                        <p className="text-xs text-gray-500 font-mono tracking-wide">{c.ruc || 'S/N'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'contacto_nombre', header: 'Contacto Principal', render: (c: ClienteB2B) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                        <Briefcase size={12} className="text-gray-500" /> {c.contacto_nombre || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={10} /> {c.contacto_email}
                    </div>
                </div>
            )
        },
        {
            key: 'linea_credito',
            header: 'Línea de Crédito',
            render: (c: ClienteB2B) => (
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono">
                    <CreditCard size={14} />
                    ${c.linea_credito.toFixed(2)}
                </div>
            )
        },
        {
            key: 'saldo_pendiente',
            header: 'Saldo Pendiente',
            render: (c: ClienteB2B) => {
                const ratio = c.linea_credito > 0 ? (c.saldo_pendiente / c.linea_credito) * 100 : 0;
                let colorClass = 'text-emerald-400';
                if (ratio > 50) colorClass = 'text-amber-400';
                if (ratio > 80) colorClass = 'text-red-400';

                return (
                    <div>
                        <span className={`font-semibold ${colorClass}`}>${c.saldo_pendiente.toFixed(2)}</span>
                        <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${ratio > 80 ? 'bg-red-500' : ratio > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(ratio, 100)}%` }}></div>
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (c: ClienteB2B) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Habilitado' : 'Suspendido'}</Badge>
        },
        {
            key: 'actions', header: '', render: (c: ClienteB2B) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(c)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        },
    ]

    return (
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Building2 className="text-[var(--neon-cyan)] w-8 h-8" />
                        Directorio Corporativo B2B
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión de cuentas mayoristas y líneas de crédito</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Plus size={18} />
                    <span>NUEVA EMPRESA</span>
                </button>
            </header>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Briefcase className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{clientes.length}</p>
                        <p className="text-xs text-indigo-300 uppercase tracking-wider font-bold">Empresas Activas</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <CreditCard className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{formatPrice(clientes.reduce((a, c) => a + c.linea_credito, 0))}</p>
                        <p className="text-xs text-cyan-300 uppercase tracking-wider font-bold">Línea Total</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <DollarSign className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">{formatPrice(clientes.reduce((a, c) => a + c.saldo_pendiente, 0))}</p>
                        <p className="text-xs text-amber-400 uppercase tracking-wider font-bold">Cartera x Cobrar</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <DataTable
                    data={clientes}
                    columns={columns}
                    searchKeys={['razon_social', 'ruc', 'contacto_nombre']}
                    isLoading={isLoading}
                    emptyMessage="No hay clientes corporativos registrados."
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCliente ? 'Actualizar Ficha de Cliente' : 'Registrar Nueva Empresa'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6 text-gray-200">
                    {formError && <Alert type="danger" message={formError} />}

                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Building2 size={14} /> Datos Fiscales
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 mb-1 block">Razón Social *</label>
                                <input
                                    type="text"
                                    value={formData.razon_social}
                                    onChange={(e) => setFormData(p => ({ ...p, razon_social: e.target.value }))}
                                    className="input-cyber w-full font-bold text-lg"
                                    required
                                    placeholder="Ej: CORPORACION XYZ S.A.C."
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">RUC / ID Fiscal</label>
                                <input
                                    type="text"
                                    value={formData.ruc}
                                    onChange={(e) => setFormData(p => ({ ...p, ruc: e.target.value }))}
                                    className="input-cyber w-full font-mono"
                                    placeholder="2060..."
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Dirección Fiscal</label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData(p => ({ ...p, direccion: e.target.value }))}
                                        className="input-cyber w-full pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <Briefcase size={14} /> Contacto
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Nombre Contacto</label>
                                    <input type="text" value={formData.contacto_nombre} onChange={(e) => setFormData(p => ({ ...p, contacto_nombre: e.target.value }))} className="input-cyber w-full" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                                    <input type="email" value={formData.contacto_email} onChange={(e) => setFormData(p => ({ ...p, contacto_email: e.target.value }))} className="input-cyber w-full" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Teléfono</label>
                                    <input type="tel" value={formData.contacto_telefono} onChange={(e) => setFormData(p => ({ ...p, contacto_telefono: e.target.value }))} className="input-cyber w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-cyan-900/10 p-6 rounded-xl border border-cyan-500/20 space-y-4">
                            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <DollarSign size={14} /> Crédito
                            </h4>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Línea de Crédito Aprobada ($)</label>
                                <input
                                    type="number"
                                    value={formData.linea_credito}
                                    onChange={(e) => setFormData(p => ({ ...p, linea_credito: parseFloat(e.target.value) || 0 }))}
                                    className="input-cyber w-full text-2xl font-mono text-cyan-400 font-bold bg-black/40 border-cyan-500/30"
                                    min="0"
                                    step="100"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                                <input
                                    type="checkbox"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData(p => ({ ...p, activo: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                    id="activoCheck"
                                />
                                <label htmlFor="activoCheck" className="text-sm text-gray-300">Cliente Activo</label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="btn-cyber-primary px-6 py-2 rounded-lg">
                            {isSaving ? 'Procesando...' : 'Guardar Empresa'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
