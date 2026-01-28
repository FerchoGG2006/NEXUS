'use client'

import { useEffect, useState } from 'react'
import { getConfiguracionIA, updateConfiguracionIA, isFirebaseConfigured } from '@/lib/firebase'
import { Bot, Save, Key, Bell, Clock, MessageSquare, Sparkles, AlertCircle, BookOpen, Plus, Trash2, HelpCircle } from 'lucide-react'

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
                        <p className="form-help">Tu agente funciona con GPT-4o. Pega tu key aquí.</p>
                    </div>
                </section>

                {/* Base de Conocimiento (NUEVO) */}
                <section className="card config-section full-width">
                    <div className="config-section-header">
                        <BookOpen style={{ width: '24px', height: '24px', color: 'var(--color-accent-violet)' }} />
                        <h2>Base de Conocimiento IA</h2>
                    </div>

                    <p className="section-description">
                        Enséñale a tu IA sobre políticas, envíos y garantías. Estas respuestas tendrán prioridad sobre el conocimiento general.
                    </p>

                    <div className="qa-container">
                        <div className="qa-list">
                            {config.knowledge_base?.map((qa, index) => (
                                <div key={index} className="qa-item">
                                    <div className="qa-content">
                                        <div className="qa-question">
                                            <HelpCircle size={16} /> <span>{qa.pregunta}</span>
                                        </div>
                                        <div className="qa-answer">{qa.respuesta}</div>
                                    </div>
                                    <button
                                        className="btn btn--ghost btn--icon delete-qa"
                                        onClick={() => handleDeleteQA(index)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(!config.knowledge_base || config.knowledge_base.length === 0) && (
                                <div className="qa-empty">No hay preguntas frecuentes configuradas.</div>
                            )}
                        </div>

                        <div className="qa-form">
                            <input
                                type="text"
                                className="input"
                                placeholder="Pregunta (ej: ¿Tienen garantía?)"
                                value={newQA.pregunta}
                                onChange={e => setNewQA(prev => ({ ...prev, pregunta: e.target.value }))}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="Respuesta de la IA"
                                value={newQA.respuesta}
                                onChange={e => setNewQA(prev => ({ ...prev, respuesta: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddQA()}
                            />
                            <button
                                className="btn btn--secondary"
                                onClick={handleAddQA}
                                disabled={!newQA.pregunta || !newQA.respuesta}
                            >
                                <Plus size={18} /> Agregar
                            </button>
                        </div>
                    </div>
                </section>

                {/* Prompt del Sistema */}
                <section className="card config-section full-width">
                    <div className="config-section-header">
                        <Sparkles style={{ width: '24px', height: '24px', color: 'var(--color-secondary)' }} />
                        <h2>Instrucciones Avanzadas (Prompt)</h2>
                    </div>

                    <div className="form-row">
                        <label className="label">System Prompt</label>
                        <textarea
                            className="input"
                            rows={10}
                            value={config.prompt_sistema}
                            onChange={(e) => updateField('prompt_sistema', e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}
                        />
                        <p className="form-help">
                            Define reglas estrictas, personalidad y límites del agente.
                        </p>
                    </div>
                </section>

                {/* Mensajes Predefinidos */}
                <section className="card config-section full-width">
                    <div className="config-section-header">
                        <MessageSquare style={{ width: '24px', height: '24px', color: 'var(--color-accent-cyan)' }} />
                        <h2>Respuestas Automáticas</h2>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-row">
                            <label className="label">Bienvenida</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.mensaje_bienvenida}
                                onChange={(e) => updateField('mensaje_bienvenida', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="label">Sin Stock</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.mensaje_sin_stock}
                                onChange={(e) => updateField('mensaje_sin_stock', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="label">Pago Recibido</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.mensaje_pago_recibido}
                                onChange={(e) => updateField('mensaje_pago_recibido', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label className="label">Fuera de Horario</label>
                            <textarea
                                className="input"
                                rows={3}
                                value={config.respuesta_fuera_horario}
                                onChange={(e) => updateField('respuesta_fuera_horario', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Horario y Notificaciones (En grid de 2 columnas) */}
                <section className="card config-section">
                    <div className="config-section-header">
                        <Clock style={{ width: '24px', height: '24px', color: 'var(--color-accent-emerald)' }} />
                        <h2>Horario de Atención</h2>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-row">
                            <label className="label">Inicio</label>
                            <input
                                type="time"
                                className="input"
                                value={config.horario_atencion.inicio}
                                onChange={(e) => updateField('horario_atencion', { ...config.horario_atencion, inicio: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <label className="label">Fin</label>
                            <input
                                type="time"
                                className="input"
                                value={config.horario_atencion.fin}
                                onChange={(e) => updateField('horario_atencion', { ...config.horario_atencion, fin: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className="card config-section">
                    <div className="config-section-header">
                        <Bell style={{ width: '24px', height: '24px', color: 'var(--color-accent-rose)' }} />
                        <h2>Alertas</h2>
                    </div>

                    <div className="form-row">
                        <label className="label">Email Reportes</label>
                        <input
                            type="email"
                            className="input"
                            value={config.notificar_email}
                            onChange={(e) => updateField('notificar_email', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label className="label">WhatsApp Alertas</label>
                        <input
                            type="tel"
                            className="input"
                            value={config.notificar_whatsapp}
                            onChange={(e) => updateField('notificar_whatsapp', e.target.value)}
                        />
                    </div>
                </section>
            </div>

            <style jsx>{`
                .config-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--space-6);
                }

                .config-section {
                    padding: var(--space-6);
                    display: flex;
                    flex-direction: column;
                }
                
                .config-section.full-width {
                    grid-column: 1 / -1;
                }

                .config-section-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin-bottom: var(--space-4);
                    padding-bottom: var(--space-4);
                    border-bottom: 1px solid var(--color-border);
                }

                .config-section-header h2 {
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    color: var(--color-text-primary);
                }

                .section-description {
                    font-size: var(--font-size-sm);
                    color: var(--color-text-muted);
                    margin-bottom: var(--space-4);
                }

                .form-row {
                    margin-bottom: var(--space-5);
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

                /* QA Styles */
                .qa-container {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                }

                .qa-list {
                    background: var(--color-bg-tertiary);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                }

                .qa-item {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    padding: var(--space-3) var(--space-4);
                    border-bottom: 1px solid var(--color-border);
                    gap: var(--space-4);
                }

                .qa-item:last-child {
                    border-bottom: none;
                }

                .qa-content {
                    flex: 1;
                }

                .qa-question {
                    font-weight: 600;
                    color: var(--color-text-primary);
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .qa-question svg {
                     color: var(--color-accent-violet);
                }

                .qa-answer {
                    font-size: var(--font-size-sm);
                    color: var(--color-text-secondary);
                }
                
                .delete-qa {
                    color: var(--color-text-muted);
                }
                .delete-qa:hover {
                    color: var(--color-danger);
                    background: rgba(239, 68, 68, 0.1);
                }

                .qa-form {
                    display: grid;
                    grid-template-columns: 1fr 1fr auto;
                    gap: var(--space-3);
                    align-items: center;
                    background: rgba(255,255,255,0.02);
                    padding: var(--space-4);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                }

                .qa-empty {
                    padding: var(--space-4);
                    text-align: center;
                    color: var(--color-text-muted);
                    font-style: italic;
                }


                @media (max-width: 1024px) {
                    .config-grid {
                        grid-template-columns: 1fr;
                    }
                    .config-section.full-width {
                         grid-column: 1;
                    }
                    .qa-form {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    )
}
