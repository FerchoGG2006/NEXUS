'use client'

import { useEffect, useState } from 'react'
import { getConfiguracionIA, updateConfiguracionIA, isFirebaseConfigured } from '@/lib/firebase'
import { Bot, Save, Key, Bell, Clock, MessageSquare, Sparkles, AlertCircle, BookOpen, Plus, Trash2, HelpCircle, Terminal, Cpu, ShieldCheck } from 'lucide-react'

interface QAItem {
    pregunta: string
    respuesta: string
}

interface ConfiguracionIA {
    nombre_tienda: string
    tono_vendedor: 'profesional' | 'amigable' | 'persuasivo'
    prompt_sistema: string
    mensaje_bienvenida: string
    mensaje_sin_stock: string
    mensaje_pago_recibido: string
    horario_atencion: {
        inicio: string
        fin: string
    }
    respuesta_fuera_horario: string
    notificar_email: string
    notificar_whatsapp: string
    openai_api_key: string
    knowledge_base: QAItem[]
}

const defaultConfig: ConfiguracionIA = {
    nombre_tienda: 'Nexus Tech',
    tono_vendedor: 'profesional',
    prompt_sistema: `Eres el vendedor virtual de Nexus Tech. Tu objetivo es ayudar a los clientes a encontrar el producto perfecto y cerrar la venta.

REGLAS:
1. Sé amable y profesional
2. Responde de forma concisa (2-3 oraciones máximo)
3. Si el cliente muestra interés, guíalo hacia la compra
4. Solicita datos de envío: nombre, dirección, ciudad, teléfono
5. Envía el link de pago cuando tengas los datos
6. Confirma cuando recibas el comprobante de pago`,
    mensaje_bienvenida: '¡Hola! 👋 Soy el asistente de Nexus Tech. ¿En qué puedo ayudarte hoy?',
    mensaje_sin_stock: 'Lo siento, este producto está temporalmente agotado. ¿Te gustaría que te avise cuando esté disponible?',
    mensaje_pago_recibido: '¡Pago recibido! 🎉 Tu pedido será despachado hoy. Recibirás un mensaje con el número de seguimiento.',
    horario_atencion: {
        inicio: '09:00',
        fin: '21:00'
    },
    respuesta_fuera_horario: 'Gracias por tu mensaje. Nuestro horario de atención es de 9am a 9pm. Te responderemos mañana.',
    notificar_email: '',
    notificar_whatsapp: '',
    openai_api_key: '',
    knowledge_base: [
        { pregunta: '¿Tienen tienda física?', respuesta: 'Somos una tienda 100% online, hacemos envíos a todo el país.' },
        { pregunta: '¿Cuánto tarda el envío?', respuesta: 'Los envíos toman de 2 a 4 días hábiles en ciudades principales.' },
        { pregunta: '¿Qué medios de pago aceptan?', respuesta: 'Aceptamos transferencias bancarias, Nequi, Daviplata y tarjetas de crédito.' }
    ]
}

