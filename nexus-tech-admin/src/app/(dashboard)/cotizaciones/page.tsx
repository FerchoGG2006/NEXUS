'use client'

import { useEffect, useState } from 'react'
import { getProductosActivos, getClientesB2B, isFirebaseConfigured } from '@/lib/firebase'
import { Alert, Badge } from '@/components/ui'
import { Plus, Trash2, FileText, Download, Building2 } from 'lucide-react'
import { jsPDF } from 'jspdf'

interface Producto { id: string; sku: string; nombre: string; precio_b2b: number }
interface ClienteB2B { id: string; razon_social: string; ruc: string | null; contacto_nombre: string | null; contacto_email: string | null }
interface ItemCotizacion { producto_id: string; sku: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }

const demoProductos: Producto[] = [
    { id: '1', sku: 'ACC-001', nombre: 'Audífonos Bluetooth Pro', precio_b2b: 45 },
    { id: '2', sku: 'ACC-002', nombre: 'Cargador Inalámbrico 15W', precio_b2b: 18 },
    { id: '3', sku: 'ACC-005', nombre: 'Power Bank 10000mAh', precio_b2b: 30 },
]

const demoClientes: ClienteB2B[] = [
    { id: '1', razon_social: 'TechStore S.A.', ruc: '20123456789', contacto_nombre: 'Juan Pérez', contacto_email: 'juan@techstore.com' },
]

