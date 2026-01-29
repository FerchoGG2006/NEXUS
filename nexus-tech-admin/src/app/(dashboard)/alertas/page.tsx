'use client'

import { useEffect, useState } from 'react'
import { getStockCritico, isFirebaseConfigured } from '@/lib/firebase'
import { Alert, Badge } from '@/components/ui'
import { AlertTriangle, Package, TrendingDown, RefreshCw, AlertOctagon, BarChart3, ArrowRight } from 'lucide-react'

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
        if (ratio <= 0.2) return { label: 'Crítico', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' }
        if (ratio <= 0.5) return { label: 'Bajo', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
        return { label: 'Atención', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
    }

    const calcularReposicion = (stock: number, minimo: number) => {
        const objetivo = minimo * 2
        return Math.max(objetivo - stock, minimo)
    }

    return (
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <AlertOctagon className="text-red-500 w-8 h-8 animate-pulse" />
                        Alertas de Stock
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Monitoreo en tiempo real de inventario crítico</p>
                </div>
                <button
                    onClick={loadData}
                    className="btn-cyber-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                    disabled={isLoading}
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>ACTUALIZAR DATOS</span>
                </button>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-blue-400"></div>
                    <span><strong>Modo Demo Activo.</strong> Visualizando alertas simuladas.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-red-500/20 relative overflow-hidden group">
                    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/20 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <AlertTriangle className="w-7 h-7 text-red-500" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{stockCritico.filter(p => p.stock / p.stock_minimo <= 0.2).length}</p>
                            <p className="text-sm font-bold text-red-500 uppercase tracking-wider">Nivel Crítico</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 relative overflow-hidden group">
                    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <TrendingDown className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{stockCritico.filter(p => { const r = p.stock / p.stock_minimo; return r > 0.2 && r <= 0.5 }).length}</p>
                            <p className="text-sm font-bold text-amber-500 uppercase tracking-wider">Nivel Bajo</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Package className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white">{stockCritico.length}</p>
                            <p className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Total Alertas</p>
                        </div>
                    </div>
                </div>
            </div>

            {stockCritico.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-3xl border border-dashed border-gray-700 bg-black/20">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <Package className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">¡Todo en orden!</h2>
                    <p className="text-gray-400 max-w-md mx-auto">No se han detectado productos con niveles de stock críticos en este momento. El inventario está saludable.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-4 mb-2">
                        <BarChart3 className="text-gray-400" />
                        Detalle de Productos
                    </h2>

                    {stockCritico.sort((a, b) => (a.stock / a.stock_minimo) - (b.stock / b.stock_minimo)).map(producto => {
                        const urgencia = getNivelUrgencia(producto.stock, producto.stock_minimo)
                        const reposicion = calcularReposicion(producto.stock, producto.stock_minimo)
                        const costoReposicion = reposicion * producto.costo_compra
                        const porcentaje = Math.min((producto.stock / producto.stock_minimo) * 100, 100)

                        return (
                            <div key={producto.id} className="glass-panel p-0 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300">
                                <div className={`h-1 w-full ${urgencia.color.replace('text-', 'bg-')}`}></div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

                                    {/* Info Producto */}
                                    <div className="lg:col-span-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${urgencia.bg} ${urgencia.color} ${urgencia.border}`}>
                                                {urgencia.label}
                                            </span>
                                            <span className="font-mono text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">{producto.sku}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{producto.nombre}</h3>
                                        <p className="text-sm text-gray-400">{producto.categoria}</p>
                                    </div>

                                    {/* Métricas Stock */}
                                    <div className="lg:col-span-5 grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-black/20 rounded-lg border border-white/5">
                                            <p className={`text-2xl font-black ${urgencia.color}`}>{producto.stock}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Stock Actual</p>
                                        </div>
                                        <div className="text-center p-3 bg-black/20 rounded-lg border border-white/5">
                                            <p className="text-2xl font-black text-gray-400">{producto.stock_minimo}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Mínimo Req.</p>
                                        </div>
                                        <div className="text-center p-3 bg-emerald-900/10 rounded-lg border border-emerald-500/20">
                                            <p className="text-2xl font-black text-emerald-400">+{reposicion}</p>
                                            <p className="text-[10px] text-emerald-500/70 uppercase font-bold mt-1">Sugerido</p>
                                        </div>
                                    </div>

                                    {/* Acciones e Info Fin */}
                                    <div className="lg:col-span-3 flex flex-col gap-3 justify-center">
                                        <div className="flex justify-between items-center text-xs text-gray-400 bg-white/5 px-3 py-2 rounded-lg">
                                            <span>Costo Reposición:</span>
                                            <strong className="text-white font-mono text-sm">${costoReposicion.toFixed(2)}</strong>
                                        </div>
                                        <a href="/productos" className="btn-cyber-primary py-2 text-xs flex items-center justify-center gap-2 group/btn">
                                            GESTIONAR PRODUCTO
                                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    </div>

                                    {/* Barra Progreso */}
                                    <div className="lg:col-span-12 mt-2">
                                        <div className="flex justify-between text-xs mb-1.5 px-1">
                                            <span className="text-gray-500">Nivel de Inventario</span>
                                            <span className={`${urgencia.color} font-bold`}>{porcentaje.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${urgencia.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`}
                                                style={{ width: `${porcentaje}%`, boxShadow: `0 0 10px ${urgencia.color.includes('red') ? '#ef4444' : urgencia.color.includes('amber') ? '#f59e0b' : '#60a5fa'}` }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
