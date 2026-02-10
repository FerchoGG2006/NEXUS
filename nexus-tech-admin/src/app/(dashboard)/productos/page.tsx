'use client'

import { useEffect, useState, useMemo } from 'react'
import { getProductos, create, update, remove, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Modal, Alert, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, Package, AlertTriangle, Sparkles, Image as ImageIcon, Link as LinkIcon, Search } from 'lucide-react'
import type { Producto } from '@/types/firestore'

// Demo Data
const demoProductos: Producto[] = [
    {
        id: '1',
        sku: 'ACC-001',
        nombre: 'iPhone 15 Pro Case',
        descripcion: 'Funda de silicona premium',
        descripcion_ia: 'Funda de silicona suave al tacto, interior de microfibra, protección contra caídas de 2m. Compatible con MagSafe. Colores: Negro, Azul, Verde.',
        stock: 50,
        stock_minimo: 10,
        costo_compra: 12,
        precio_retail: 29.99,
        precio_b2b: 22,
        categoria: 'Fundas',
        link_pago_base: 'https://link.pago/case-iphone',
        imagenes: [],
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
]

const categorias = ['Audio', 'Cargadores', 'Cables', 'Fundas', 'Protectores', 'Accesorios', 'Gaming', 'Smartwatch']

export default function ProductosPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Omit<Producto, 'id' | 'created_at' | 'updated_at'>>({
        sku: '',
        nombre: '',
        descripcion: '',
        descripcion_ia: '',
        stock: 0,
        stock_minimo: 5,
        costo_compra: 0,
        precio_retail: 0,
        precio_b2b: 0,
        categoria: 'Accesorios',
        link_pago_base: '',
        imagenes: [],
        activo: true
    })

    useEffect(() => { loadProductos() }, [])

    const loadProductos = async () => {
        setIsLoading(true)
        const activateDemo = () => {
            console.warn('⚠️ Activando Modo Demo en Productos por conexion.')
            setIsDemo(true)
            setProductos(demoProductos)
            setIsLoading(false)
        }

        if (!isFirebaseConfigured()) {
            activateDemo()
            return
        }

        try {
            const data = await getProductos()
            setProductos(data as Producto[])
            setIsDemo(false)
        } catch (error) {
            console.error('Error loading productos:', error)
            activateDemo()
        } finally {
            setIsLoading(false)
        }
    }

    const openModal = (producto?: Producto) => {
        if (producto) {
            setEditingProduct(producto)
            setFormData({
                sku: producto.sku,
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                descripcion_ia: producto.descripcion_ia || '',
                stock: producto.stock,
                stock_minimo: producto.stock_minimo,
                costo_compra: producto.costo_compra,
                precio_retail: producto.precio_retail,
                precio_b2b: producto.precio_b2b,
                categoria: producto.categoria,
                link_pago_base: producto.link_pago_base || '',
                imagenes: producto.imagenes || [],
                activo: producto.activo
            })
        } else {
            setEditingProduct(null)
            setFormData({
                sku: '', nombre: '', descripcion: '', descripcion_ia: '',
                stock: 0, stock_minimo: 5, costo_compra: 0,
                precio_retail: 0, precio_b2b: 0, categoria: 'Accesorios',
                link_pago_base: '', imagenes: [], activo: true
            })
        }
        setFormError(null)
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setIsSaving(true)

        try {
            const productData = {
                ...formData,
                updated_at: new Date().toISOString()
            }

            if (isDemo) {
                // Lógica demo simplificada
                if (editingProduct) {
                    setProductos(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData, id: p.id, created_at: p.created_at } : p))
                } else {
                    setProductos(prev => [...prev, { ...productData, id: `temp-${Date.now()}`, created_at: new Date().toISOString() } as Producto])
                }
                setIsModalOpen(false)
                return
            }

            if (editingProduct) {
                await update(COLLECTIONS.PRODUCTOS, editingProduct.id, productData)
            } else {
                await create(COLLECTIONS.PRODUCTOS, {
                    ...productData,
                    created_at: new Date().toISOString()
                })
            }
            await loadProductos()
            setIsModalOpen(false)
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este producto? La IA ya no podrá venderlo.')) return
        if (isDemo) { setProductos(prev => prev.filter(p => p.id !== id)); return }
        await remove(COLLECTIONS.PRODUCTOS, id)
        await loadProductos()
    }

    const margenRetail = useMemo(() => {
        if (formData.costo_compra === 0) return 0
        return ((formData.precio_retail - formData.costo_compra) / formData.costo_compra * 100).toFixed(1)
    }, [formData.costo_compra, formData.precio_retail])

    const columns = [
        {
            key: 'nombre',
            header: 'Producto',
            sortable: true,
            render: (p: Producto) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--neon-purple)]/20 flex items-center justify-center text-[var(--neon-purple)]">
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-white">{p.nombre}</div>
                        <div className="text-xs text-gray-400 flex gap-2">
                            <span className="font-mono text-[var(--neon-cyan)] opacity-80">{p.sku}</span>
                            <span>•</span>
                            <span>{p.categoria}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'stock',
            header: 'Stock',
            render: (p: Producto) => (
                <div className="flex items-center gap-2">
                    {p.stock <= p.stock_minimo && <AlertTriangle size={16} className="text-amber-500 animate-pulse" />}
                    <span className={`font-mono font-bold ${p.stock <= p.stock_minimo ? 'text-amber-500' : 'text-white'}`}>
                        {p.stock} u.
                    </span>
                </div>
            )
        },
        {
            key: 'precio_retail',
            header: 'Precio',
            render: (p: Producto) => (
                <span className="text-[var(--neon-green)] font-bold tracking-wide">
                    ${p.precio_retail.toFixed(2)}
                </span>
            )
        },
        {
            key: 'descripcion_ia',
            header: 'Configuración',
            render: (p: Producto) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2" title="Descripción IA">
                        <Sparkles size={14} className={p.descripcion_ia ? 'text-[var(--neon-cyan)]' : 'text-gray-600'} />
                        <span className={`text-xs ${p.descripcion_ia ? 'text-white' : 'text-gray-600'}`}>
                            {p.descripcion_ia ? 'IA Lista' : 'Sin Prompt'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2" title="Link de Pago">
                        <LinkIcon size={14} className={p.link_pago_base ? 'text-[var(--neon-green)]' : 'text-gray-600'} />
                        <span className={`text-xs ${p.link_pago_base ? 'text-white' : 'text-gray-600'}`}>
                            {p.link_pago_base ? 'Link OK' : 'Sin Link'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (p: Producto) => (
                <Badge variant={p.activo ? 'success' : 'danger'}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            render: (p: Producto) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(p)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        },
    ]

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Package className="text-[var(--neon-purple)] w-8 h-8" />
                        Inventario Holográfico
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {productos.length} Productos Sincronizados con Agente IA
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform">
                    <Plus size={18} />
                    <span>NUEVO PRODUCTO</span>
                </button>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <AlertTriangle size={20} />
                    <span><strong>Modo Simulación.</strong> Los cambios son locales.</span>
                </div>
            )}

            <div className="glass-panel p-6 rounded-2xl">
                <DataTable
                    data={productos}
                    columns={columns}
                    searchKeys={['sku', 'nombre', 'categoria']}
                    isLoading={isLoading}
                    emptyMessage="No hay productos en la matrix de inventario."
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Modificar Producto' : 'Ingresar Nuevo Ítem'}
                width="800px"
            >
                <form onSubmit={handleSubmit} className="space-y-6 text-gray-200">
                    {formError && <Alert type="danger" message={formError} />}

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-[var(--neon-purple)] uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon size={14} /> Datos Base
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value.toUpperCase() }))}
                                    className="input-cyber"
                                    required
                                    placeholder="EJ: ACC-001"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Categoría</label>
                                <select
                                    value={formData.categoria}
                                    onChange={(e) => setFormData(p => ({ ...p, categoria: e.target.value }))}
                                    className="input-cyber"
                                >
                                    {categorias.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Nombre del Producto</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                className="input-cyber"
                                required
                                placeholder="Ej: Funda iPhone 15 Pro Max"
                            />
                        </div>
                    </div>

                    <div className="bg-[var(--neon-cyan)]/5 p-4 rounded-xl border border-[var(--neon-cyan)]/20 space-y-4">
                        <h4 className="text-sm font-bold text-[var(--neon-cyan)] uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={14} /> Configuración Neural
                        </h4>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Prompt para la IA (Descripción)</label>
                            <textarea
                                value={formData.descripcion_ia}
                                onChange={(e) => setFormData(p => ({ ...p, descripcion_ia: e.target.value }))}
                                className="input-cyber min-h-[100px]"
                                required
                                placeholder="Describe el producto para que la IA sepa venderlo..."
                            />
                            <p className="text-[10px] text-gray-500">La IA usará esto para responder preguntas.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 flex items-center gap-1">
                                <LinkIcon size={12} /> Link de Pago
                            </label>
                            <input
                                type="url"
                                value={formData.link_pago_base}
                                onChange={(e) => setFormData(p => ({ ...p, link_pago_base: e.target.value }))}
                                className="input-cyber"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Economía</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Stock Actual</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                                    className="input-cyber"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Stock Mínimo</label>
                                <input
                                    type="number"
                                    value={formData.stock_minimo}
                                    onChange={(e) => setFormData(p => ({ ...p, stock_minimo: parseInt(e.target.value) || 0 }))}
                                    className="input-cyber"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Costo ($)</label>
                                <input
                                    type="number"
                                    value={formData.costo_compra}
                                    onChange={(e) => setFormData(p => ({ ...p, costo_compra: parseFloat(e.target.value) || 0 }))}
                                    className="input-cyber"
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Precio ($)</label>
                                <input
                                    type="number"
                                    value={formData.precio_retail}
                                    onChange={(e) => setFormData(p => ({ ...p, precio_retail: parseFloat(e.target.value) || 0 }))}
                                    className="input-cyber"
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Margen</label>
                                <div className="p-2 text-right text-[var(--neon-green)] font-mono font-bold">
                                    {margenRetail}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.activo}
                                onChange={(e) => setFormData(p => ({ ...p, activo: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-600 bg-transparent text-[var(--neon-cyan)] focus:ring-0"
                            />
                            <span className="text-sm font-medium">Producto Activo</span>
                        </label>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSaving} className="btn-cyber-primary px-6 py-2 rounded-lg">
                                {isSaving ? 'Procesando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
