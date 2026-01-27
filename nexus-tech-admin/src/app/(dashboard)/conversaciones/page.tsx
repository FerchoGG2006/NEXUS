'use client'

import { useEffect, useState } from 'react'
import { subscribeToConversaciones, isFirebaseConfigured } from '@/lib/firebase'
import { MessageSquare, User, Clock, CheckCircle, AlertCircle, Send, Bot, ShoppingBag, Zap } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { SalesSimulator } from '@/components/SalesSimulator'

interface MensajeChat {
    rol: 'cliente' | 'ia' | 'sistema'
    contenido: string
    timestamp: string
}

interface Conversacion {
    id: string
    cliente_nombre: string
    cliente_telefono: string
    plataforma: string
    producto_nombre: string
    estado: 'activa' | 'negociando' | 'esperando_pago' | 'cerrada' | 'abandonada'
    historial_chat: MensajeChat[]
    pago_confirmado: boolean
    updated_at: string
    created_at: string
}

// Mover demoConversaciones a una función generadora para asegurar timestamps frescos en el cliente
const getDemoConversaciones = (): Conversacion[] => [
    {
        id: '1',
        cliente_nombre: 'María García',
        cliente_telefono: '+57 300 123 4567',
        plataforma: 'whatsapp',
        producto_nombre: 'iPhone 15 Pro Case',
        estado: 'negociando',
        historial_chat: [
            { rol: 'cliente', contenido: 'Hola, vi el case para iPhone 15 Pro, ¿está disponible?', timestamp: new Date(Date.now() - 300000).toISOString() },
            { rol: 'ia', contenido: '¡Hola María! 👋 Sí, tenemos el iPhone 15 Pro Case disponible. Es de silicona premium con protección militar. ¿Te gustaría más información?', timestamp: new Date(Date.now() - 290000).toISOString() },
            { rol: 'cliente', contenido: 'Sí, ¿cuánto cuesta y hacen envíos a Medellín?', timestamp: new Date(Date.now() - 200000).toISOString() },
            { rol: 'ia', contenido: 'El precio es $29.99 USD. Sí, hacemos envíos a todo Colombia. El envío a Medellín es gratis por compras mayores a $25. ¿Quieres que te envíe el link de pago?', timestamp: new Date(Date.now() - 190000).toISOString() },
        ],
        pago_confirmado: false,
        updated_at: new Date(Date.now() - 190000).toISOString(),
        created_at: new Date(Date.now() - 300000).toISOString()
    }
]

const estadoConfig: any = {
    activa: { label: 'Activa', className: 'badge badge--info', icon: MessageSquare },
    negociando: { label: 'Negociando', className: 'badge badge--warning', icon: ShoppingBag },
    esperando_pago: { label: 'Esperando Pago', className: 'badge badge--primary', icon: Clock },
    cerrada: { label: 'Cerrada', className: 'badge badge--success', icon: CheckCircle },
    abandonada: { label: 'Abandonada', className: 'badge badge--danger', icon: AlertCircle }
}

const plataformaConfig: Record<string, { emoji: string; color: string }> = {
    whatsapp: { emoji: '💬', color: '#25D366' },
    facebook: { emoji: '📘', color: '#1877F2' },
    instagram: { emoji: '📸', color: '#E4405F' },
    web: { emoji: '🌐', color: '#6366f1' }
}

