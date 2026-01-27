'use client'

import { useEffect, useState } from 'react'
import { getVentas, getProductosActivos, getAfiliados, create, generarNumeroVenta, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Badge, Modal, Alert } from '@/components/ui'
import { Plus, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
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
            if (ventasData.length > 0) { setVentas(ventasData as Venta[]); setProductos(productosData as Producto[]); setAfiliados(afiliadosData as Afiliado[]) }
            else { setIsDemo(true); setVentas(demoVentas); setProductos(demoProductos) }
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
        { key: 'numero_venta', header: '# Venta', render: (v: Venta) => <span className="font-mono text-indigo-400">{v.numero_venta}</span> },
        { key: 'tipo_venta', header: 'Tipo', render: (v: Venta) => <Badge variant={v.tipo_venta === 'Retail' ? 'info' : v.tipo_venta === 'B2B' ? 'success' : 'warning'}>{v.tipo_venta}</Badge> },
        { key: 'cantidad', header: 'Cant.', className: 'text-center' },
        { key: 'total_venta', header: 'Total', render: (v: Venta) => <span className="font-semibold">${v.total_venta.toFixed(2)}</span> },
        { key: 'ganancia_neta', header: 'Ganancia', render: (v: Venta) => <span className="text-emerald-400 font-semibold">${v.ganancia_neta.toFixed(2)}</span> },
        { key: 'fecha', header: 'Fecha', render: (v: Venta) => format(new Date(v.fecha), "dd/MM/yy HH:mm", { locale: es }) },
        { key: 'estado', header: 'Estado', render: (v: Venta) => <Badge variant={v.estado === 'Completada' ? 'success' : 'warning'}>{v.estado}</Badge> },
    ]

    return (
        <div className="animate-fade-in">
            <div className="header">
                <div><h1 className="header-title">Ventas</h1><p className="header-subtitle">Registro de transacciones</p></div>
                <button onClick={() => { setFormData({ producto_id: '', tipo_venta: 'Retail', cantidad: 1, afiliado_id: '', descuento: 0, notas: '' }); setIsModalOpen(true) }} className="btn btn-primary"><Plus className="w-4 h-4" />Nueva Venta</button>
            </div>
            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-indigo-400" /></div>
                    <div><p className="text-2xl font-bold text-white">{ventas.length}</p><p className="text-sm text-gray-400">Transacciones</p></div>
                </div>
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"><DollarSign className="w-6 h-6 text-cyan-400" /></div>
                    <div><p className="text-2xl font-bold text-white">${totalVentas.toFixed(2)}</p><p className="text-sm text-gray-400">Total ventas</p></div>
                </div>
                <div className="card-glass p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
                    <div><p className="text-2xl font-bold text-white">${totalGanancia.toFixed(2)}</p><p className="text-sm text-gray-400">Ganancia neta</p></div>
                </div>
            </div>
            <div className="card-glass p-6">
                <DataTable data={ventas} columns={columns} searchKeys={['numero_venta']} isLoading={isLoading} emptyMessage="No hay ventas" />
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Venta" size="lg" footer={<><button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button><button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">{isSaving ? 'Procesando...' : 'Registrar Venta'}</button></>}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && <Alert type="danger" message={formError} />}
                    <div><label className="label">Producto *</label><select value={formData.producto_id} onChange={(e) => setFormData(p => ({ ...p, producto_id: e.target.value }))} className="input select" required><option value="">Seleccionar...</option>{productos.map(p => <option key={p.id} value={p.id}>{p.nombre} - ${p.precio_retail}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label">Tipo de Venta *</label><select value={formData.tipo_venta} onChange={(e) => setFormData(p => ({ ...p, tipo_venta: e.target.value as 'Retail' | 'B2B' | 'Afiliado' }))} className="input select"><option value="Retail">Retail</option><option value="B2B">B2B</option><option value="Afiliado">Afiliado</option></select></div>
                        <div><label className="label">Cantidad *</label><input type="number" value={formData.cantidad} onChange={(e) => setFormData(p => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))} className="input" min="1" required /></div>
                    </div>
                    {formData.tipo_venta === 'Afiliado' && <div><label className="label">Afiliado *</label><select value={formData.afiliado_id} onChange={(e) => setFormData(p => ({ ...p, afiliado_id: e.target.value }))} className="input select" required><option value="">Seleccionar...</option>{afiliados.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.comision_porcentaje}%)</option>)}</select></div>}
                    <div><label className="label">Descuento ($)</label><input type="number" value={formData.descuento} onChange={(e) => setFormData(p => ({ ...p, descuento: parseFloat(e.target.value) || 0 }))} className="input" min="0" step="0.01" /></div>
                    <div className="p-4 bg-gray-800 rounded-lg space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span><span>${calc.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Descuento:</span><span>-${formData.descuento.toFixed(2)}</span></div>
                        <div className="flex justify-between font-semibold"><span>Total:</span><span>${calc.total.toFixed(2)}</span></div>
                        <hr className="border-gray-700" />
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Costo:</span><span className="text-gray-500">-${calc.costo.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Comisión:</span><span className="text-gray-500">-${calc.comision.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Gastos op. (5%):</span><span className="text-gray-500">-${calc.gastos.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-emerald-400 pt-2"><span>Ganancia Neta:</span><span>${calc.ganancia.toFixed(2)}</span></div>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
