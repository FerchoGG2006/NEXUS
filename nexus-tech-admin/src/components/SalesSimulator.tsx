'use client'

import { useState } from 'react'
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MessageSquare, Send, User, Zap } from 'lucide-react'

interface SimulatorProps {
    onClose: () => void
}

const DEMO_PRODUCTS = [
    { id: 'prod_1', name: 'iPhone 15 Pro Case', price: 29.99 },
    { id: 'prod_2', name: 'Cable USB-C Premium', price: 12.50 },
    { id: 'prod_3', name: 'AirPods Pro', price: 249.00 }
]

export function SalesSimulator({ onClose }: SimulatorProps) {
    const [step, setStep] = useState(1)
    const [isThinking, setIsThinking] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [selectedProduct, setSelectedProduct] = useState(DEMO_PRODUCTS[0])
    const [customerMessage, setCustomerMessage] = useState('')

    const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`])

    const startSimulation = async () => {
        if (!db) {
            addLog('Error: Firebase no está inicializado')
            return
        }

        setIsThinking(true)
        addLog('Iniciando simulación de cliente...')

        try {
            // 1. Crear conversación
            const convRef = await addDoc(collection(db as any, 'conversaciones'), {
                cliente_id: 'sim_user_' + Date.now(),
                cliente_nombre: 'Cliente Demo',
                cliente_telefono: '+57 300 123 4567',
                plataforma: 'whatsapp',
                producto_interes_id: selectedProduct.id,
                producto_nombre: selectedProduct.name,
                estado: 'activa',
                historial_chat: [{
                    rol: 'cliente',
                    contenido: customerMessage || `Hola, me interesa el ${selectedProduct.name}`,
                    timestamp: new Date().toISOString()
                }],
                pago_confirmado: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

            addLog(`Conversación creada: ${convRef.id}`)
            addLog('Esperando respuesta de IA...')

            // 2. Simular respuesta IA (Si no hay backend real corriendo)
            setTimeout(async () => {
                const iaResponse = `¡Hola! 👋 Claro que sí. El ${selectedProduct.name} es una excelente elección. Cuesta $${selectedProduct.price}. ¿Te gustaría que te envíe el link de pago?`

                // Actualizar documento para simular respuesta
                const convDoc = doc(db as any, 'conversaciones', convRef.id)
                await updateDoc(convDoc, {
                    historial_chat: [
                        {
                            rol: 'cliente',
                            contenido: customerMessage || `Hola, me interesa el ${selectedProduct.name}`,
                            timestamp: new Date(Date.now() - 1000).toISOString()
                        },
                        {
                            rol: 'ia',
                            contenido: iaResponse,
                            timestamp: new Date().toISOString()
                        }
                    ],
                    estado: 'negociando',
                    updated_at: new Date().toISOString()
                })

                addLog('✅ IA respondió (Simulado)')
                addLog('Revisa el panel de Conversaciones')
                setIsThinking(false)
                setStep(2)
            }, 2500)

        } catch (error: any) {
            addLog(`Error: ${error.message}`)
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
                                <label className="label">1. Elige un producto</label>
                                <div className="product-selector">
                                    {DEMO_PRODUCTS.map(p => (
                                        <div
                                            key={p.id}
                                            className={`product-option ${selectedProduct.id === p.id ? 'active' : ''}`}
                                            onClick={() => setSelectedProduct(p)}
                                        >
                                            <div className="product-name">{p.name}</div>
                                            <div className="product-price">${p.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group mt-4">
                                <label className="label">2. Mensaje del Cliente (WhatsApp/FB)</label>
                                <div className="input-wrapper">
                                    <User size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={`Hola, precio del ${selectedProduct.name}?`}
                                        value={customerMessage}
                                        onChange={e => setCustomerMessage(e.target.value)}
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
