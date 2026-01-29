'use client'

import { useState } from 'react'
import { isFirebaseConfigured } from '@/lib/firebase'
import { Alert } from '@/components/ui'
import { Save, Settings, Building2, Percent, Bell, Check, Command, Terminal } from 'lucide-react'

interface Config {
    empresa_nombre: string
    empresa_direccion: string
    empresa_telefono: string
    empresa_email: string
    gastos_operativos_porcentaje: string
    iva_porcentaje: string
    moneda: string
}

const defaultConfig: Config = {
    empresa_nombre: 'NEXUS TECH-ADMIN',
    empresa_direccion: 'Tu dirección aquí',
    empresa_telefono: '+1234567890',
    empresa_email: 'contacto@nexustech.com',
    gastos_operativos_porcentaje: '5',
    iva_porcentaje: '12',
    moneda: 'USD'
}

export default function ConfiguracionPage() {
    const [config, setConfig] = useState<Config>(defaultConfig)
    const [isSaving, setIsSaving] = useState(false)
    const [isDemo] = useState(!isFirebaseConfigured())
    const [saved, setSaved] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        // En una implementación real, guardarías en Firestore
        await new Promise(r => setTimeout(r, 600))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        setIsSaving(false)
    }

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Settings className="text-[var(--neon-purple)] w-8 h-8 animate-[spin_10s_linear_infinite]" />
                        Configuración del Sistema
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Ajustes globales y parámetros de cálculo</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`btn-cyber-primary px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all ${saved ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}`}
                >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    {isSaving ? 'Guardando...' : saved ? '¡Cambios Guardados!' : 'GUARDAR CAMBIOS'}
                </button>
            </header>

            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-blue-400"></div>
                    <span><strong>Modo Demo Activo.</strong> Los cambios en esta sesión no serán permanentes.</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sección Empresa */}
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Building2 className="text-indigo-500/20 w-24 h-24 -rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <Building2 className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Información de la Empresa</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Datos para facturación y reportes</p>
                        </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Nombre Comercial</label>
                            <input type="text" value={config.empresa_nombre} onChange={(e) => setConfig(p => ({ ...p, empresa_nombre: e.target.value }))} className="input-cyber w-full" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Email Corporativo</label>
                            <input type="email" value={config.empresa_email} onChange={(e) => setConfig(p => ({ ...p, empresa_email: e.target.value }))} className="input-cyber w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Teléfono</label>
                                <input type="tel" value={config.empresa_telefono} onChange={(e) => setConfig(p => ({ ...p, empresa_telefono: e.target.value }))} className="input-cyber w-full" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Moneda Base</label>
                                <select value={config.moneda} onChange={(e) => setConfig(p => ({ ...p, moneda: e.target.value }))} className="input-cyber w-full appearance-none">
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="MXN">MXN ($)</option>
                                    <option value="COP">COP ($)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Dirección Fiscal</label>
                            <input type="text" value={config.empresa_direccion} onChange={(e) => setConfig(p => ({ ...p, empresa_direccion: e.target.value }))} className="input-cyber w-full" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Sección Financiera */}
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                <Percent className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Parámetros Financieros</h2>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Cálculos automáticos de utilidad</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Gastos Operativos %</label>
                                <div className="relative">
                                    <input type="number" value={config.gastos_operativos_porcentaje} onChange={(e) => setConfig(p => ({ ...p, gastos_operativos_porcentaje: e.target.value }))} className="input-cyber w-full pr-8 text-right font-mono text-emerald-400" min="0" max="100" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">* Se descuenta de cada venta</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Impuesto (IVA/VAT)</label>
                                <div className="relative">
                                    <input type="number" value={config.iva_porcentaje} onChange={(e) => setConfig(p => ({ ...p, iva_porcentaje: e.target.value }))} className="input-cyber w-full pr-8 text-right font-mono" min="0" max="100" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Notificaciones */}
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <Bell className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Sistema de Alertas</h2>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Notificaciones y Webhooks</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                                    <span className="text-sm font-medium text-gray-200">Alerta de Stock Crítico</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                                    <span className="text-sm font-medium text-gray-200">Notificar Nueva Venta (WhatsApp)</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fórmula de Ganancia - Terminal Style */}
                <div className="glass-panel p-0 rounded-2xl overflow-hidden md:col-span-2 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                    <div className="bg-gray-900/90 p-4 border-b border-white/10 flex items-center gap-3">
                        <Terminal className="text-cyan-400 w-5 h-5" />
                        <span className="text-sm font-mono text-cyan-400 font-bold">system_logic_core.js</span>
                    </div>
                    <div className="p-6 font-mono text-sm space-y-4 bg-black/40 relative">
                        {/* Grid effect background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                        <div className="relative z-10">
                            <p className="text-gray-500 mb-2">// Fórmula para el cálculo automático de utilidad neta</p>
                            <div className="text-gray-300">
                                <span className="text-purple-400">const</span> <span className="text-yellow-300">calcularUtilidad</span> = (<span className="text-blue-300">venta</span>) <span className="text-purple-400">=&gt;</span> {'{'}
                            </div>
                            <div className="pl-6 border-l border-white/10 ml-1 space-y-1">
                                <p>
                                    <span className="text-purple-400">const</span> cost = <span className="text-blue-300">venta</span>.costo_unitario * <span className="text-blue-300">venta</span>.cantidad;
                                </p>
                                <p>
                                    <span className="text-purple-400">const</span> overhead = <span className="text-blue-300">venta</span>.total * (<span className="text-emerald-400">{config.gastos_operativos_porcentaje}</span> / 100); <span className="text-gray-600">// Gasto Op. Configurado</span>
                                </p>
                                <p>
                                    <span className="text-purple-400">const</span> comision = <span className="text-blue-300">venta</span>.afiliado ? <span className="text-blue-300">venta</span>.total * 0.10 : 0;
                                </p>
                                <br />
                                <p>
                                    <span className="text-purple-400">return</span> <span className="text-blue-300">venta</span>.total - cost - overhead - comision;
                                </p>
                            </div>
                            <div className="text-gray-300">{'}'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
