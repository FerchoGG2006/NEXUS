'use client'

import { useEffect, useState, Suspense } from 'react'
import { getAfiliadoByCodigo, getProductosActivos, getVentasByAfiliado, isFirebaseConfigured } from '@/lib/firebase'
import { Badge } from '@/components/ui'
import { DollarSign, ShoppingBag, Share2, Copy, Check, ExternalLink, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface Afiliado {
    id: string
    nombre: string
    codigo_referido: string
    comision_porcentaje: number
    balance_acumulado: number
    balance_pagado: number
    nivel: string
}

interface Producto { id: string; sku: string; nombre: string; descripcion: string; precio_retail: number; categoria: string }
interface Venta { id: string; numero_venta: string; total_venta: number; comision_afiliado: number; estado: string; fecha: string }

const demoAfiliado: Afiliado = {
    id: '1', nombre: 'Carlos Martinez', codigo_referido: 'CARLOS2024', comision_porcentaje: 10,
    balance_acumulado: 450.00, balance_pagado: 200.00, nivel: 'Plata'
}

const demoProductos: Producto[] = [
    { id: '1', sku: 'ACC-001', nombre: 'Audífonos Bluetooth Pro', descripcion: 'Audífonos premium', precio_retail: 240000, categoria: 'Audio' },
    { id: '2', sku: 'ACC-002', nombre: 'Cargador Inalámbrico 15W', descripcion: 'Carga rápida', precio_retail: 120000, categoria: 'Cargadores' },
    { id: '3', sku: 'ACC-005', nombre: 'Power Bank 10000mAh', descripcion: 'Batería portátil', precio_retail: 180000, categoria: 'Baterías' },
]

const demoVentas: Venta[] = [
    { id: '1', numero_venta: 'NTX-001', total_venta: 119.98, comision_afiliado: 12.00, estado: 'Completada', fecha: new Date().toISOString() },
]

function PortalAfiliadoContent() {
    const searchParams = useSearchParams()
    const codigo = searchParams.get('codigo')
    const [afiliado, setAfiliado] = useState<Afiliado | null>(null)
    const [productos, setProductos] = useState<Producto[]>([])
    const [ventas, setVentas] = useState<Venta[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { loadData() }, [codigo])

    const loadData = async () => {
        setIsLoading(true)

        if (!codigo) {
            // Si no hay código, mostrar error o demo si es root?
            // Asumimos error
            // setError('Código de afiliado no proporcionado')
            // Pero para demo, si entran directo, tal vez mostrar demo?
            // setError('Código requerido (?codigo=...)')
            setIsLoading(false)
            return
        }

        if (!isFirebaseConfigured()) {
            if (codigo === 'CARLOS2024') {
                setIsDemo(true); setAfiliado(demoAfiliado); setProductos(demoProductos); setVentas(demoVentas)
            } else { setError('Código de afiliado no encontrado') }
            setIsLoading(false); return
        }

        try {
            const afiliadoData = await getAfiliadoByCodigo(codigo)
            if (!afiliadoData) { setError('Código de afiliado no encontrado'); setIsLoading(false); return }

            setAfiliado(afiliadoData as Afiliado)
            const [prodData, ventasData] = await Promise.all([
                getProductosActivos(),
                getVentasByAfiliado((afiliadoData as Afiliado).id)
            ])
            setProductos(prodData as Producto[])
            setVentas(ventasData as Venta[])
        } catch { setError('Error al cargar datos') }
        finally { setIsLoading(false) }
    }

    const shareProduct = async (producto: Producto) => {
        // Updated link format
        const url = `${window.location.origin}/comprar?sku=${producto.sku}&ref=${codigo}`
        const text = `¡Mira este increíble producto! ${producto.nombre} por solo $${producto.precio_retail}`

        if (navigator.share) {
            try { await navigator.share({ title: producto.nombre, text, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
            alert('Enlace copiado al portapapeles')
        }
    }

    const copyReferralLink = async () => {
        // Updated link format
        const url = `${window.location.origin}/socio?codigo=${codigo}`
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Cargando portal...</p>
            </div>
        </div>
    )

    if (error && !codigo) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-center card-glass p-8 max-w-md">
                <h1 className="text-2xl font-bold text-white mb-2">Portal de Afiliados</h1>
                <p className="text-gray-400 mb-4">Ingresa tu código de afiliado para acceder.</p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    // Simple redirect logic or state update
                    const formData = new FormData(e.currentTarget);
                    const code = formData.get('code');
                    if (code) window.location.href = `/socio?codigo=${code}`;
                }}>
                    <input name="code" className="input mb-4 w-full" placeholder="Código de Afiliado" />
                    <button type="submit" className="btn btn-primary w-full">Ingresar</button>
                </form>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-center card-glass p-8 max-w-md">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Código no encontrado</h1>
                <p className="text-gray-400 mb-4">{error}</p>
                <a href="/" className="btn btn-primary">Ir al inicio</a>
            </div>
        </div>
    )

    if (!afiliado) return null

    const balancePendiente = afiliado.balance_acumulado - afiliado.balance_pagado
    const ventasTotal = ventas.reduce((a, v) => a + v.total_venta, 0)

    return (
        <div className="min-h-screen bg-gray-950">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-[150px]" />
            </div>

            <header className="relative z-10 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
                                {afiliado.nombre.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">¡Hola, {afiliado.nombre.split(' ')[0]}!</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant="primary">{afiliado.nivel}</Badge>
                                    <span className="text-sm text-gray-400">Comisión: {afiliado.comision_porcentaje}%</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={copyReferralLink} className="btn btn-secondary">
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copiado!' : 'Copiar enlace'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {isDemo && <div className="alert alert-info mb-6"><p className="text-sm">Modo demo. Este es un ejemplo del portal de afiliados.</p></div>}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card-glass p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"><DollarSign className="w-6 h-6 text-emerald-400" /></div>
                            <div><p className="text-2xl font-bold text-emerald-400">${balancePendiente.toFixed(2)}</p><p className="text-sm text-gray-400">Balance disponible</p></div>
                        </div>
                    </div>
                    <div className="card-glass p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
                            <div><p className="text-2xl font-bold text-white">${afiliado.balance_acumulado.toFixed(2)}</p><p className="text-sm text-gray-400">Total ganado</p></div>
                        </div>
                    </div>
                    <div className="card-glass p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-cyan-400" /></div>
                            <div><p className="text-2xl font-bold text-white">{ventas.length}</p><p className="text-sm text-gray-400">Ventas referidas</p></div>
                        </div>
                    </div>
                    <div className="card-glass p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><DollarSign className="w-6 h-6 text-amber-400" /></div>
                            <div><p className="text-2xl font-bold text-white">${ventasTotal.toFixed(2)}</p><p className="text-sm text-gray-400">Total vendido</p></div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Catálogo de Productos</h2>
                    <p className="text-gray-400 mb-4">Comparte estos productos y gana {afiliado.comision_porcentaje}% de comisión por cada venta.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productos.map(producto => (
                            <div key={producto.id} className="card-glass p-6 hover:border-indigo-500/50 transition-all group">
                                <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 flex items-center justify-center">
                                    <ShoppingBag className="w-12 h-12 text-gray-700 group-hover:text-indigo-500/50 transition-colors" />
                                </div>
                                <h3 className="font-semibold text-white mb-1">{producto.nombre}</h3>
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{producto.descripcion || producto.categoria}</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-white">${producto.precio_retail}</p>
                                        <p className="text-xs text-emerald-400">Tu comisión: ${(producto.precio_retail * afiliado.comision_porcentaje / 100).toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => shareProduct(producto)} className="btn btn-primary btn-icon"><Share2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {ventas.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Últimas Ventas</h2>
                        <div className="card-glass overflow-hidden">
                            <table className="table">
                                <thead><tr><th>Fecha</th><th>Venta</th><th>Total</th><th>Tu Comisión</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {ventas.map(venta => (
                                        <tr key={venta.id}>
                                            <td className="text-gray-400">{new Date(venta.fecha).toLocaleDateString()}</td>
                                            <td className="font-mono text-indigo-400">{venta.numero_venta}</td>
                                            <td>${venta.total_venta.toFixed(2)}</td>
                                            <td className="text-emerald-400 font-semibold">${venta.comision_afiliado.toFixed(2)}</td>
                                            <td><Badge variant="success">{venta.estado}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <footer className="relative z-10 border-t border-gray-800 py-6 text-center text-sm text-gray-500">
                © 2026 NEXUS TECH-ADMIN • Portal de Afiliados
            </footer>
        </div>
    )
}

export default function PortalAfiliadoPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PortalAfiliadoContent />
        </Suspense>
    )
}
