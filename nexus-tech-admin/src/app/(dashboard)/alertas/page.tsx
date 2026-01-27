'use client'

import { useEffect, useState } from 'react'
import { getStockCritico, isFirebaseConfigured } from '@/lib/firebase'
import { Alert, Badge } from '@/components/ui'
import { AlertTriangle, Package, TrendingDown, RefreshCw } from 'lucide-react'

interface Producto {
    id: string
    sku: string
    nombre: string
    stock: number
    stock_minimo: number
    costo_compra: number
    categoria: string
}

const demoStockCritico: Producto[] = [
    { id: '1', sku: 'ACC-003', nombre: 'Funda iPhone 15 Pro', stock: 3, stock_minimo: 20, costo_compra: 3.5, categoria: 'Fundas' },
    { id: '2', sku: 'ACC-004', nombre: 'Cable USB-C 2m', stock: 5, stock_minimo: 25, costo_compra: 2, categoria: 'Cables' },
    { id: '3', sku: 'ACC-002', nombre: 'Cargador Inalámbrico 15W', stock: 4, stock_minimo: 15, costo_compra: 8, categoria: 'Cargadores' },
]

export default function AlertasPage() {
    const [stockCritico, setStockCritico] = useState<Producto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) { setIsDemo(true); setStockCritico(demoStockCritico); setIsLoading(false); return }
        try {
            const data = await getStockCritico()
            if (data.length > 0) { setStockCritico(data as Producto[]) }
            else { setIsDemo(true); setStockCritico(demoStockCritico) }
        } catch { setIsDemo(true); setStockCritico(demoStockCritico) }
        finally { setIsLoading(false) }
    }

    const getNivelUrgencia = (stock: number, minimo: number) => {
        const ratio = stock / minimo
        if (ratio <= 0.2) return { label: 'Crítico', color: 'danger' as const, bg: 'bg-red-500/20' }
        if (ratio <= 0.5) return { label: 'Bajo', color: 'warning' as const, bg: 'bg-amber-500/20' }
        return { label: 'Atención', color: 'info' as const, bg: 'bg-blue-500/20' }
    }

    const calcularReposicion = (stock: number, minimo: number) => {
        const objetivo = minimo * 2
        return Math.max(objetivo - stock, minimo)
    }

    return (
        <div className="animate-fade-in">
            <div className="header">
                <div><h1 className="header-title">Alertas de Stock</h1><p className="header-subtitle">Productos que necesitan reposición</p></div>
                <button onClick={loadData} className="btn btn-secondary" disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />Actualizar
                </button>
            </div>

            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card-glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-red-400">{stockCritico.filter(p => p.stock / p.stock_minimo <= 0.2).length}</p>
                            <p className="text-sm text-gray-400">Críticos</p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <TrendingDown className="w-7 h-7 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-amber-400">{stockCritico.filter(p => { const r = p.stock / p.stock_minimo; return r > 0.2 && r <= 0.5 }).length}</p>
                            <p className="text-sm text-gray-400">Bajos</p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Package className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{stockCritico.length}</p>
                            <p className="text-sm text-gray-400">Total alertas</p>
                        </div>
                    </div>
                </div>
            </div>

            {stockCritico.length === 0 ? (
                <div className="card-glass p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">¡Todo en orden!</h2>
                    <p className="text-gray-400">No hay productos con stock crítico en este momento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {stockCritico.sort((a, b) => (a.stock / a.stock_minimo) - (b.stock / b.stock_minimo)).map(producto => {
                        const urgencia = getNivelUrgencia(producto.stock, producto.stock_minimo)
                        const reposicion = calcularReposicion(producto.stock, producto.stock_minimo)
                        const costoReposicion = reposicion * producto.costo_compra

                        return (
                            <div key={producto.id} className={`card-glass p-6 border-l-4 ${urgencia.color === 'danger' ? 'border-l-red-500' : urgencia.color === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant={urgencia.color}>{urgencia.label}</Badge>
                                            <span className="font-mono text-sm text-indigo-400">{producto.sku}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1">{producto.nombre}</h3>
                                        <p className="text-sm text-gray-400">{producto.categoria}</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-8 text-center">
                                        <div>
                                            <p className="text-3xl font-bold text-red-400">{producto.stock}</p>
                                            <p className="text-xs text-gray-500">Stock actual</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-gray-400">{producto.stock_minimo}</p>
                                            <p className="text-xs text-gray-500">Mínimo</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-emerald-400">{reposicion}</p>
                                            <p className="text-xs text-gray-500">Sugerido</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <span>Costo unitario: <strong className="text-white">${producto.costo_compra.toFixed(2)}</strong></span>
                                        <span>Costo reposición: <strong className="text-white">${costoReposicion.toFixed(2)}</strong></span>
                                    </div>
                                    <a href="/productos" className="btn btn-secondary btn-sm">Ver producto</a>
                                </div>

                                <div className="mt-4">
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${urgencia.color === 'danger' ? 'bg-red-500' : urgencia.color === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min((producto.stock / producto.stock_minimo) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{((producto.stock / producto.stock_minimo) * 100).toFixed(0)}% del stock mínimo</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
