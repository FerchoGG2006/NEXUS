'use client'

import { useEffect, useState } from 'react'
import { getMetricasDashboard, isFirebaseConfigured } from '@/lib/firebase'
import { Alert, StatsCard } from '@/components/ui'
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Download } from 'lucide-react'
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
        <div className="animate-fade-in">
            <div className="header">
                <div><h1 className="header-title">Reportes</h1><p className="header-subtitle">Análisis de rendimiento</p></div>
                <button onClick={exportCSV} className="btn btn-secondary" disabled={!metrics}><Download className="w-4 h-4" />Exportar CSV</button>
            </div>

            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}

            <div className="card-glass p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-400">Periodo:</span>
                    </div>
                    <div className="flex gap-2">
                        {(['hoy', 'semana', 'mes', 'custom'] as PeriodType[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}>
                                {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Últimos 7 días' : p === 'mes' ? 'Este mes' : 'Personalizado'}
                            </button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div className="flex gap-2 items-center">
                            <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className="input py-1.5" />
                            <span className="text-gray-500">a</span>
                            <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className="input py-1.5" />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid-stats">
                <StatsCard title="Ganancia Neta" value={metrics?.ganancia_neta_total || 0} icon={TrendingUp} variant="success" isLoading={isLoading} />
                <StatsCard title="Total Ventas" value={metrics?.total_ventas || 0} icon={DollarSign} variant="info" isLoading={isLoading} />
                <StatsCard title="Transacciones" value={metrics?.numero_transacciones || 0} icon={ShoppingCart} variant="default" isLoading={isLoading} />
                <StatsCard title="Margen Operativo" value={`${margenOperativo}%`} icon={TrendingUp} variant="warning" isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Desglose por Canal</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Ventas Retail', value: metrics?.ventas_retail || 0, color: 'bg-blue-500', percentage: metrics ? ((metrics.ventas_retail / metrics.total_ventas) * 100).toFixed(1) : 0 },
                            { label: 'Ventas B2B', value: metrics?.ventas_b2b || 0, color: 'bg-emerald-500', percentage: metrics ? ((metrics.ventas_b2b / metrics.total_ventas) * 100).toFixed(1) : 0 },
                            { label: 'Ventas Afiliados', value: metrics?.ventas_afiliados || 0, color: 'bg-amber-500', percentage: metrics ? ((metrics.ventas_afiliados / metrics.total_ventas) * 100).toFixed(1) : 0 },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">{item.label}</span>
                                    <span className="font-semibold text-white">${item.value.toFixed(2)} <span className="text-gray-500 text-sm">({item.percentage}%)</span></span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Resumen Financiero</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-gray-800 rounded-lg"><span className="text-gray-400">Total Ventas Brutas</span><span className="font-semibold text-white">${(metrics?.total_ventas || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between p-3 bg-gray-800 rounded-lg"><span className="text-gray-400">Comisiones Afiliados</span><span className="font-semibold text-amber-400">-${(metrics?.comisiones_pagadas || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between p-3 bg-gray-800 rounded-lg"><span className="text-gray-400">Gastos Operativos (5%)</span><span className="font-semibold text-red-400">-${((metrics?.total_ventas || 0) * 0.05).toFixed(2)}</span></div>
                        <hr className="border-gray-700" />
                        <div className="flex justify-between p-3 bg-emerald-500/10 rounded-lg"><span className="text-emerald-400 font-semibold">Ganancia Neta Admin</span><span className="font-bold text-emerald-400 text-xl">${(metrics?.ganancia_neta_total || 0).toFixed(2)}</span></div>
                    </div>
                </div>
            </div>

            <div className="card-glass p-6 mt-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Programa de Afiliados</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-800 rounded-lg text-center"><p className="text-2xl font-bold text-white">{metrics?.afiliados_activos || 0}</p><p className="text-sm text-gray-400">Afiliados activos</p></div>
                    <div className="p-4 bg-gray-800 rounded-lg text-center"><p className="text-2xl font-bold text-white">${(metrics?.ventas_afiliados || 0).toFixed(2)}</p><p className="text-sm text-gray-400">Ventas por afiliados</p></div>
                    <div className="p-4 bg-gray-800 rounded-lg text-center"><p className="text-2xl font-bold text-amber-400">${(metrics?.comisiones_pagadas || 0).toFixed(2)}</p><p className="text-sm text-gray-400">Comisiones pagadas</p></div>
                    <div className="p-4 bg-gray-800 rounded-lg text-center"><p className="text-2xl font-bold text-emerald-400">${((metrics?.ventas_afiliados || 0) - (metrics?.comisiones_pagadas || 0)).toFixed(2)}</p><p className="text-sm text-gray-400">Ganancia de afiliados</p></div>
                </div>
            </div>
        </div>
    )
}
