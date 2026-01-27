'use client'

import { useEffect, useState } from 'react'
import { getConfiguracionIA, updateConfiguracionIA, isFirebaseConfigured } from '@/lib/firebase'
import { Bot, Save, Key, Bell, Clock, MessageSquare, Sparkles, AlertCircle } from 'lucide-react'

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
    openai_api_key: ''
}

export default function ConfiguracionIAPage() {
    const [config, setConfig] = useState<ConfiguracionIA>(defaultConfig)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        setIsLoading(true)
        if (isFirebaseConfigured()) {
            const data = await getConfiguracionIA()
            if (data) {
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

    if (isLoading) {
        return (
            <div className="animate-fade-in">
                <header className="page-header">
                    <div>
                        <div className="skeleton" style={{ height: '36px', width: '300px', marginBottom: '12px' }} />
                        <div className="skeleton" style={{ height: '20px', width: '400px' }} />
                    </div>
                </header>
                <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-xl)' }} />
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">Configuración del Agente IA</h1>
                    <p className="page-subtitle">Personaliza el comportamiento del vendedor autónomo</p>
                </div>
                <button
                    className="btn btn--primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>Guardando...</>
                    ) : (
                        <>
                            <Save style={{ width: '18px', height: '18px' }} />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </header>

            {/* Mensaje */}
            {mensaje && (
                <div className={`alert alert--${mensaje.tipo === 'success' ? 'success' : 'danger'}`}>
                    {mensaje.tipo === 'success' ? <Sparkles /> : <AlertCircle />}
                    <div className="alert-content">
                        <div className="alert-message">{mensaje.texto}</div>
                    </div>
                </div>
            )}

            <div className="config-grid">
                {/* Identidad de la Tienda */}
                <section className="card config-section">
                    <div className="config-section-header">
                        <Bot style={{ width: '24px', height: '24px', color: 'var(--color-primary-light)' }} />
                        <h2>Identidad de la Tienda</h2>
                    </div>

                    <div className="form-row">
                        <label className="label">Nombre de la Tienda</label>
                        <input
                            type="text"
                            className="input"
                            value={config.nombre_tienda}
                            onChange={(e) => updateField('nombre_tienda', e.target.value)}
                            placeholder="Ej: Nexus Tech"
                        />
                    </div>

                    <div className="form-row">
                        <label className="label">Tono del Vendedor</label>
                        <select
                            className="input select"
                            value={config.tono_vendedor}
                            onChange={(e) => updateField('tono_vendedor', e.target.value)}
                        >
                            <option value="profesional">Profesional</option>
                            <option value="amigable">Amigable</option>
                            <option value="persuasivo">Persuasivo</option>
                        </select>
                        <p className="form-help">Define la personalidad del agente de ventas</p>
                    </div>
                </section>

                {/* API Key */}
                <section className="card config-section">
                    <div className="config-section-header">
                        <Key style={{ width: '24px', height: '24px', color: 'var(--color-accent-amber)' }} />
                        <h2>OpenAI API Key</h2>
                    </div>

                    <div className="form-row">
                        <label className="label">API Key de OpenAI</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                className="input"
                                value={config.openai_api_key}
                                onChange={(e) => updateField('openai_api_key', e.target.value)}
                                placeholder="sk-..."
                            />
                            <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        <p className="form-help">Obtén tu API Key en platform.openai.com</p>
                    </div>
                </section>

                {/* Mensajes Predefinidos */}
                <section className="card config-section" style={{ gridColumn: '1 / -1' }}>
                    <div className="config-section-header">
                        <MessageSquare style={{ width: '24px', height: '24px', color: 'var(--color-accent-cyan)' }} />
                        <h2>Mensajes Predefinidos</h2>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-row">
                            <label className="label">Mensaje de Bienvenida</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.mensaje_bienvenida}
                                onChange={(e) => updateField('mensaje_bienvenida', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="label">Mensaje Sin Stock</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.mensaje_sin_stock}
                                onChange={(e) => updateField('mensaje_sin_stock', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="label">Mensaje Pago Recibido</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.mensaje_pago_recibido}
                                onChange={(e) => updateField('mensaje_pago_recibido', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="label">Respuesta Fuera de Horario</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.respuesta_fuera_horario}
                                onChange={(e) => updateField('respuesta_fuera_horario', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Prompt del Sistema */}
                <section className="card config-section" style={{ gridColumn: '1 / -1' }}>
                    <div className="config-section-header">
                        <Sparkles style={{ width: '24px', height: '24px', color: 'var(--color-secondary)' }} />
                        <h2>Instrucciones del Agente (Prompt)</h2>
                    </div>

                    <div className="form-row">
                        <label className="label">Prompt del Sistema</label>
                        <textarea
                            className="input"
                            rows={10}
                            value={config.prompt_sistema}
                            onChange={(e) => updateField('prompt_sistema', e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}
                        />
                        <p className="form-help">
                            Estas instrucciones definen cómo se comporta el agente IA. Sé específico sobre el tono, las reglas y el flujo de venta.
                        </p>
                    </div>
                </section>

                {/* Horario de Atención */}
                <section className="card config-section">
                    <div className="config-section-header">
                        <Clock style={{ width: '24px', height: '24px', color: 'var(--color-accent-emerald)' }} />
                        <h2>Horario de Atención</h2>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-row">
                            <label className="label">Hora de Inicio</label>
                            <input
                                type="time"
                                className="input"
                                value={config.horario_atencion.inicio}
                                onChange={(e) => updateField('horario_atencion', { ...config.horario_atencion, inicio: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <label className="label">Hora de Fin</label>
                            <input
                                type="time"
                                className="input"
                                value={config.horario_atencion.fin}
                                onChange={(e) => updateField('horario_atencion', { ...config.horario_atencion, fin: e.target.value })}
                            />
                        </div>
                    </div>
                    <p className="form-help">Fuera de este horario, el agente enviará la respuesta automática configurada.</p>
                </section>

                {/* Notificaciones */}
                <section className="card config-section">
                    <div className="config-section-header">
                        <Bell style={{ width: '24px', height: '24px', color: 'var(--color-accent-rose)' }} />
                        <h2>Notificaciones</h2>
                    </div>

                    <div className="form-row">
                        <label className="label">Email para Notificaciones</label>
                        <input
                            type="email"
                            className="input"
                            value={config.notificar_email}
                            onChange={(e) => updateField('notificar_email', e.target.value)}
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className="form-row">
                        <label className="label">WhatsApp para Notificaciones</label>
                        <input
                            type="tel"
                            className="input"
                            value={config.notificar_whatsapp}
                            onChange={(e) => updateField('notificar_whatsapp', e.target.value)}
                            placeholder="+57 300 123 4567"
                        />
                    </div>
                    <p className="form-help">Recibirás alertas cuando se cierre una venta o haya un problema.</p>
                </section>
            </div>

            <style>{`
                .config-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--space-6);
                }

                .config-section {
                    padding: var(--space-6);
                }

                .config-section-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin-bottom: var(--space-6);
                    padding-bottom: var(--space-4);
                    border-bottom: 1px solid var(--color-border);
                }

                .config-section-header h2 {
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    color: var(--color-text-primary);
                }

                .form-row {
                    margin-bottom: var(--space-5);
                }

                .form-row:last-child {
                    margin-bottom: 0;
                }

                .form-help {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    margin-top: var(--space-2);
                }

                .form-grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--space-5);
                }

                textarea.input {
                    resize: vertical;
                    min-height: 80px;
                }

                @media (max-width: 1024px) {
                    .config-grid {
                        grid-template-columns: 1fr;
                    }

                    .config-section[style*="grid-column"] {
                        grid-column: 1 !important;
                    }

                    .form-grid-2 {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    )
}
