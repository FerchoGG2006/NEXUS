'use client'

import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '@/lib/firebase'
import { VentasService } from '@/services/ventasService'
import { ProductosService } from '@/services/productosService'
import { AfiliadosService } from '@/services/afiliadosService'
import { Venta, Producto, Afiliado, VentasServiceResponse } from '@/types'
import { DataTable, Badge, Alert } from '@/components/ui'
import { Plus, ShoppingBag, User, Tag, Calendar, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatPrice } from '@/lib/currency'
import { VentasStats } from '@/components/ventas/VentasStats'
import { VentaModal } from '@/components/ventas/VentaModal'



export default function VentasPage() {
    const [ventas, setVentas] = useState<Venta[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [afiliados, setAfiliados] = useState<Afiliado[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Pagination State
    const [lastDoc, setLastDoc] = useState<any>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 10

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) {
            setIsLoading(false); return
        }
        try {
            const [ventasResponse, productosData, afiliadosData] = await Promise.all([
                VentasService.getAll(PAGE_SIZE),
                ProductosService.getAllActive(),
                AfiliadosService.getAll()
            ])

            const { data: ventasData, lastDoc: lastVisible } = ventasResponse

            setVentas(ventasData)
            setLastDoc(lastVisible)
            setHasMore(!!lastVisible)
            setProductos(productosData)
            setAfiliados(afiliadosData)
        } catch (error) {
            console.error(error)
        } finally { setIsLoading(false) }
    }

    const handleCreateVenta = async (ventaData: any) => {
        setIsSaving(true)
        try {
            const nuevaVenta: Omit<Venta, 'id'> = {
                numero_venta: VentasService.generateNewSaleNumber(),
                producto_id: ventaData.producto_id,
                tipo_venta: ventaData.tipo_venta,
                cantidad: ventaData.cantidad,
                precio_unitario: ventaData.precio_unitario,
                subtotal: ventaData.subtotal,
                descuento: ventaData.descuento,
                total_venta: ventaData.total_venta,
                costo_total: ventaData.costo_total,
                comision_afiliado: ventaData.comision_afiliado,
                gastos_operativos: ventaData.gastos_operativos,
                ganancia_neta: ventaData.ganancia_neta,
                afiliado_id: ventaData.afiliado_id || null,
                estado: 'Completada',
                fecha: new Date().toISOString()
            }



            await VentasService.create(nuevaVenta)
            await loadData()
            setIsModalOpen(false)
        } catch (error) {
            console.error(error)
            alert('Error al crear venta')
        } finally {
            setIsSaving(false)
        }
    }

    const loadMore = async () => {
        if (!lastDoc || loadingMore) return
        setLoadingMore(true)
        try {
            const { data: newVentas, lastDoc: newLastDoc } = await VentasService.getAll(PAGE_SIZE, lastDoc)
            setVentas(prev => [...prev, ...newVentas])
            setLastDoc(newLastDoc)
            setHasMore(!!newLastDoc)
        } catch (error) {
            console.error('Error loading more ventas:', error)
        } finally {
            setLoadingMore(false)
        }
    }

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
            render: (v: Venta) => <span className="text-white font-bold tracking-wide">{formatPrice(v.total_venta)}</span>
        },
        {
            key: 'ganancia_neta',
            header: 'Ganancia',
            render: (v: Venta) => (
                <span className={`font-bold ${v.ganancia_neta > 0 ? 'text-[var(--neon-green)]' : 'text-red-400'}`}>
                    {formatPrice(v.ganancia_neta)}
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
                    onClick={() => setIsModalOpen(true)}
                    className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Plus size={18} />
                    <span>NUEVA VENTA</span>
                </button>
            </header>



            <VentasStats
                totalVentas={ventas.length}
                ingresosBrutos={totalVentas}
                gananciaNeta={totalGanancia}
            />

            <div className="glass-panel p-6 rounded-2xl">
                <DataTable data={ventas} columns={columns} searchKeys={['numero_venta']} isLoading={isLoading} emptyMessage="No hay registros en el blockchain de ventas." />

                {hasMore && !isLoading && (
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="text-sm text-[var(--neon-cyan)] hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loadingMore ? 'Cargando...' : 'Cargar más transacciones'}
                        </button>
                    </div>
                )}
            </div>

            <VentaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateVenta}
                productos={productos}
                afiliados={afiliados}
                isSaving={isSaving}
            />
        </div>
    )
}
