'use client'

import { useEffect, useState } from 'react'
import { subscribeToConversaciones, isFirebaseConfigured } from '@/lib/firebase'
import { MessageSquare, User, Clock, CheckCircle, AlertCircle, Zap, Bot, ShoppingBag, Search, Filter } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { SalesSimulator } from '@/components/SalesSimulator'

interface MensajeChat {
    rol: 'cliente' | 'ia' | 'sistema'
    tipo?: 'texto' | 'imagen'
    url?: string
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

// Demo Data
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
            { rol: 'cliente', tipo: 'imagen', url: 'https://images.unsplash.com/photo-1603313011101-320f721612d9?w=300&q=80', contenido: 'Me refiero a este modelo en específico.', timestamp: new Date(Date.now() - 295000).toISOString() },
            { rol: 'ia', contenido: '¡Hola María! 👋 Sí, tenemos ese modelo exacto en stock. Es el Titan Grey. ¿Te gustaría proceder con la compra?', timestamp: new Date(Date.now() - 290000).toISOString() },
            { rol: 'cliente', contenido: 'Sí, ¿cuánto cuesta y hacen envíos a Medellín?', timestamp: new Date(Date.now() - 200000).toISOString() },
            { rol: 'ia', contenido: 'El precio es $29.99 USD. Sí, hacemos envíos a todo Colombia. El envío a Medellín es gratis por compras mayores a $25. ¿Quieres que te envíe el link de pago?', timestamp: new Date(Date.now() - 190000).toISOString() },
        ],
        pago_confirmado: false,
        updated_at: new Date(Date.now() - 190000).toISOString(),
        created_at: new Date(Date.now() - 300000).toISOString()
    }
]

