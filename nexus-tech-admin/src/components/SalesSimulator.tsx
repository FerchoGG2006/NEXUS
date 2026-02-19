'use client'

import { useState, useEffect } from 'react'
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db, getProductos, getConfiguracionIA } from '@/lib/firebase'
import { formatPrice } from '@/lib/currency'
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
                        { id: 'demo1', name: 'Producto Demo 1', price: 150000, description_ia: 'Demo' },
                        { id: 'demo2', name: 'Producto Demo 2', price: 45000, description_ia: 'Demo' }
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
                                                <div className="product-price">{formatPrice(p.price)}</div>
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

                            <div className="flex gap-2 mt-4">
                                <button
                                    className="btn btn--secondary flex-1"
                                    onClick={() => { setStep(1); setLogs([]); }}
                                >
                                    Reiniciar
                                </button>
                                <button
                                    className="btn btn--primary flex-1"
                                    onClick={() => setStep(3)}
                                >
                                    Simular Pago 💸
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="payment-view">
                            <h4>Simulador de Pasarela</h4>
                            <p className="text-sm text-gray-400 mb-4">Simula que el cliente pagó por {selectedProduct.name}</p>

                            <button
                                className="btn btn--primary w-full"
                                onClick={async () => {
                                    setIsThinking(true);
                                    addLog('💳 Iniciando transacción simulada...');
                                    try {
                                        const res = await fetch('http://127.0.0.1:5001/nexus-autosales/us-central1/webhookPagoSimulado', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                sku: selectedProduct.id, // Using ID as SKU in demo
                                                cliente_id: 'SIM_USER_' + Date.now(),
                                                cantidad: 1,
                                                datos_envio: { ciudad: 'Lima Central' } // Defaulting to Lima for simulation
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            addLog('✅ Pago Aprobado. Orden: ' + data.order_id);
                                            addLog('🚚 Dispatch auto-asignado.');
                                        } else {
                                            addLog('❌ Error pago: ' + data.error);
                                        }
                                    } catch (e: any) {
                                        addLog('❌ Error conexión: ' + e.message);
                                    }
                                    setIsThinking(false);
                                }}
                                disabled={isThinking}
                            >
                                {isThinking ? 'Procesando...' : `Confirmar Pago (${formatPrice(selectedProduct.price)})`}
                            </button>

                            <div className="my-3 flex items-center gap-2">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-xs text-gray-500 uppercase">O Pagar con Pasarela</span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>

                            <button
                                className="btn bg-[#635bff] hover:bg-[#544ee0] text-white w-full flex items-center justify-center gap-2"
                                onClick={async () => {
                                    setIsThinking(true);
                                    addLog('🔗 Generando Link de Stripe...');
                                    try {
                                        const res = await fetch('http://127.0.0.1:5001/nexus-autosales/us-central1/createStripeSession', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                items: [{
                                                    nombre: selectedProduct.name,
                                                    sku: selectedProduct.id,
                                                    precio_unitario: selectedProduct.price,
                                                    cantidad: 1
                                                }],
                                                cliente_id: 'SIM_' + Date.now(),
                                                customer_email: 'cliente@demo.com'
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.url) {
                                            addLog('✅ Link Generado. Redirigiendo...');
                                            window.open(data.url, '_blank');
                                        } else {
                                            addLog('❌ Error Stripe: ' + (data.error || 'Desconocido'));
                                        }
                                    } catch (e: any) {
                                        addLog('❌ Error conexión: ' + e.message);
                                    }
                                    setIsThinking(false);
                                }}
                                disabled={isThinking}
                            >
                                <span>Pagar con Stripe</span>
                                <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current"><path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm5.2 22.8c-3.8 1.6-8.6-.2-9.4-4.6-.2-1.2.6-2.2 1.8-2.2h.2c1 .2 1.6 1.2 1.8 2.2.4 2.4 3.4 3.2 5.2 2.4.6-.2 1.2-.8 1.2-1.6 0-1-.8-1.6-3.8-2.6-4.6-1.4-6-3.8-6-6 0-2.8 2.2-4.8 5.6-5.4 3.6-.6 7.6 1 8.4 4.2.2 1-.6 2-1.6 2h-.2c-1-.2-1.6-1-1.8-1.8-.4-1.8-2.8-2.2-4.4-1.8-.8.2-1.2.8-1.2 1.4 0 .8.8 1.4 3.4 2.4 4.8 1.6 6.4 3.8 6.4 6.2.2 3.2-2.2 5-5.6 5.8z" /></svg>
                            </button>

                            <button
                                className="btn btn--text mt-2 w-full"
                                onClick={() => setStep(2)}
                            >
                                Volver
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
                    background: #111;
                    color: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .card-header {
                    padding: 16px;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #1a1a1a;
                }

                .card-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                    font-size: 1.1rem;
                }

                .simulator-body {
                    padding: 20px;
                }

                .btn-close {
                    background: none;
                    border: none;
                    color: #666;
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
                    border: 1px solid #333;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    transition: all 0.2s;
                    background: #222;
                }

                .product-option:hover {
                    background: #333;
                }

                .product-option.active {
                    border-color: var(--neon-purple, #a855f7);
                    background: rgba(168, 85, 247, 0.1);
                }

                .product-name { font-weight: 500; font-size: 0.9rem; }
                .product-price { color: var(--neon-green, #4ade80); font-weight: 600; }

                .input-wrapper {
                    position: relative;
                    margin-top: 8px;
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                }

                .input {
                    padding-left: 36px;
                    width: 100%;
                    background: #222;
                    border: 1px solid #333;
                    color: white;
                    padding: 10px 10px 10px 36px;
                    border-radius: 8px;
                }

                .logs-terminal {
                    margin-top: 20px;
                    background: #000;
                    padding: 12px;
                    border-radius: 8px;
                    font-family: monospace;
                    font-size: 0.75rem;
                    height: 120px;
                    overflow-y: auto;
                    border: 1px solid #333;
                }

                .log-line { color: #4ade80; margin-bottom: 4px; }
                .log-placeholder { color: #666; font-style: italic; }

                .success-view, .payment-view {
                    text-align: center;
                    padding: 20px 0;
                }
                .success-icon { font-size: 40px; margin-bottom: 10px; }
                
                .btn {
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                
                .btn--primary {
                    background: var(--neon-purple, #8b5cf6);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .btn--primary:hover {
                    background: #7c3aed;
                }

                .btn--secondary {
                    background: #333;
                    color: white;
                }
                
                .btn--text {
                    background: none;
                    color: #999;
                }
                
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}
