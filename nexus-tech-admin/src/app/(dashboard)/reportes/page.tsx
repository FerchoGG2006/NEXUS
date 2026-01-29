'use client'

import { useEffect, useState } from 'react'
import { getMetricasDashboard, isFirebaseConfigured } from '@/lib/firebase'
import { Alert, StatsCard } from '@/components/ui'
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Download, PieChart, BarChart3, Activity, Wallet } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

interface Metricas {
    ganancia_neta_total: number
    total_ventas: number
    numero_transacciones: number
    ventas_retail: number
    ventas_b2b: number
    ventas_afiliados: number
    comisiones_pagadas: number
    productos_stock_critico: number
    afiliados_activos: number
}

const demoMetrics: Metricas = {
    ganancia_neta_total: 15420.50, total_ventas: 42350.00, numero_transacciones: 156,
    ventas_retail: 18500.00, ventas_b2b: 15850.00, ventas_afiliados: 8000.00,
    comisiones_pagadas: 1200.00, productos_stock_critico: 3, afiliados_activos: 12,
}

type PeriodType = 'hoy' | 'semana' | 'mes' | 'custom'

export default function ReportesPage() {
    const [metrics, setMetrics] = useState<Metricas | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const [period, setPeriod] = useState<PeriodType>('mes')
    const [dateRange, setDateRange] = useState({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') })

    useEffect(() => { loadMetrics() }, [period, dateRange])

    const getDateRange = () => {
        const today = new Date()
        switch (period) {
            case 'hoy': return { start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
            case 'semana': return { start: format(subDays(today, 7), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
            case 'mes': return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') }
            case 'custom': return dateRange
        }
    }

    const loadMetrics = async () => {
        setIsLoading(true)
        if (!isFirebaseConfigured()) { setIsDemo(true); setMetrics(demoMetrics); setIsLoading(false); return }
        try {
            const data = await getMetricasDashboard()
            if (data) { setMetrics(data) }
            else { setIsDemo(true); setMetrics(demoMetrics) }
        } catch { setIsDemo(true); setMetrics(demoMetrics) }
        finally { setIsLoading(false) }
    }

    const exportCSV = () => {
        if (!metrics) return
        const range = getDateRange()
        const csv = `Reporte NEXUS TECH-ADMIN\nPeriodo: ${range.start} a ${range.end}\n\nMétrica,Valor\nGanancia Neta,$${metrics.ganancia_neta_total.toFixed(2)}\nTotal Ventas,$${metrics.total_ventas.toFixed(2)}\nTransacciones,${metrics.numero_transacciones}\nVentas Retail,$${metrics.ventas_retail.toFixed(2)}\nVentas B2B,$${metrics.ventas_b2b.toFixed(2)}\nVentas Afiliados,$${metrics.ventas_afiliados.toFixed(2)}\nComisiones Pagadas,$${metrics.comisiones_pagadas.toFixed(2)}\nAfiliados Activos,${metrics.afiliados_activos}`

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `reporte-${range.start}-${range.end}.csv`
        link.click()
    }

    const margenOperativo = metrics ? ((metrics.ganancia_neta_total / metrics.total_ventas) * 100).toFixed(1) : '0'

    return (
        <div className="space-y-6 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="text-[var(--neon-green)] w-8 h-8" />
                        Reportes Financieros
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Análisis detallado de rendimiento y flujo de caja</p>
                </div>
                <button
                    onClick={exportCSV}
                    className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!metrics}
                >
                    <Download size={18} />
                    <span>EXPORTAR CSV</span>
                </button>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-blue-400"></div>
                    <span><strong>Modo Demo Activo.</strong> Visualizando métricas simuladas.</span>
                </div>
            )}

            <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Calendar className="w-5 h-5 text-[var(--neon-cyan)]" />
                    </div>
                    <span className="text-gray-300 font-medium">Intervalo de Análisis:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['hoy', 'semana', 'mes', 'custom'] as PeriodType[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p
                                    ? 'bg-[var(--neon-cyan)] text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {p === 'hoy' ? 'Hoy' : p === 'semana' ? '7 Días' : p === 'mes' ? 'Este Mes' : 'Personalizado'}
                        </button>
                    ))}
                </div>

                {period === 'custom' && (
                    <div className="flex gap-2 items-center bg-black/40 p-1.5 rounded-lg border border-white/10">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                            className="bg-transparent text-white text-sm focus:outline-none font-mono"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                            className="bg-transparent text-white text-sm focus:outline-none font-mono"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Ganancia Neta" value={metrics?.ganancia_neta_total || 0} icon={TrendingUp} variant="success" isLoading={isLoading} />
                <StatsCard title="Ventas Totales" value={metrics?.total_ventas || 0} icon={DollarSign} variant="info" isLoading={isLoading} />
                <StatsCard title="Transacciones" value={metrics?.numero_transacciones || 0} icon={ShoppingCart} variant="default" isLoading={isLoading} />
                <StatsCard title="Margen Operativo" value={`${margenOperativo}%`} icon={Activity} variant="warning" isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <PieChart className="text-blue-400" size={20} />
                        Desglose por Canal
                    </h2>
                    <div className="space-y-6">
                        {[
                            { label: 'Ventas Retail', value: metrics?.ventas_retail || 0, color: 'bg-blue-500', shadow: 'shadow-blue-500/50', percentage: metrics ? ((metrics.ventas_retail / metrics.total_ventas) * 100).toFixed(1) : 0 },
                            { label: 'Ventas B2B', value: metrics?.ventas_b2b || 0, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50', percentage: metrics ? ((metrics.ventas_b2b / metrics.total_ventas) * 100).toFixed(1) : 0 },
                            { label: 'Ventas Afiliados', value: metrics?.ventas_afiliados || 0, color: 'bg-amber-500', shadow: 'shadow-amber-500/50', percentage: metrics ? ((metrics.ventas_afiliados / metrics.total_ventas) * 100).toFixed(1) : 0 },
                        ].map(item => (
                            <div key={item.label} className="relative z-10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300 font-medium">{item.label}</span>
                                    <div className="text-right">
                                        <span className="block font-bold text-white text-lg">${item.value.toFixed(2)}</span>
                                        <span className="text-xs text-gray-500 font-mono">{item.percentage}% del total</span>
                                    </div>
                                </div>
                                <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0)] ${item.shadow}`} style={{ width: `${item.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Wallet className="text-emerald-400" size={20} />
                        Resumen Financiero
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-gray-400">Ingresos Brutos</span>
                            <span className="font-bold text-white font-mono text-lg">${(metrics?.total_ventas || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <span className="text-amber-200">Comisiones Pagadas (Afiliados)</span>
                            <span className="font-bold text-amber-400 font-mono text-lg">-${(metrics?.comisiones_pagadas || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <span className="text-red-200">Gastos Operativos Est. (5%)</span>
                            <span className="font-bold text-red-400 font-mono text-lg">-${((metrics?.total_ventas || 0) * 0.05).toFixed(2)}</span>
                        </div>

                        <div className="my-4 border-t border-dashed border-gray-700/50"></div>

                        <div className="flex justify-between p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <div>
                                <span className="block text-emerald-400 font-bold uppercase tracking-wider text-sm">Utilidad Neta</span>
                                <span className="text-xs text-emerald-300/60">Después de impuestos y comisiones</span>
                            </div>
                            <span className="font-black text-emerald-400 text-3xl font-mono">${(metrics?.ganancia_neta_total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="text-[var(--neon-purple)]" size={20} />
                    Rendimiento de Afiliados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-black/30 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--neon-purple)]/50 transition-colors group">
                        <Users className="w-8 h-8 text-[var(--neon-purple)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div>
                            <p className="text-3xl font-bold text-white group-hover:text-[var(--neon-purple)] transition-colors">{metrics?.afiliados_activos || 0}</p>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Socios Activos</p>
                        </div>
                    </div>
                    <div className="p-5 bg-black/30 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center gap-2 hover:border-blue-500/50 transition-colors group">
                        <DollarSign className="w-8 h-8 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div>
                            <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">${(metrics?.ventas_afiliados || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ventas Generadas</p>
                        </div>
                    </div>
                    <div className="p-5 bg-black/30 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center gap-2 hover:border-amber-500/50 transition-colors group">
                        <Wallet className="w-8 h-8 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div>
                            <p className="text-3xl font-bold text-white group-hover:text-amber-400 transition-colors">${(metrics?.comisiones_pagadas || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Comisiones Pagadas</p>
                        </div>
                    </div>
                    <div className="p-5 bg-black/30 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center gap-2 hover:border-emerald-500/50 transition-colors group">
                        <TrendingUp className="w-8 h-8 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div>
                            <p className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">${((metrics?.ventas_afiliados || 0) - (metrics?.comisiones_pagadas || 0)).toFixed(2)}</p>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ganancia Neta Socios</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