const estadoConfig: any = {
    activa: { label: 'Activa', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', icon: MessageSquare },
    negociando: { label: 'Negociando', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: ShoppingBag },
    esperando_pago: { label: 'Esperando Pago', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: Clock },
    cerrada: { label: 'Cerrada', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', icon: CheckCircle },
    abandonada: { label: 'Abandonada', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', icon: AlertCircle }
}

const plataformaConfig: Record<string, { emoji: string; color: string }> = {
    whatsapp: { emoji: '💬', color: '#25D366' },
    facebook: { emoji: '📘', color: '#1877F2' },
    instagram: { emoji: '📸', color: '#E4405F' },
    web: { emoji: '🌐', color: '#6366f1' }
}

export default function ConversacionesPage() {
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
            if (!selectedChat && data.length > 0) {
                setSelectedChat(data[0] as Conversacion)
            } else if (selectedChat) {
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
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Bot className="text-[var(--neon-cyan)] w-8 h-8" />
                        Conversaciones Neurales
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Interacciones en tiempo real del Agente IA</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-white transition-colors" size={16} />
                        <select
                            className="pl-10 pr-8 py-2 bg-black/40 border border-[var(--glass-border)] rounded-lg text-sm text-white focus:border-[var(--neon-cyan)] outline-none appearance-none cursor-pointer"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todas">Todos los estados</option>
                            <option value="activa">Activas</option>
                            <option value="negociando">Negociando</option>
                            <option value="esperando_pago">Esperando Pago</option>
                            <option value="cerrada">Cerradas</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowSimulator(true)}
                        className="btn-cyber-primary px-6 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-transform hover:scale-105"
                    >
                        <Zap size={18} />
                        <span>Simular Cliente</span>
                    </button>
                </div>
            </header>

            {showSimulator && <SalesSimulator onClose={() => setShowSimulator(false)} />}

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">

                {/* Lista de Chats (Izquierda) */}
                <div className="col-span-4 glass-panel rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-[var(--glass-border)] bg-black/20 flex items-center justify-between">
                        <h3 className="tex-sm font-BOLD text-gray-300 tracking-wider">BANDEJA DE ENTRADA</h3>
                        <span className="text-xs bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] px-2 py-1 rounded-md border border-[var(--neon-cyan)]/20">
                            {conversacionesFiltradas.length} ACTIVOS
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                        {conversacionesFiltradas.map(conv => {
                            const est = estadoConfig[conv.estado] || estadoConfig.activa
                            const plat = plataformaConfig[conv.plataforma] || plataformaConfig.web
                            const isSelected = selectedChat?.id === conv.id

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedChat(conv)}
                                    className={`
                                        p-4 rounded-xl cursor-pointer transition-all border border-transparent
                                        ${isSelected
                                            ? 'bg-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                            : 'hover:bg-white/5 hover:border-white/10'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg filter drop-shadow-md">{plat.emoji}</span>
                                            <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {conv.cliente_nombre}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>

                                    <p className="text-xs text-[var(--neon-purple)] font-medium mb-1 truncate">
                                        {conv.producto_nombre}
                                    </p>

                                    <p className="text-xs text-gray-400 truncate opacity-80">
                                        {conv.historial_chat[conv.historial_chat.length - 1]?.contenido}
                                    </p>

                                    <div className="mt-3 flex justify-end">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${est.color} ${est.bg} ${est.border}`}>
                                            {est.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Área de Chat (Derecha) */}
                <div className="col-span-8 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
                    {/* Background Detail */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />

                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-[var(--glass-border)] bg-black/40 backdrop-blur-md flex justify-between items-center z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-gray-600">
                                        <User className="text-gray-300 w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg leading-tight">{selectedChat.cliente_nombre}</h2>
                                        <p className="text-xs text-[var(--neon-cyan)] flex items-center gap-1">
                                            Interesado en: {selectedChat.producto_nombre}
                                        </p>
                                    </div>
                                </div>

                                <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${estadoConfig[selectedChat.estado]?.border} ${estadoConfig[selectedChat.estado]?.bg}`}>
                                    {estadoConfig[selectedChat.estado]?.icon && (
                                        (() => {
                                            const Icon = estadoConfig[selectedChat.estado].icon;
                                            return <Icon size={14} className={estadoConfig[selectedChat.estado]?.color} />;
                                        })()
                                    )}
                                    <span className={`text-xs font-bold ${estadoConfig[selectedChat.estado]?.color}`}>
                                        {estadoConfig[selectedChat.estado]?.label || selectedChat.estado}
                                    </span>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10">
                                {selectedChat.historial_chat.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col max-w-[75%] ${msg.rol === 'cliente' ? 'self-end items-end' : 'self-start items-start'}`}
                                    >
                                        <div className={`
                                            relative p-4 rounded-2xl text-sm leading-relaxed
                                            ${msg.rol === 'cliente'
                                                ? 'bg-gradient-to-br from-[var(--neon-purple)] to-indigo-700 text-white rounded-br-none shadow-[0_5px_15px_rgba(139,92,246,0.3)]'
                                                : 'glass-card border-none text-gray-200 rounded-bl-none ml-8' // ml-8 espacio para icono
                                            }
                                        `}>
                                            {/* Icono IA flotante */}
                                            {msg.rol === 'ia' && (
                                                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-black border border-[var(--neon-cyan)] flex items-center justify-center shadow-[0_0_10px_var(--neon-cyan-glow)]">
                                                    <Bot size={16} className="text-[var(--neon-cyan)]" />
                                                </div>
                                            )}

                                            {msg.tipo === 'imagen' && msg.url && (
                                                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                                                    <img src={msg.url} alt="Imagen adjunta" className="max-w-full h-auto max-h-60 object-cover" />
                                                </div>
                                            )}
                                            <p>{msg.contenido}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-2 px-2 font-mono">
                                            {format(new Date(msg.timestamp), 'HH:mm')}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area (Read Only) */}
                            <div className="p-4 border-t border-[var(--glass-border)] bg-black/20 z-10">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Bot size={18} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-gray-700 text-gray-400 text-sm rounded-xl block pl-10 p-3 italic cursor-not-allowed focus:ring-0 focus:border-gray-700"
                                        placeholder="El Agente IA está procesando la conversación..."
                                        disabled
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <div className="w-2 h-2 bg-[var(--neon-green)] rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 z-10">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 animate-pulse">
                                <MessageSquare size={48} className="opacity-50" />
                            </div>
                            <p className="text-lg font-medium">Selecciona una señal neuronal</p>
                            <p className="text-sm opacity-60">Monitoreando espectro de comunicaciones...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
