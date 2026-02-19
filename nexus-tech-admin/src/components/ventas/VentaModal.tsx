import { useState, useEffect } from 'react'
import { Modal, Alert } from '@/components/ui'
import { ShoppingCart } from 'lucide-react'
import { Producto, Afiliado, Venta } from '@/types'
import { calcularVenta } from '@/utils/ventasUtils'

interface VentaModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (ventaData: any) => Promise<void>
    productos: Producto[]
    afiliados: Afiliado[]
    isSaving: boolean
}

interface FormData {
    producto_id: string
    tipo_venta: 'Retail' | 'B2B' | 'Afiliado'
    cantidad: number
    afiliado_id: string
    descuento: number
    notas: string
}

const INITIAL_FORM_DATA: FormData = {
    producto_id: '',
    tipo_venta: 'Retail',
    cantidad: 1,
    afiliado_id: '',
    descuento: 0,
    notas: ''
}

export function VentaModal({ isOpen, onClose, onSubmit, productos, afiliados, isSaving }: VentaModalProps) {
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
    const [formError, setFormError] = useState<string | null>(null)

    // Reset details when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData(INITIAL_FORM_DATA)
            setFormError(null)
        }
    }, [isOpen])


    // Local function removed. Now using utility.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        const producto = productos.find(p => p.id === formData.producto_id)
        if (!producto) {
            setFormError('Selecciona un producto')
            return
        }

        const calc = calcularVenta({
            producto_id: formData.producto_id,
            tipo_venta: formData.tipo_venta as any,
            cantidad: formData.cantidad,
            afiliado_id: formData.afiliado_id,
            descuento: formData.descuento,
            productos,
            afiliados
        })

        try {
            await onSubmit({
                ...formData,
                precio_unitario: formData.tipo_venta === 'B2B' ? producto.precio_b2b : producto.precio_retail,
                subtotal: calc.subtotal,
                total_venta: calc.total,
                costo_total: calc.costo,
                comision_afiliado: calc.comision,
                gastos_operativos: calc.gastos,
                ganancia_neta: calc.ganancia,
            })
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Error al guardar')
        }
    }

    const calc = calcularVenta({
        producto_id: formData.producto_id,
        tipo_venta: formData.tipo_venta as any,
        cantidad: formData.cantidad,
        afiliado_id: formData.afiliado_id,
        descuento: formData.descuento,
        productos,
        afiliados
    })

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
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
                                onChange={(e) => setFormData(p => ({ ...p, tipo_venta: e.target.value as any }))}
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
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="btn-cyber-primary px-6 py-2 rounded-lg">
                        {isSaving ? 'Procesando...' : 'Confirmar Venta'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
