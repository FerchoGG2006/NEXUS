'use client'

import { useEffect, useState } from 'react'
import { getProductosActivos, getClientesB2B, isFirebaseConfigured } from '@/lib/firebase'
import { Alert } from '@/components/ui'
import { Plus, Trash2, FileText, Download, Building2, ShoppingCart, Calculator, Calendar, FilePenLine } from 'lucide-react'
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

        // Fondo y Header
        doc.setFillColor(15, 23, 42) // Slate 900
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('NEXUS TECH-ADMIN', 20, 25)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184) // Slate 400
        doc.text('Cotización Comercial B2B', 20, 33)

        // Info de Cotización
        doc.setTextColor(30, 41, 59) // Slate 800
        doc.setFontSize(10)
        doc.text('DETALLES DE COTIZACIÓN', 140, 55)
        doc.line(140, 57, 190, 57)
        doc.setFontSize(10)
        doc.text(`Nro: ${numeroCot}`, 140, 65)
        doc.text(`Fecha: ${fecha}`, 140, 72)
        doc.text(`Válidez: ${validezDias} días`, 140, 79)

        // Info Cliente
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('CLIENTE', 20, 55)
        doc.line(20, 57, 80, 57)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text(cliente.razon_social, 20, 65)
        doc.setFontSize(10)
        doc.setTextColor(71, 85, 105) // Slate 600
        doc.text(`RUC: ${cliente.ruc || 'N/A'}`, 20, 72)
        doc.text(`Att: ${cliente.contacto_nombre || '-'}`, 20, 79)
        doc.text(`Email: ${cliente.contacto_email || '-'}`, 20, 86)

        let y = 105

        // Tabla Header
        doc.setFillColor(241, 245, 249) // Slate 100
        doc.rect(20, y, 170, 10, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('SKU', 25, y + 7)
        doc.text('DESCRIPCIÓN', 50, y + 7)
        doc.text('CANT.', 120, y + 7)
        doc.text('P. UNIT.', 140, y + 7)
        doc.text('SUBTOTAL', 165, y + 7)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 65, 85) // Slate 700
        y += 18

        items.forEach((item, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(248, 250, 252)
                doc.rect(20, y - 5, 170, 10, 'F')
            }
            doc.text(item.sku, 25, y)
            doc.text(item.nombre.substring(0, 30), 50, y)
            doc.text(String(item.cantidad), 125, y)
            doc.text(`$${item.precio_unitario.toFixed(2)}`, 140, y)
            doc.text(`$${item.subtotal.toFixed(2)}`, 165, y)
            y += 10
        })

        y += 10
        doc.setDrawColor(203, 213, 225) // Slate 300
        doc.line(20, y, 190, y)
        y += 10

        // Totales
        doc.setFontSize(10)
        doc.text(`Subtotal:`, 130, y)
        doc.text(`$${subtotal.toFixed(2)}`, 175, y, { align: 'right' })

        if (descuento > 0) {
            y += 7;
            doc.setTextColor(220, 38, 38) // Red 600
            doc.text(`Descuento:`, 130, y);
            doc.text(`-$${descuento.toFixed(2)}`, 175, y, { align: 'right' })
            doc.setTextColor(51, 65, 85)
        }

        y += 10
        doc.setFillColor(15, 23, 42)
        doc.rect(125, y - 6, 65, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`TOTAL NETO:`, 130, y + 2)
        doc.text(`$${total.toFixed(2)}`, 185, y + 2, { align: 'right' })

        if (notas) {
            y += 25;
            doc.setTextColor(30, 41, 59)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Notas y Condiciones:', 20, y);
            doc.setFont('helvetica', 'normal');
            y += 7;
            doc.setTextColor(71, 85, 105)
            doc.text(notas, 20, y, { maxWidth: 170 })
        }

        // Footer
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        const footerY = 280
        doc.text('Esta cotización tiene validez por ' + validezDias + ' días desde la fecha de emisión.', 20, footerY)
        doc.text('Precios no incluyen I.G.V. Sujeto a disponibilidad de stock en almacén.', 20, footerY + 5)
        doc.text('NEXUS TECH-ADMIN - Sistema de Gestión Inteligente', 200, footerY + 5, { align: 'right' })

        doc.save(`${numeroCot}-${cliente.razon_social}.pdf`)
    }

    return (
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FileText className="text-[var(--neon-green)] w-8 h-8" />
                        Generador de Cotizaciones
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Crea documentos comerciales B2B profesionales</p>
                </div>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-blue-400"></div>
                    <span><strong>Modo Demo Activo.</strong> Utilizando datos de prueba.</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Panel Izquierdo: Configuración */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Selector de Cliente */}
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Building2 className="text-blue-400" size={20} />
                            Información del Cliente
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Seleccionar Empresa</label>
                                <select
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                    className="input-cyber w-full bg-black/50"
                                >
                                    <option value="">-- Seleccionar cliente de la cartera --</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                                </select>
                            </div>

                            {cliente && (
                                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-start gap-4 animate-fade-in shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold shrink-0">
                                        {cliente.razon_social.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white font-bold text-lg leading-tight">{cliente.razon_social}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                                            <span className="flex items-center gap-1"><span className="text-gray-500">RUC:</span> {cliente.ruc || 'N/A'}</span>
                                            <span className="flex items-center gap-1"><span className="text-gray-500">Contacto:</span> {cliente.contacto_email || 'Sin email'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selector de Productos y Tabla */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <ShoppingCart className="text-[var(--neon-green)]" size={20} />
                            Detalle de Productos
                        </h2>

                        <div className="flex gap-3 mb-6">
                            <div className="flex-1">
                                <select
                                    id="producto-select"
                                    className="input-cyber w-full"
                                    defaultValue=""
                                >
                                    <option value="">Buscar y añadir producto al listado...</option>
                                    {productos.filter(p => !items.find(i => i.producto_id === p.id)).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} — ${p.precio_b2b.toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => { const sel = document.getElementById('producto-select') as HTMLSelectElement; if (sel.value) { addItem(sel.value); sel.value = '' } }}
                                className="btn-cyber-primary px-4 rounded-lg flex items-center justify-center shrink-0"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl bg-white/5">
                                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">La lista de items está vacía.</p>
                                <p className="text-xs text-gray-600 mt-1">Selecciona productos arriba para agregarlos.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.producto_id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors gap-4">
                                        <div className="flex-1 w-full sm:w-auto text-left">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] items-center rounded border border-gray-700 font-mono">{item.sku}</span>
                                                <p className="font-medium text-white line-clamp-1">{item.nombre}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 pl-1">Precio Unitario: <span className="text-cyan-400">${item.precio_unitario.toFixed(2)}</span></p>
                                        </div>

                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end bg-gray-900/50 p-2 sm:p-0 rounded-lg sm:bg-transparent">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 sm:hidden">Cant:</span>
                                                <input
                                                    type="number"
                                                    value={item.cantidad}
                                                    onChange={(e) => updateCantidad(item.producto_id, parseInt(e.target.value) || 1)}
                                                    className="input-cyber w-16 text-center h-9 p-0"
                                                    min="1"
                                                />
                                            </div>

                                            <span className="text-emerald-400 font-bold font-mono text-lg w-28 text-right">${item.subtotal.toFixed(2)}</span>

                                            <button
                                                onClick={() => removeItem(item.producto_id)}
                                                className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Condiciones */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FilePenLine className="text-amber-400" size={20} />
                            Condiciones y Notas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Descuento Global ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={descuento}
                                        onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                        className="input-cyber w-full pl-7 text-amber-400 font-mono"
                                        min="0"
                                        step="1.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Válidez de Oferta (Días)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                    <input
                                        type="number"
                                        value={validezDias}
                                        onChange={(e) => setValidezDias(parseInt(e.target.value) || 15)}
                                        className="input-cyber w-full pl-9"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 mb-1 block">Notas Adicionales (Visible en PDF)</label>
                                <textarea
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    className="input-cyber w-full min-h-[80px]"
                                    placeholder="Ej: Precio válido para pago al contado. Entrega inmediata..."
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Panel Derecho: Resumen Flotante */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 rounded-2xl sticky top-6 border border-[var(--neon-green)]/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calculator className="text-gray-400" size={20} />
                            Resumen Económico
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Total Items</span>
                                <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">{items.length}</span>
                            </div>

                            <div className="border-t border-dashed border-gray-700 my-2"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Subtotal Operación</span>
                                <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
                            </div>

                            {descuento > 0 && (
                                <div className="flex justify-between items-center animate-fade-in">
                                    <span className="text-amber-400">Descuento Aplicado</span>
                                    <span className="text-amber-400 font-mono">-${descuento.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-white">TOTAL NETO</span>
                                    <span className="text-3xl font-black text-[var(--neon-green)] font-mono tracking-tighter">
                                        ${total.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 text-right mt-1">*Impuestos no incluídos</p>
                            </div>
                        </div>

                        <button
                            onClick={generarPDF}
                            disabled={!cliente || items.length === 0}
                            className="btn-cyber-primary w-full py-4 text-base font-bold shadow-lg hover:shadow-[var(--neon-cyan)]/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 group"
                        >
                            <Download className="group-hover:animate-bounce" size={20} />
                            DESCARGAR COTIZACIÓN
                        </button>

                        {(!cliente || items.length === 0) && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 text-center animate-fade-in">
                                ⚠️ Faltan datos requeridos: <br />
                                {!cliente && <span className="block">• Seleccionar Cliente</span>}
                                {items.length === 0 && <span className="block">• Añadir Productos</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