export default function ConfiguracionIAPage() {
    const [config, setConfig] = useState<ConfiguracionIA>(defaultConfig)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

    // Estado local para el formulario de nueva QA
    const [newQA, setNewQA] = useState<QAItem>({ pregunta: '', respuesta: '' })

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        setIsLoading(true)
        if (isFirebaseConfigured()) {
            const data = await getConfiguracionIA()
            if (data) {
                // Merge con default para asegurar que existan los nuevos campos como knowledge_base
                setConfig({ ...defaultConfig, ...data } as ConfiguracionIA)
            }
        }
        setIsLoading(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMensaje(null)

        try {
            if (isFirebaseConfigured()) {
                await updateConfiguracionIA(config)
            }
            setMensaje({ tipo: 'success', texto: 'Configuración guardada exitosamente' })
        } catch (error) {
            setMensaje({ tipo: 'error', texto: 'Error al guardar la configuración' })
        }

        setIsSaving(false)
        setTimeout(() => setMensaje(null), 3000)
    }

    const updateField = (field: keyof ConfiguracionIA, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }))
    }

    const handleAddQA = () => {
        if (!newQA.pregunta.trim() || !newQA.respuesta.trim()) return
        setConfig(prev => ({
            ...prev,
            knowledge_base: [...(prev.knowledge_base || []), newQA]
        }))
        setNewQA({ pregunta: '', respuesta: '' })
    }

    const handleDeleteQA = (index: number) => {
        setConfig(prev => ({
            ...prev,
            knowledge_base: prev.knowledge_base.filter((_, i) => i !== index)
        }))
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-20 bg-white/5 rounded-xl w-full"></div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="h-64 bg-white/5 rounded-xl"></div>
                    <div className="h-64 bg-white/5 rounded-xl"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Page Header */}
            <header className="flex justify-between items-center border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Cpu className="text-[var(--neon-purple)] w-8 h-8 animate-pulse-slow" />
                        Configuración Neural
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Calibración de parámetros del Agente Autónomo</p>
                </div>
                <button
                    className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>Guardando...</>
                    ) : (
                        <>
                            <Save size={18} />
                            GUARDAR PARÁMETROS
                        </>
                    )}
                </button>
            </header>

            {/* Mensaje */}
            {mensaje && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${mensaje.tipo === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {mensaje.tipo === 'success' ? <Sparkles size={20} /> : <AlertCircle size={20} />}
                    <div className="font-medium">{mensaje.texto}</div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Identidad de la Tienda */}
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-purple)]/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <Bot className="text-[var(--neon-purple)]" size={24} />
                        <h2 className="text-xl font-bold text-white">Identidad Digital</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Nombre de la Tienda</label>
                            <input
                                type="text"
                                className="input-cyber w-full"
                                value={config.nombre_tienda}
                                onChange={(e) => updateField('nombre_tienda', e.target.value)}
                                placeholder="Ej: Nexus Tech"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Tono del Vendedor</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['profesional', 'amigable', 'persuasivo'].map((tono) => (
                                    <button
                                        key={tono}
                                        onClick={() => updateField('tono_vendedor', tono)}
                                        className={`px-3 py-2 rounded-lg border text-sm capitalize transition-all ${config.tono_vendedor === tono
                                                ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                                : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/30'
                                            }`}
                                    >
                                        {tono}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Key */}
                <section className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-green)]/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <Key className="text-[var(--neon-green)]" size={24} />
                        <h2 className="text-xl font-bold text-white">Credenciales API</h2>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">OpenAI API Key (GPT-4o)</label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                className="input-cyber w-full pr-24 font-mono text-[var(--neon-green)]"
                                value={config.openai_api_key}
                                onChange={(e) => updateField('openai_api_key', e.target.value)}
                                placeholder="sk-..."
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300 transition-colors"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? 'OCULTAR' : 'MOSTRAR'}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                            <ShieldCheck size={12} /> Tus llaves están encriptadas en local.
                        </p>
                    </div>
                </section>

                {/* Prompt del Sistema */}
                <section className="glass-panel p-6 rounded-2xl lg:col-span-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <Terminal className="text-blue-400" size={24} />
                        <h2 className="text-xl font-bold text-white">System Prompt (Núcleo)</h2>
                    </div>

                    <div className="space-y-2">
                        <div className="bg-black/80 rounded-t-lg p-2 flex gap-2 items-center border border-white/10 border-b-0">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <span className="text-xs text-gray-500 font-mono ml-2">system_config.yaml</span>
                        </div>
                        <textarea
                            className="w-full bg-black/50 border border-white/10 rounded-b-lg p-4 font-mono text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[300px]"
                            value={config.prompt_sistema}
                            onChange={(e) => updateField('prompt_sistema', e.target.value)}
                            spellCheck={false}
                        />
                        <p className="text-xs text-gray-500">
                            Define las reglas "hard-coded" del comportamiento de la IA. Instrucciones claras generan mejores resultados.
                        </p>
                    </div>
                </section>

                {/* Base de Conocimiento (NUEVO) */}
                <section className="glass-panel p-6 rounded-2xl lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <BookOpen className="text-[var(--neon-cyan)]" size={24} />
                        <h2 className="text-xl font-bold text-white">Base de Conocimiento (RAG Light)</h2>
                    </div>

                    <p className="text-sm text-gray-400 mb-6 bg-[var(--neon-cyan)]/5 p-3 rounded-lg border border-[var(--neon-cyan)]/20">
                        Enséñale a tu IA sobre políticas, envíos y garantías. Estas respuestas tendrán prioridad sobre el conocimiento general (LLM).
                    </p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {config.knowledge_base?.map((qa, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[var(--neon-cyan)]/30 transition-colors group relative">
                                    <div className="flex items-start gap-3">
                                        <HelpCircle className="text-[var(--neon-cyan)] mt-1 flex-shrink-0" size={16} />
                                        <div>
                                            <p className="font-bold text-white text-sm mb-1">{qa.pregunta}</p>
                                            <p className="text-gray-400 text-xs leading-relaxed">{qa.respuesta}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => handleDeleteQA(index)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {(!config.knowledge_base || config.knowledge_base.length === 0) && (
                                <div className="text-center py-8 text-gray-500 italic col-span-2 border border-dashed border-white/10 rounded-xl">
                                    No hay conocimiento experto configurado.
                                </div>
                            )}
                        </div>

                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex-1 w-full space-y-1">
                                <label className="text-[10px] text-gray-500 uppercase">Nueva Pregunta</label>
                                <input
                                    type="text"
                                    className="input-cyber w-full text-sm"
                                    placeholder="¿Tienen garantía?"
                                    value={newQA.pregunta}
                                    onChange={e => setNewQA(prev => ({ ...prev, pregunta: e.target.value }))}
                                />
                            </div>
                            <div className="flex-[2] w-full space-y-1">
                                <label className="text-[10px] text-gray-500 uppercase">Respuesta Esperada</label>
                                <input
                                    type="text"
                                    className="input-cyber w-full text-sm"
                                    placeholder="Sí, de 1 año por defectos de fábrica..."
                                    value={newQA.respuesta}
                                    onChange={e => setNewQA(prev => ({ ...prev, respuesta: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAddQA()}
                                />
                            </div>
                            <button
                                className="btn-cyber-primary p-2.5 rounded-lg flex-shrink-0"
                                onClick={handleAddQA}
                                disabled={!newQA.pregunta || !newQA.respuesta}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Mensajes Predefinidos */}
                <section className="glass-panel p-6 rounded-2xl lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <MessageSquare className="text-pink-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Respuestas Automáticas</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Bienvenida</label>
                            <textarea
                                className="input-cyber w-full min-h-[80px]"
                                value={config.mensaje_bienvenida}
                                onChange={(e) => updateField('mensaje_bienvenida', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Sin Stock</label>
                            <textarea
                                className="input-cyber w-full min-h-[80px]"
                                value={config.mensaje_sin_stock}
                                onChange={(e) => updateField('mensaje_sin_stock', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Pago Recibido</label>
                            <textarea
                                className="input-cyber w-full min-h-[80px]"
                                value={config.mensaje_pago_recibido}
                                onChange={(e) => updateField('mensaje_pago_recibido', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Fuera de Horario</label>
                            <textarea
                                className="input-cyber w-full min-h-[80px]"
                                value={config.respuesta_fuera_horario}
                                onChange={(e) => updateField('respuesta_fuera_horario', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Horario y Notificaciones */}
                <section className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <Clock className="text-orange-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Horario Activo</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Inicio</label>
                            <input
                                type="time"
                                className="input-cyber w-full"
                                value={config.horario_atencion.inicio}
                                onChange={(e) => updateField('horario_atencion', { ...config.horario_atencion, inicio: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Fin</label>
                            <input
                                type="time"
                                className="input-cyber w-full"
                                value={config.horario_atencion.fin}
                                onChange={(e) => updateField('horario_atencion', { ...config.horario_atencion, fin: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <Bell className="text-red-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Alertas Humanas</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Email Reportes</label>
                            <input
                                type="email"
                                className="input-cyber w-full"
                                value={config.notificar_email}
                                onChange={(e) => updateField('notificar_email', e.target.value)}
                                placeholder="admin@nexus.tech"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">WhatsApp Alertas</label>
                            <input
                                type="tel"
                                className="input-cyber w-full"
                                value={config.notificar_whatsapp}
                                onChange={(e) => updateField('notificar_whatsapp', e.target.value)}
                                placeholder="+57 300..."
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
