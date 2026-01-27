'use client'

import { useState } from 'react'
import { isFirebaseConfigured } from '@/lib/firebase'
import { Alert } from '@/components/ui'
import { Save, Settings, Building2, Percent, Bell } from 'lucide-react'

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
        await new Promise(r => setTimeout(r, 500))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        setIsSaving(false)
    }

    return (
        <div className="animate-fade-in max-w-4xl">
            <div className="header">
                <div><h1 className="header-title">Configuración</h1><p className="header-subtitle">Ajustes del sistema</p></div>
                <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
                    <Save className="w-4 h-4" />{isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

            {isDemo && <Alert type="info" message="Modo demo activo" className="mb-6" />}
            {saved && <Alert type="success" message="Configuración guardada correctamente" className="mb-6" />}

            <div className="space-y-6">
                <div className="card-glass p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Información de la Empresa</h2>
                            <p className="text-sm text-gray-400">Datos que aparecerán en documentos</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Nombre de la empresa</label><input type="text" value={config.empresa_nombre} onChange={(e) => setConfig(p => ({ ...p, empresa_nombre: e.target.value }))} className="input" /></div>
                        <div><label className="label">Email de contacto</label><input type="email" value={config.empresa_email} onChange={(e) => setConfig(p => ({ ...p, empresa_email: e.target.value }))} className="input" /></div>
                        <div><label className="label">Teléfono</label><input type="tel" value={config.empresa_telefono} onChange={(e) => setConfig(p => ({ ...p, empresa_telefono: e.target.value }))} className="input" /></div>
                        <div><label className="label">Dirección</label><input type="text" value={config.empresa_direccion} onChange={(e) => setConfig(p => ({ ...p, empresa_direccion: e.target.value }))} className="input" /></div>
                    </div>
                </div>

                <div className="card-glass p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Percent className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Configuración Financiera</h2>
                            <p className="text-sm text-gray-400">Porcentajes y cálculos automáticos</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="label">Gastos operativos (%)</label><input type="number" value={config.gastos_operativos_porcentaje} onChange={(e) => setConfig(p => ({ ...p, gastos_operativos_porcentaje: e.target.value }))} className="input" min="0" max="100" /><p className="text-xs text-gray-500 mt-1">Se descuenta de cada venta</p></div>
                        <div><label className="label">IVA (%)</label><input type="number" value={config.iva_porcentaje} onChange={(e) => setConfig(p => ({ ...p, iva_porcentaje: e.target.value }))} className="input" min="0" max="100" /></div>
                        <div><label className="label">Moneda</label><select value={config.moneda} onChange={(e) => setConfig(p => ({ ...p, moneda: e.target.value }))} className="input select"><option value="USD">USD - Dólar</option><option value="EUR">EUR - Euro</option><option value="MXN">MXN - Peso Mexicano</option><option value="COP">COP - Peso Colombiano</option></select></div>
                    </div>
                </div>

                <div className="card-glass p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Fórmula de Ganancia Neta</h2>
                            <p className="text-sm text-gray-400">Cálculo automático de utilidad</p>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg font-mono text-sm">
                        <p className="text-emerald-400 mb-2">GananciaNeta = TotalVenta - CostoCompra - ComisiónAfiliado - GastosOperativos</p>
                        <div className="text-gray-400 space-y-1">
                            <p>• <span className="text-white">TotalVenta</span>: Precio de venta × Cantidad - Descuentos</p>
                            <p>• <span className="text-white">CostoCompra</span>: Costo unitario × Cantidad</p>
                            <p>• <span className="text-white">ComisiónAfiliado</span>: TotalVenta × % del afiliado (si aplica)</p>
                            <p>• <span className="text-white">GastosOperativos</span>: TotalVenta × {config.gastos_operativos_porcentaje}%</p>
                        </div>
                    </div>
                </div>

                <div className="card-glass p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
                            <p className="text-sm text-gray-400">Alertas y webhooks</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                            <div><p className="font-medium text-white">Alertas de stock bajo</p><p className="text-sm text-gray-400">Notifica cuando un producto está bajo el mínimo</p></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                            <div><p className="font-medium text-white">WhatsApp en nuevas ventas</p><p className="text-sm text-gray-400">Envía mensaje por cada venta completada</p></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
