'use client'

import { useEffect, useState, useMemo } from 'react'
import { getProductos, create, update, remove, COLLECTIONS, isFirebaseConfigured } from '@/lib/firebase'
import { DataTable, Modal, Alert, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, Package, AlertTriangle, Sparkles, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import type { Producto } from '@/types/firestore'

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
        if (!isFirebaseConfigured()) {
            setIsDemo(true)
            setProductos(demoProductos)
            setIsLoading(false)
            return
        }
        try {
            const data = await getProductos()
            if (data.length > 0) {
                setProductos(data as Producto[])
            } else {
                // No forzamos demo si está configurado pero vacío, solo mostramos vacío
                setProductos([])
            }
        } catch {
            setIsDemo(true)
            setProductos(demoProductos)
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="product-icon-wrapper">
                        <Package size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.nombre}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', gap: '8px' }}>
                            <span className="font-mono">{p.sku}</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {p.stock <= p.stock_minimo && <AlertTriangle size={16} color="var(--color-warning)" />}
                    <span style={{
                        color: p.stock <= p.stock_minimo ? 'var(--color-warning)' : 'var(--color-text-primary)',
                        fontWeight: 600
                    }}>
                        {p.stock} u.
                    </span>
                </div>
            )
        },
        {
            key: 'precio_retail',
            header: 'Precio',
            render: (p: Producto) => (
                <span style={{ color: 'var(--color-accent-emerald)', fontWeight: 600 }}>
                    ${p.precio_retail.toFixed(2)}
                </span>
            )
        },
        {
            key: 'descripcion_ia',
            header: 'Info IA',
            render: (p: Producto) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color={p.descripcion_ia ? 'var(--color-primary-light)' : 'var(--color-text-disabled)'} />
                    <span style={{ fontSize: '12px', color: p.descripcion_ia ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)' }}>
                        {p.descripcion_ia ? 'Configurada' : 'Pendiente'}
                    </span>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => openModal(p)} className="btn btn-ghost" style={{ padding: '6px' }}>
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--color-danger)' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        },
    ]

    return (
        <div className="animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Inventario de Productos</h1>
                    <p className="page-subtitle">Gestiona el catálogo que tu Agente IA ofrecerá a los clientes</p>
                </div>
                <button onClick={() => openModal()} className="btn btn--primary">
                    <Plus size={18} />
                    Nuevo Producto
                </button>
            </header>

            {isDemo && (
                <div className="alert alert--info mb-6">
                    <AlertTriangle size={18} />
                    <div className="alert-content">
                        <strong>Modo Demo.</strong> Conecta Firebase para gestionar tu inventario real.
                    </div>
                </div>
            )}

            <div className="card">
                <DataTable
                    data={productos}
                    columns={columns}
                    searchKeys={['sku', 'nombre', 'categoria']}
                    isLoading={isLoading}
                    emptyMessage="No tienes productos en el inventario"
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Editar Producto IA' : 'Nuevo Producto IA'}
                width="800px"
            >
                <form onSubmit={handleSubmit} className="product-form">
                    {formError && <Alert type="danger" message={formError} />}

                    <div className="form-section">
                        <h4 className="form-section-title">Información Básica</h4>
                        <div className="grid grid--2">
                            <div className="form-group">
                                <label className="label">SKU (Código Único) *</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value.toUpperCase() }))}
                                    className="input"
                                    required
                                    placeholder="EJ: ACC-001"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Categoría</label>
                                <select
                                    value={formData.categoria}
                                    onChange={(e) => setFormData(p => ({ ...p, categoria: e.target.value }))}
                                    className="input select"
                                >
                                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Nombre del Producto *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                className="input"
                                required
                                placeholder="Ej: Funda iPhone 15 Pro Max - Negro"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h4 className="form-section-title">
                            <Sparkles size={16} style={{ color: 'var(--color-primary-light)' }} />
                            Configuración Agente IA
                        </h4>
                        <div className="form-group">
                            <label className="label">Descripción para la IA *</label>
                            <textarea
                                value={formData.descripcion_ia}
                                onChange={(e) => setFormData(p => ({ ...p, descripcion_ia: e.target.value }))}
                                className="input"
                                rows={4}
                                required
                                placeholder="Describe el producto detalladamente para que la IA pueda venderlo. Incluye características, beneficios de uso, materiales y compatibilidad. ¡Mientras mejor sea la descripción, mejor venderá!"
                            />
                            <p className="input-hint">El agente usará este texto para responder preguntas a los clientes.</p>
                        </div>
                        <div className="form-group">
                            <label className="label">
                                <LinkIcon size={14} /> Link de Pago Base
                            </label>
                            <input
                                type="url"
                                value={formData.link_pago_base}
                                onChange={(e) => setFormData(p => ({ ...p, link_pago_base: e.target.value }))}
                                className="input"
                                placeholder="https://buy.stripe.com/..."
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h4 className="form-section-title">Inventario y Precios</h4>
                        <div className="grid grid--2">
                            <div className="form-group">
                                <label className="label">Stock Actual</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                                    className="input"
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Alerta Stock Bajo</label>
                                <input
                                    type="number"
                                    value={formData.stock_minimo}
                                    onChange={(e) => setFormData(p => ({ ...p, stock_minimo: parseInt(e.target.value) || 0 }))}
                                    className="input"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="grid grid--3">
                            <div className="form-group">
                                <label className="label">Costo ($)</label>
                                <input
                                    type="number"
                                    value={formData.costo_compra}
                                    onChange={(e) => setFormData(p => ({ ...p, costo_compra: parseFloat(e.target.value) || 0 }))}
                                    className="input"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Precio Venta ($)</label>
                                <input
                                    type="number"
                                    value={formData.precio_retail}
                                    onChange={(e) => setFormData(p => ({ ...p, precio_retail: parseFloat(e.target.value) || 0 }))}
                                    className="input"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Margen</label>
                                <div className="input disabled text-right" style={{ color: 'var(--color-success)' }}>
                                    {margenRetail}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                id="activoData"
                                checked={formData.activo}
                                onChange={(e) => setFormData(p => ({ ...p, activo: e.target.checked }))}
                            />
                            <label htmlFor="activoData">Producto Activo para Venta</label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="btn btn--primary">
                                {isSaving ? 'Guardando...' : 'Guardar Producto'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .product-icon-wrapper {
                    width: 40px;
                    height: 40px;
                    background: var(--color-bg-tertiary);
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-secondary);
                }

                .product-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-6);
                }

                .form-section {
                    background: rgba(255,255,255,0.02);
                    padding: var(--space-4);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--color-border);
                }

                .form-section-title {
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                    color: var(--color-primary-light);
                    margin-bottom: var(--space-4);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                }

                .input-hint {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    margin-top: var(--space-1);
                }

                .modal-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: var(--space-4);
                }

                .modal-actions {
                    display: flex;
                    gap: var(--space-3);
                }

                .form-check {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    font-size: var(--font-size-sm);
                    color: var(--color-text-primary);
                }
            `}</style>
        </div>
    )
}