export default function CotizacionesPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [clientes, setClientes] = useState<ClienteB2B[]>([])
    const [isDemo, setIsDemo] = useState(false)
    const [items, setItems] = useState<ItemCotizacion[]>([])
    const [clienteId, setClienteId] = useState('')
    const [descuento, setDescuento] = useState(0)
    const [notas, setNotas] = useState('')
    const [validezDias, setValidezDias] = useState(15)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        if (!isFirebaseConfigured()) { setIsDemo(true); setProductos(demoProductos); setClientes(demoClientes); return }
        try {
            const [prodData, cliData] = await Promise.all([getProductosActivos(), getClientesB2B()])
            if (prodData.length > 0) { setProductos(prodData as Producto[]); setClientes(cliData as ClienteB2B[]) }
            else { setIsDemo(true); setProductos(demoProductos); setClientes(demoClientes) }
        } catch { setIsDemo(true); setProductos(demoProductos); setClientes(demoClientes) }
    }

    const addItem = (productoId: string) => {
        const producto = productos.find(p => p.id === productoId)
        if (!producto || items.find(i => i.producto_id === productoId)) return
        setItems(prev => [...prev, { producto_id: producto.id, sku: producto.sku, nombre: producto.nombre, cantidad: 1, precio_unitario: producto.precio_b2b, subtotal: producto.precio_b2b }])
    }

    const updateCantidad = (id: string, cantidad: number) => {
        setItems(prev => prev.map(item => item.producto_id === id ? { ...item, cantidad, subtotal: item.precio_unitario * cantidad } : item))
    }

    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.producto_id !== id))

    const subtotal = items.reduce((a, i) => a + i.subtotal, 0)
    const total = subtotal - descuento
    const cliente = clientes.find(c => c.id === clienteId)

    const generarPDF = () => {
        if (!cliente || items.length === 0) { alert('Selecciona un cliente y añade productos'); return }

        const doc = new jsPDF()
        const fecha = new Date().toLocaleDateString('es-ES')
        const numeroCot = `COT-${Date.now().toString().slice(-8)}`

        doc.setFillColor(79, 70, 229)
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('NEXUS TECH-ADMIN', 20, 25)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Cotización Comercial B2B', 20, 33)

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.text(`Cotización: ${numeroCot}`, 140, 55)
        doc.text(`Fecha: ${fecha}`, 140, 62)
        doc.text(`Válida por: ${validezDias} días`, 140, 69)

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Cliente:', 20, 55)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text(cliente.razon_social, 20, 62)
        doc.text(`RUC: ${cliente.ruc || 'N/A'}`, 20, 69)
        doc.text(`Contacto: ${cliente.contacto_nombre || '-'}`, 20, 76)
        doc.text(`Email: ${cliente.contacto_email || '-'}`, 20, 83)

        let y = 100
        doc.setFillColor(243, 244, 246)
        doc.rect(20, y, 170, 10, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('SKU', 25, y + 7)
        doc.text('Producto', 50, y + 7)
        doc.text('Cant.', 120, y + 7)
        doc.text('P. Unit.', 140, y + 7)
        doc.text('Subtotal', 165, y + 7)

        doc.setFont('helvetica', 'normal')
        y += 15
        items.forEach(item => {
            doc.text(item.sku, 25, y)
            doc.text(item.nombre.substring(0, 25), 50, y)
            doc.text(String(item.cantidad), 125, y)
            doc.text(`$${item.precio_unitario.toFixed(2)}`, 140, y)
            doc.text(`$${item.subtotal.toFixed(2)}`, 165, y)
            y += 8
        })

        y += 10
        doc.line(20, y, 190, y)
        y += 10
        doc.text(`Subtotal:`, 130, y)
        doc.text(`$${subtotal.toFixed(2)}`, 165, y)
        if (descuento > 0) { y += 7; doc.text(`Descuento:`, 130, y); doc.text(`-$${descuento.toFixed(2)}`, 165, y) }
        y += 10
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text(`TOTAL:`, 130, y)
        doc.text(`$${total.toFixed(2)}`, 165, y)

        if (notas) { y += 20; doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Notas:', 20, y); doc.setFont('helvetica', 'normal'); y += 7; doc.text(notas, 20, y, { maxWidth: 170 }) }

        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text('Esta cotización tiene validez por ' + validezDias + ' días desde la fecha de emisión.', 20, 280)
        doc.text('Precios no incluyen impuestos. Sujeto a disponibilidad de stock.', 20, 285)

        doc.save(`${numeroCot}-${cliente.razon_social}.pdf`)
    }

    return (
        <div className="animate-fade-in">
            <div className="header">
                <div><h1 className="header-title">Cotizaciones B2B</h1><p className="header-subtitle">Genera cotizaciones profesionales</p></div>
            </div>
            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-glass p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" />Cliente</h2>
                        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input select w-full">
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                        </select>
                        {cliente && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                                <p className="text-white font-medium">{cliente.razon_social}</p>
                                <p className="text-sm text-gray-400">RUC: {cliente.ruc} • {cliente.contacto_email}</p>
                            </div>
                        )}
                    </div>

                    <div className="card-glass p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5" />Productos</h2>
                        <div className="flex gap-2 mb-4">
                            <select id="producto-select" className="input select flex-1" defaultValue=""><option value="">Añadir producto...</option>{productos.filter(p => !items.find(i => i.producto_id === p.id)).map(p => <option key={p.id} value={p.id}>{p.nombre} - ${p.precio_b2b}</option>)}</select>
                            <button onClick={() => { const sel = document.getElementById('producto-select') as HTMLSelectElement; if (sel.value) { addItem(sel.value); sel.value = '' } }} className="btn btn-primary"><Plus className="w-4 h-4" /></button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Añade productos a la cotización</div>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.producto_id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{item.nombre}</p>
                                            <p className="text-sm text-gray-400">SKU: {item.sku} • ${item.precio_unitario}/u</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input type="number" value={item.cantidad} onChange={(e) => updateCantidad(item.producto_id, parseInt(e.target.value) || 1)} className="input w-20 text-center" min="1" />
                                            <span className="text-emerald-400 font-semibold w-24 text-right">${item.subtotal.toFixed(2)}</span>
                                            <button onClick={() => removeItem(item.producto_id)} className="btn btn-ghost btn-sm btn-icon text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card-glass p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Condiciones</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Descuento ($)</label><input type="number" value={descuento} onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)} className="input" min="0" step="0.01" /></div>
                            <div><label className="label">Validez (días)</label><input type="number" value={validezDias} onChange={(e) => setValidezDias(parseInt(e.target.value) || 15)} className="input" min="1" /></div>
                        </div>
                        <div className="mt-4"><label className="label">Notas</label><textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="input min-h-[80px]" placeholder="Condiciones adicionales..." /></div>
                    </div>
                </div>

                <div className="card-glass p-6 h-fit sticky top-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Resumen</h2>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between"><span className="text-gray-400">Items:</span><span>{items.length} productos</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                        {descuento > 0 && <div className="flex justify-between"><span className="text-gray-400">Descuento:</span><span className="text-amber-400">-${descuento.toFixed(2)}</span></div>}
                        <hr className="border-gray-700" />
                        <div className="flex justify-between font-bold text-lg"><span>Total:</span><span className="text-emerald-400">${total.toFixed(2)}</span></div>
                    </div>
                    <button onClick={generarPDF} disabled={!cliente || items.length === 0} className="btn btn-primary w-full btn-lg disabled:opacity-50">
                        <Download className="w-5 h-5" />Generar PDF
                    </button>
                    {(!cliente || items.length === 0) && <p className="text-xs text-gray-500 text-center mt-2">Selecciona cliente y añade productos</p>}
                </div>
            </div>
        </div>
    )
}
