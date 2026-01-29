'use client'

import { useState, useEffect } from 'react'
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db, getProductos, getConfiguracionIA } from '@/lib/firebase'
import { Send, User, Zap, BookOpen } from 'lucide-react'
import type { Producto } from '@/types/firestore'

interface SimulatorProps {
    onClose: () => void
}

export function SalesSimulator({ onClose }: SimulatorProps) {
    const [step, setStep] = useState(1)
    const [isThinking, setIsThinking] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [customerMessage, setCustomerMessage] = useState('')
    const [products, setProducts] = useState<any[]>([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [aiConfig, setAiConfig] = useState<any>(null)

    const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`])

    // Cargar productos y configuración al abrir
    useEffect(() => {
        const load = async () => {
            try {
                // Cargar Configuración IA para tener la base de conocimiento en la simulación
                if (db) {
                    const config = await getConfiguracionIA()
                    setAiConfig(config)
                }

                // Si no hay Firebase configurado, cargamos demos para la UI
                if (!db) {
                    const demos = [
                        { id: 'demo1', name: 'Producto Demo 1', price: 99.99, description_ia: 'Demo' },
                        { id: 'demo2', name: 'Producto Demo 2', price: 49.50, description_ia: 'Demo' }
                    ]
                    setProducts(demos)
                    setSelectedProduct(demos[0])
                    return
                }

                const data = await getProductos()
                const mapped = data.map((p: any) => ({
                    id: p.id,
                    name: p.nombre,
                    price: p.precio_retail,
                    description_ia: p.descripcion_ia
                }))
                setProducts(mapped)
                if (mapped.length > 0) setSelectedProduct(mapped[0])
            } catch (e) {
                console.error("Error loading products", e)
                addLog('Error cargando productos')
            } finally {
                setLoadingProducts(false)
            }
        }
        load()
    }, [])


    const startSimulation = async () => {
        if (!db) {
            addLog('⚠️ Firebase no detectado. Usando simulación local.')
            // Simulación local sin Firebase (Fallback)
            setIsThinking(true)
            setTimeout(() => {
                addLog('✅ IA respondió (Simulado Local)')
                setIsThinking(false)
                setStep(2)
            }, 1500)
            return
        }

        setIsThinking(true)
        addLog('📡 Conectando con Nexus Brain (Cloud Functions)...')

        try {
            // 1. Enviar mensaje a la cola
            const mensajePayload = {
                plataforma: 'simulador_web',
                texto: customerMessage || `Hola, me interesa el ${selectedProduct.name}`,
                sender_id: 'sim_user_' + Date.now().toString().slice(-4),
                sender_name: 'Cliente Simulador',
                timestamp: new Date().toISOString(),
                procesado: false,
                producto_contexto_id: selectedProduct.id,
                producto_contexto_nombre: selectedProduct.name
            }

            const docRef = await addDoc(collection(db as any, 'mensajes_entrantes'), mensajePayload)
            addLog('✅ Mensaje encolado. ID: ' + docRef.id.slice(0, 6) + '...')
            addLog('⏳ Esperando respuesta neuronal...')

            // 2. Escuchar la respuesta en tiempo real
            // Importamos onSnapshot dinámicamente o usamos el de firebase/firestore
            const { onSnapshot } = await import('firebase/firestore')

            const unsubscribe = onSnapshot(docRef, (snap) => {
                const data = snap.data()
                if (data && data.procesado) {
                    // ¡La IA respondió!
                    addLog('🧠 Nexus AI ha procesado el mensaje.')
                    addLog('💬 RESPUESTA: ' + (data.respuesta_generada || 'Sin respuesta texto'))

                    setIsThinking(false)
                    setStep(2)
                    unsubscribe() // Dejar de escuchar
                }
            })

            // Timeout de seguridad por si la Cloud Function estalla o no hay trigger
            setTimeout(() => {
                if (isThinking) { // Si aun sigue pensando despues de 15s
                    addLog('⚠️ Tiempo de espera agotado. Verifica los Triggers.')
                    setIsThinking(false)
                    unsubscribe()
                }
            }, 15000)

        } catch (error: any) {
            console.error('Simulation error:', error)
            addLog(`❌ Error: ${error.message}`)
            setIsThinking(false)
        }
    }

    return (
        <div className="simulator-overlay">
            <div className="card simulator-card">
                <div className="card-header">
                    <h3 className="card-title">
                        <Zap style={{ color: 'var(--color-accent-amber)' }} />
                        Simulador de Ventas
                    </h3>
                    <button onClick={onClose} className="btn-close">
                        &times;
                    </button>
                </div>

                <div className="simulator-body">
                    {step === 1 && (
                        <>
                            <div className="form-group">
                                <label className="label">1. Elige un producto del inventario</label>
                                {loadingProducts ? (
                                    <div style={{ padding: '10px', color: '#666' }}>Cargando productos...</div>
                                ) : products.length === 0 ? (
                                    <div style={{ padding: '10px', color: 'var(--color-warning)' }}>
                                        No hay productos. Ve a Inventario para crear uno.
                                    </div>
                                ) : (
                                    <div className="product-selector">
                                        {products.map(p => (
                                            <div
                                                key={p.id}
                                                className={`product-option ${selectedProduct?.id === p.id ? 'active' : ''}`}
                                                onClick={() => setSelectedProduct(p)}
                                            >
                                                <div className="product-name">{p.name}</div>
                                                <div className="product-price">${p.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-group mt-4">
                                <label className="label">2. Mensaje del Cliente (WhatsApp/FB)</label>
                                <div className="input-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={selectedProduct ? `Hola, precio del ${selectedProduct.name}?` : "Selecciona un producto..."}
                                        value={customerMessage}
                                        onChange={e => setCustomerMessage(e.target.value)}
                                        disabled={!selectedProduct}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn--primary w-full mt-6"
                                onClick={startSimulation}
                                disabled={isThinking}
                            >
                                {isThinking ? 'Simulando...' : 'Enviar Mensaje de Prueba'} <Send size={16} />
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <div className="success-view">
                            <div className="success-icon">🎉</div>
                            <h4>¡Simulación Iniciada!</h4>
                            <p>La IA ha recibido el mensaje y ha respondido.</p>
                            <button
                                className="btn btn--secondary mt-4"
                                onClick={() => { setStep(1); setLogs([]); }}
                            >
                                Probar otra vez
                            </button>
                        </div>
                    )}

                    <div className="logs-terminal">
                        {logs.map((log, i) => (
                            <div key={i} className="log-line">{log}</div>
                        ))}
                        {logs.length === 0 && <span className="log-placeholder">Esperando inicio...</span>}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .simulator-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }

                .simulator-card {
                    width: 100%;
                    max-width: 450px;
                    border: 1px solid var(--color-accent-amber);
                    box-shadow: 0 0 50px rgba(245, 158, 11, 0.15);
                }

                .btn-close {
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    font-size: 24px;
                    cursor: pointer;
                }

                .product-selector {
                    display: grid;
                    gap: 8px;
                    margin-top: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .product-option {
                    padding: 10px;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    transition: all 0.2s;
                }

                .product-option:hover {
                    background: var(--color-bg-tertiary);
                }

                .product-option.active {
                    border-color: var(--color-primary);
                    background: rgba(99, 102, 241, 0.1);
                }

                .product-name { font-weight: 500; font-size: 0.9rem; }
                .product-price { color: var(--color-accent-emerald); font-weight: 600; }

                .input-wrapper {
                    position: relative;
                    margin-top: 8px;
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted);
                }

                .input {
                    padding-left: 36px;
                    width: 100%;
                }

                .logs-terminal {
                    margin-top: 20px;
                    background: #000;
                    padding: 12px;
                    border-radius: var(--radius-md);
                    font-family: monospace;
                    font-size: 0.75rem;
                    height: 120px;
                    overflow-y: auto;
                    border: 1px solid var(--color-border);
                }

                .log-line { color: #4ade80; margin-bottom: 4px; }
                .log-placeholder { color: #666; font-style: italic; }

                .success-view {
                    text-align: center;
                    padding: 20px 0;
                }
                .success-icon { font-size: 40px; margin-bottom: 10px; }
                
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}
