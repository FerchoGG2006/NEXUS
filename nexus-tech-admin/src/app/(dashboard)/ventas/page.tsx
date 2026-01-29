'use client'

import { useEffect, useState } from 'react'
import { getVentas, getProductosActivos, getAfiliados, create, generarNumeroVenta, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Badge, Modal, Alert } from '@/components/ui'
import { Plus, ShoppingCart, DollarSign, TrendingUp, Calendar, User, Tag, Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Venta {
    id: string
    numero_venta: string
    producto_id: string
    afiliado_id: string | null
    tipo_venta: 'Retail' | 'B2B' | 'Afiliado'
    cantidad: number
    precio_unitario: number
    subtotal: number
    descuento: number
    total_venta: number
    costo_total: number
    comision_afiliado: number
    gastos_operativos: number
    ganancia_neta: number
    estado: string
    fecha: string
}

interface Producto { id: string; nombre: string; precio_retail: number; precio_b2b: number; costo_compra: number }
interface Afiliado { id: string; nombre: string; comision_porcentaje: number }

const demoVentas: Venta[] = [
    { id: '1', numero_venta: 'NTX-20260126-00001', producto_id: '1', afiliado_id: null, tipo_venta: 'Retail', cantidad: 2, precio_unitario: 59.99, subtotal: 119.98, descuento: 0, total_venta: 119.98, costo_total: 50, comision_afiliado: 0, gastos_operativos: 6, ganancia_neta: 63.98, estado: 'Completada', fecha: new Date().toISOString() },
    { id: '2', numero_venta: 'NTX-20260126-00002', producto_id: '2', afiliado_id: '1', tipo_venta: 'Afiliado', cantidad: 5, precio_unitario: 24.99, subtotal: 124.95, descuento: 0, total_venta: 124.95, costo_total: 40, comision_afiliado: 12.50, gastos_operativos: 6.25, ganancia_neta: 66.20, estado: 'Completada', fecha: new Date().toISOString() },
]

const demoProductos: Producto[] = [
    { id: '1', nombre: 'Audífonos Bluetooth Pro', precio_retail: 59.99, precio_b2b: 45, costo_compra: 25 },
    { id: '2', nombre: 'Cargador Inalámbrico', precio_retail: 24.99, precio_b2b: 18, costo_compra: 8 },
]

export default function VentasPage() {
    const [ventas, setVentas] = useState<Venta[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [afiliados, setAfiliados] = useState<Afiliado[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        producto_id: '', tipo_venta: 'Retail' as 'Retail' | 'B2B' | 'Afiliado',
        cantidad: 1, afiliado_id: '', descuento: 0, notas: ''
    })

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) {
            setIsDemo(true); setVentas(demoVentas); setProductos(demoProductos)
            setIsLoading(false); return
        }
        try {
            const [ventasData, productosData, afiliadosData] = await Promise.all([
                getVentas(100), getProductosActivos(), getAfiliados()
            ])
            if (ventasData.length > 0 || productosData.length > 0) {
                setVentas(ventasData as Venta[])
                setProductos(productosData as Producto[])
                setAfiliados(afiliadosData as Afiliado[])
            } else {
                // Fallback to demo if empty
                setIsDemo(true); setVentas(demoVentas); setProductos(demoProductos)
            }
        } catch { setIsDemo(true); setVentas(demoVentas); setProductos(demoProductos) }
        finally { setIsLoading(false) }
    }

    const calcularVenta = () => {
        const producto = productos.find(p => p.id === formData.producto_id)
        if (!producto) return { subtotal: 0, total: 0, costo: 0, comision: 0, gastos: 0, ganancia: 0 }
        const precio = formData.tipo_venta === 'B2B' ? producto.precio_b2b : producto.precio_retail
        const subtotal = precio * formData.cantidad
        const total = subtotal - formData.descuento
        const costo = producto.costo_compra * formData.cantidad
        const afiliado = afiliados.find(a => a.id === formData.afiliado_id)
        const comision = formData.tipo_venta === 'Afiliado' && afiliado ? total * (afiliado.comision_porcentaje / 100) : 0
        const gastos = total * 0.05
        const ganancia = total - costo - comision - gastos
        return { subtotal, total, costo, comision, gastos, ganancia }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setFormError(null); setIsSaving(true)
        const calc = calcularVenta()
        const producto = productos.find(p => p.id === formData.producto_id)
        if (!producto) { setFormError('Selecciona un producto'); setIsSaving(false); return }

        const venta = {
            numero_venta: generarNumeroVenta(), producto_id: formData.producto_id, tipo_venta: formData.tipo_venta, cantidad: formData.cantidad,
            precio_unitario: formData.tipo_venta === 'B2B' ? producto.precio_b2b : producto.precio_retail,
            subtotal: calc.subtotal, descuento: formData.descuento, total_venta: calc.total,
            costo_total: calc.costo, comision_afiliado: calc.comision, gastos_operativos: calc.gastos,
            ganancia_neta: calc.ganancia, afiliado_id: formData.afiliado_id || null, estado: 'Completada', fecha: new Date().toISOString()
        }

        try {
            if (isDemo) {
                setVentas(prev => [{ ...venta, id: `temp-${Date.now()}` } as Venta, ...prev])
                setIsModalOpen(false); return
            }
            await create(COLLECTIONS.VENTAS, venta)
            await loadData(); setIsModalOpen(false)
        } catch (error) { setFormError(error instanceof Error ? error.message : 'Error') }
        finally { setIsSaving(false) }
    }

    const calc = calcularVenta()
    const totalVentas = ventas.reduce((a, v) => a + v.total_venta, 0)
    const totalGanancia = ventas.reduce((a, v) => a + v.ganancia_neta, 0)

    const columns = [
        {
            key: 'numero_venta',
            header: '# Venta',
            render: (v: Venta) => (
                <div className="flex flex-col">
                    <span className="font-mono text-[var(--neon-cyan)] font-bold">{v.numero_venta}</span>
                    <span className="text-[10px] text-gray-500">{v.id.slice(0, 8)}</span>
                </div>
            )
        },
        {
            key: 'tipo_venta',
            header: 'Tipo',
            render: (v: Venta) => (
                <div className="flex items-center gap-2">
                    {v.tipo_venta === 'Retail' && <User size={14} className="text-blue-400" />}
                    {v.tipo_venta === 'B2B' && <Tag size={14} className="text-purple-400" />}
                    {v.tipo_venta === 'Afiliado' && <User size={14} className="text-orange-400" />}
                    <span className="text-sm text-gray-300">{v.tipo_venta}</span>
                </div>
            )
        },
        { key: 'cantidad', header: 'Cant.', className: 'text-center text-gray-300 font-mono' },
        {
            key: 'total_venta',
            header: 'Total',
            render: (v: Venta) => <span className="text-white font-bold tracking-wide">${v.total_venta.toFixed(2)}</span>
        },
        {
            key: 'ganancia_neta',
            header: 'Ganancia',
            render: (v: Venta) => (
                <span className={`font-bold ${v.ganancia_neta > 0 ? 'text-[var(--neon-green)]' : 'text-red-400'}`}>
                    ${v.ganancia_neta.toFixed(2)}
                </span>
            )
        },
        {
            key: 'fecha',
            header: 'Fecha',
            render: (v: Venta) => (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={12} />
                    {format(new Date(v.fecha), "dd MMM HH:mm", { locale: es })}
                </div>
            )
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (v: Venta) => (
                <Badge variant={v.estado === 'Completada' ? 'success' : 'warning'}>
                    {v.estado}
                </Badge>
            )
        },
    ]

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShoppingBag className="text-[var(--neon-cyan)] w-8 h-8" />
                        Transacciones
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Registro inmutable de operaciones comerciales</p>
                </div>
                <button
                    onClick={() => { setFormData({ producto_id: '', tipo_venta: 'Retail', cantidad: 1, afiliado_id: '', descuento: 0, notas: '' }); setIsModalOpen(true) }}
                    className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Plus size={18} />
                    <span>NUEVA VENTA</span>
                </button>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <AlertTriangle size={20} />
                    <span><strong>Modo Simulación.</strong> Los datos son temporales.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Ticket className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white tracking-widest">{ventas.length}</p>
                        <p className="text-xs text-indigo-300 uppercase tracking-wider font-bold">Transacciones</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <DollarSign className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white tracking-wide">${totalVentas.toFixed(2)}</p>
                        <p className="text-xs text-cyan-300 uppercase tracking-wider font-bold">Ingresos Brutos</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-emerald-400 tracking-wide">${totalGanancia.toFixed(2)}</p>
                        <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold">Ganancia Neta</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <DataTable data={ventas} columns={columns} searchKeys={['numero_venta']} isLoading={isLoading} emptyMessage="No hay registros en el blockchain de ventas." />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nueva Venta"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6 text-gray-200">
                    {formError && <Alert type="danger" message={formError} />}

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-[var(--neon-purple)] uppercase tracking-wider flex items-center gap-2">
                            <ShoppingCart size={14} /> Detalles de Venta
                        </h4>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Producto *</label>
                            <select
                                value={formData.producto_id}
                                onChange={(e) => setFormData(p => ({ ...p, producto_id: e.target.value }))}
                                className="input-cyber w-full"
                                required
                            >
                                <option value="" className="text-black">Seleccionar producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id} className="text-black">
                                        {p.nombre} - ${p.precio_retail}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Tipo de Venta *</label>
                                <select
                                    value={formData.tipo_venta}
                                    onChange={(e) => setFormData(p => ({ ...p, tipo_venta: e.target.value as 'Retail' | 'B2B' | 'Afiliado' }))}
                                    className="input-cyber w-full"
                                >
                                    <option value="Retail" className="text-black">Retail (Estándar)</option>
                                    <option value="B2B" className="text-black">B2B (Mayorista)</option>
                                    <option value="Afiliado" className="text-black">Referido (Afiliado)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Cantidad *</label>
                                <input
                                    type="number"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData(p => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))}
                                    className="input-cyber w-full"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>
                        {formData.tipo_venta === 'Afiliado' && (
                            <div className="animate-fade-in">
                                <label className="text-xs text-gray-400 mb-1 block">Afiliado Referente *</label>
                                <select
                                    value={formData.afiliado_id}
                                    onChange={(e) => setFormData(p => ({ ...p, afiliado_id: e.target.value }))}
                                    className="input-cyber w-full"
                                    required
                                >
                                    <option value="" className="text-black">Seleccionar afiliado...</option>
                                    {afiliados.map(a => (
                                        <option key={a.id} value={a.id} className="text-black">
                                            {a.nombre} (Comisión: {a.comision_porcentaje}%)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Descuento ($)</label>
                            <input
                                type="number"
                                value={formData.descuento}
                                onChange={(e) => setFormData(p => ({ ...p, descuento: parseFloat(e.target.value) || 0 }))}
                                className="input-cyber w-full"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 font-mono text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span><span>${calc.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Descuento:</span><span className="text-red-400">-${formData.descuento.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-white text-base py-2 border-t border-b border-white/10"><span>TOTAL A COBRAR:</span><span>${calc.total.toFixed(2)}</span></div>

                        <div className="pt-2 text-xs opacity-70">
                            <div className="flex justify-between"><span className="text-gray-500">Costo Producto:</span><span>-${calc.costo.toFixed(2)}</span></div>
                            {calc.comision > 0 && <div className="flex justify-between"><span className="text-gray-500">Comisión Afiliado:</span><span>-${calc.comision.toFixed(2)}</span></div>}
                            <div className="flex justify-between"><span className="text-gray-500">Gastos Op. (5%):</span><span>-${calc.gastos.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-white/5 mt-2"><span>GANANCIA NETA ESTIMADA:</span><span>${calc.ganancia.toFixed(2)}</span></div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="btn-cyber-primary px-6 py-2 rounded-lg">
                            {isSaving ? 'Procesando...' : 'Confirmar Venta'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
// Icono faltante
function ShoppingBag({ className, ...props }: any) {
    return <ShoppingCart className={className} {...props} />
}
function AlertTriangle({ size, ...props }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
}