export default function ConversacionesPage() {
    // Inicializar vacío para evitar hydration mismatch con fechas
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
    const [selectedChat, setSelectedChat] = useState<Conversacion | null>(null)
    const [isDemo, setIsDemo] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState<string>('todas')
    const [isLoading, setIsLoading] = useState(true)
    const [showSimulator, setShowSimulator] = useState(false)

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setIsDemo(true)
            const demos = getDemoConversaciones()
            setConversaciones(demos)
            setSelectedChat(demos[0])
            setIsLoading(false)
            return
        }

        setIsDemo(false)
        const unsubscribe = subscribeToConversaciones((data) => {
            setConversaciones(data as Conversacion[])
            // Mantener seleccionado o seleccionar el primero
            if (!selectedChat && data.length > 0) {
                setSelectedChat(data[0] as Conversacion)
            } else if (selectedChat) {
                // Actualizar info del chat seleccionado si cambia
                const updated = data.find((c: Conversacion) => c.id === selectedChat.id)
                if (updated) setSelectedChat(updated as Conversacion)
            }
            setIsLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const conversacionesFiltradas = filtroEstado === 'todas'
        ? conversaciones
        : conversaciones.filter(c => c.estado === filtroEstado)

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <Bot style={{ width: '32px', height: '32px', color: 'var(--color-primary-light)' }} />
                        Conversaciones IA
                    </h1>
                    <p className="page-subtitle">Monitorea cómo tu agente cierra ventas en tiempo real</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn--primary"
                        onClick={() => setShowSimulator(true)}
                    >
                        <Zap style={{ width: '18px', height: '18px' }} />
                        Simular Cliente
                    </button>
                    <select
                        className="input select"
                        style={{ width: 'auto' }}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todas">Todas</option>
                        <option value="activa">Activas</option>
                        <option value="negociando">Negociando</option>
                        <option value="esperando_pago">Esperando Pago</option>
                        <option value="cerrada">Cerradas</option>
                    </select>
                </div>
            </header>

            {/* Simulator Modal */}
            {showSimulator && <SalesSimulator onClose={() => setShowSimulator(false)} />}

            {/* Demo Alert */}
            {isDemo && (
                <div className="alert alert--info">
                    <Bot style={{ width: '20px', height: '20px' }} />
                    <div className="alert-content">
                        <div className="alert-message">
                            <strong>Modo demo.</strong> Conecta Firebase y OpenAI para activar el agente.
                        </div>
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className="conversations-layout">
                {/* Lista de conversaciones */}
                <aside className="conversations-list">
                    <div className="conversations-list-header">
                        <h3>{conversacionesFiltradas.length} conversaciones</h3>
                    </div>
                    <div className="conversations-list-items">
                        {conversacionesFiltradas.map(conv => {
                            const estadoCfg = estadoConfig[conv.estado] || estadoConfig.activa
                            const plataformaCfg = plataformaConfig[conv.plataforma] || plataformaConfig.web
                            const isSelected = selectedChat?.id === conv.id

                            return (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => setSelectedChat(conv)}
                                >
                                    <div className="conversation-item-header">
                                        <span className="conversation-platform" style={{ color: plataformaCfg.color }}>
                                            {plataformaCfg.emoji}
                                        </span>
                                        <span className="conversation-client">{conv.cliente_nombre}</span>
                                        <span className={estadoCfg.className}>{estadoCfg.label.split(' ')[0]}</span>
                                    </div>
                                    <p className="conversation-product">{conv.producto_nombre}</p>
                                    <p className="conversation-preview">
                                        {conv.historial_chat[conv.historial_chat.length - 1]?.contenido.slice(0, 40)}...
                                    </p>
                                    <span className="conversation-time">
                                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </aside>

                {/* Chat Area */}
                <div className="card chat-area">
                    {selectedChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-user-info">
                                    <span className="chat-avatar">
                                        <User />
                                    </span>
                                    <div>
                                        <h3 className="chat-username">{selectedChat.cliente_nombre}</h3>
                                        <span className="chat-product-hint">
                                            Interesado en: {selectedChat.producto_nombre}
                                        </span>
                                    </div>
                                </div>
                                <div className={`badge ${estadoConfig[selectedChat.estado]?.className || 'badge--info'}`}>
                                    {estadoConfig[selectedChat.estado]?.icon && (
                                        <span style={{ marginRight: '6px' }}>
                                            {(() => {
                                                const Icon = estadoConfig[selectedChat.estado].icon;
                                                return <Icon size={14} />;
                                            })()}
                                        </span>
                                    )}
                                    {estadoConfig[selectedChat.estado]?.label || selectedChat.estado}
                                </div>
                            </div>

                            <div className="chat-messages">
                                {selectedChat.historial_chat.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`message ${msg.rol === 'cliente' ? 'message--client' : 'message--ia'}`}
                                    >
                                        <div className="message-content">
                                            {msg.rol === 'ia' && (
                                                <div className="message-bot-icon">
                                                    <Bot size={14} />
                                                </div>
                                            )}
                                            <p>{msg.contenido}</p>
                                        </div>
                                        <span className="message-time">
                                            {format(new Date(msg.timestamp), 'HH:mm')}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input-area">
                                <input
                                    type="text"
                                    className="input chat-input"
                                    placeholder="La IA responde automáticamente..."
                                    disabled
                                />
                            </div>
                        </>
                    ) : (
                        <div className="chat-empty-state">
                            <MessageSquare size={48} style={{ opacity: 0.2 }} />
                            <p>Selecciona una conversación</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .conversations-layout {
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: var(--space-6);
                    height: calc(100vh - 200px);
                    min-height: 500px;
                }

                .conversations-list {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .conversations-list-header {
                    padding: var(--space-5) var(--space-6);
                    border-bottom: 1px solid var(--color-border);
                    background: rgba(0,0,0,0.2);
                }

                .conversations-list-header h3 {
                    font-size: var(--font-size-sm);
                    color: var(--color-text-muted);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .conversations-list-items {
                    flex: 1;
                    overflow-y: auto;
                }

                .conversation-item {
                    padding: var(--space-5) var(--space-6);
                    border-bottom: 1px solid var(--color-border);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    position: relative;
                }

                .conversation-item:hover {
                    background: rgba(99, 102, 241, 0.05);
                }

                .conversation-item.active {
                    background: rgba(99, 102, 241, 0.1);
                }
                
                .conversation-item.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--color-primary);
                }

                .conversation-item-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin-bottom: var(--space-1);
                }

                .conversation-platform {
                    font-size: 1.1em;
                }

                .conversation-client {
                    font-weight: 600;
                    color: var(--color-text-primary);
                    flex: 1;
                    font-size: var(--font-size-sm);
                }

                .conversation-product {
                    font-size: var(--font-size-xs);
                    color: var(--color-primary-light);
                    margin-bottom: var(--space-2);
                    font-weight: 500;
                }

                .conversation-preview {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    margin-bottom: var(--space-2);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .conversation-time {
                    font-size: 10px;
                    color: var(--color-text-disabled);
                    text-transform: uppercase;
                }

                .chat-area {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding: 0 !important;
                }

                .chat-header {
                    padding: var(--space-5) var(--space-6);
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(0,0,0,0.2);
                }

                .chat-user-info {
                    display: flex;
                    align-items: center;
                    gap: var(--space-4);
                }

                .chat-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--color-bg-tertiary);
                    border-radius: var(--radius-full);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-secondary);
                }

                .chat-username {
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    color: var(--color-text-primary);
                }

                .chat-product-hint {
                    display: block;
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--space-6);
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                }

                .message {
                    display: flex;
                    flex-direction: column;
                    max-width: 75%;
                }

                .message--client {
                    align-self: flex-end;
                    align-items: flex-end;
                }

                .message--ia {
                    align-self: flex-start;
                    align-items: flex-start;
                }

                .message-content {
                    padding: var(--space-3) var(--space-5);
                    border-radius: var(--radius-xl);
                    position: relative;
                }

                .message--client .message-content {
                    background: var(--color-primary);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message--ia .message-content {
                    background: var(--color-bg-tertiary);
                    color: var(--color-text-primary);
                    border-bottom-left-radius: 4px;
                    padding-left: 42px; /* Espacio para icono IA */
                }

                .message-bot-icon {
                    position: absolute;
                    left: 12px;
                    top: 12px;
                    color: var(--color-accent-cyan);
                }

                .message-time {
                    font-size: 10px;
                    color: var(--color-text-disabled);
                    margin-top: 4px;
                    padding: 0 4px;
                }

                .chat-input-area {
                    padding: var(--space-5) var(--space-6);
                    border-top: 1px solid var(--color-border);
                    background: rgba(0,0,0,0.1);
                }

                .chat-empty-state {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-muted);
                    gap: var(--space-4);
                }

                @media (max-width: 1024px) {
                    .conversations-layout {
                        grid-template-columns: 1fr;
                    }
                    .conversations-list {
                        display: none; /* En móvil solo mostramos chat o lista, simplificado para ahora */
                    }
                    .conversations-list.mobile-visible {
                        display: flex;
                    }
                }
            `}</style>
        </div>
    )
}
