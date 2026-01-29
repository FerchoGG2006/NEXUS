'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, addDoc } from 'firebase/firestore'
import { Database, Check, AlertCircle, Loader2, Terminal, Code2, ShieldAlert } from 'lucide-react'

export default function SeedPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(prev => [...prev, msg])

    const runSeed = async () => {
        // Diagnóstico de configuración
        console.log('Verificando configuración Firebase...')
        console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
        console.log('API Key Present:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY)

        if (!db) {
            setStatus('error')
            addLog('❌ Error CRÍTICO: El objeto db es null.')
            addLog('Esto significa que las variables de entorno en .env.local faltan o son inválidas.')
            return
        }

        if (!confirm('⚠️ ESTO SOBREESCRIBIRÁ DATOS. ¿Continuar?')) return

        setStatus('loading')
        setLogs([])
        addLog('🚀 Iniciando Seed System Protocol...')

        // Helper para timeout
        const withTimeout = (promise: Promise<any>, ms: number = 5000) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Time-out Error: Firebase is unreachable")), ms))
            ])
        }

        try {
            // 1. Configuración IA
            addLog('📝 Configurando IA Core (Firestore)...')

            await withTimeout(setDoc(doc(db, 'configuracion_ia', 'default'), {
                nombre_tienda: 'Nexus Tech',
                tono_vendedor: 'profesional',
                prompt_sistema: `Eres el vendedor virtual de Nexus Tech. Tu objetivo es ayudar a los clientes y cerrar ventas.`,
                mensaje_bienvenida: '¡Hola! 👋 Soy el asistente de Nexus Tech. ¿En qué puedo ayudarte?',
                mensaje_sin_stock: 'Este producto está agotado. ¿Te aviso cuando esté disponible?',
                mensaje_pago_recibido: '¡Pago recibido! 🎉 Tu pedido será despachado hoy.',
                horario_atencion: { inicio: '09:00', fin: '21:00' },
                respuesta_fuera_horario: 'Gracias por escribir. Horario: 9am-9pm. Te respondo mañana.',
                notificar_email: '',
                notificar_whatsapp: '',
                openai_api_key: '',
                knowledge_base: [
                    { pregunta: '¿Tienen garantía?', respuesta: 'Sí, 12 meses de garantía directa.' },
                    { pregunta: '¿Envíos?', respuesta: 'Envíos a todo el país, gratis por compras mayores a $50.' }
                ],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))
            addLog('✅ AI Core Configured')

            // 2. Productos
            addLog('📦 Generando Inventario Demo...')
            const productos = [
                {
                    sku: 'ACC-001',
                    nombre: 'iPhone 15 Pro Case',
                    descripcion: 'Funda de silicona premium',
                    descripcion_ia: 'Funda premium de silicona para iPhone 15 Pro. Protección militar. Garantía de 1 año.',
                    categoria: 'Fundas',
                    costo_compra: 12.00,
                    precio_retail: 29.99,
                    precio_b2b: 22.00,
                    stock: 50,
                    stock_minimo: 10,
                    link_pago_base: 'https://link.pago/demo',
                    imagenes: [],
                    activo: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    sku: 'ACC-002',
                    nombre: 'Cable USB-C Premium',
                    descripcion: 'Cable trenzado de nylon',
                    descripcion_ia: 'Cable USB-C de 2m, carga rápida 65W. Trenzado resistente.',
                    categoria: 'Cables',
                    costo_compra: 4.00,
                    precio_retail: 12.99,
                    precio_b2b: 9.00,
                    stock: 100,
                    stock_minimo: 20,
                    link_pago_base: 'https://link.pago/demo-cable',
                    imagenes: [],
                    activo: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]

            for (const p of productos) {
                await addDoc(collection(db, 'productos'), p)
                addLog(`  + Item Inserted: ${p.nombre}`)
            }

            // 3. Conversación Demo
            addLog('💬 Simulando Conversación Histórica...')
            await addDoc(collection(db, 'conversaciones'), {
                cliente_id: 'demo_user',
                cliente_nombre: 'Juan Pérez (Demo)',
                cliente_telefono: '+57 300 111 2233',
                plataforma: 'whatsapp',
                producto_nombre: 'iPhone 15 Pro Case',
                estado: 'negociando',
                historial_chat: [
                    { rol: 'cliente', contenido: 'Hola, precio?', timestamp: new Date().toISOString() },
                    { rol: 'ia', contenido: 'Hola Juan, cuesta $29.99.', timestamp: new Date().toISOString() }
                ],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                pago_confirmado: false
            })
            addLog('✅ Chat Log Created')

            setStatus('success')
            addLog('🎉 SYSTEM SEED COMPLETED SUCCESSFULLY')

        } catch (error: any) {
            console.error(error)
            addLog(`❌ Error: ${error.message}`)
            setStatus('error')
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center">
            <div className="glass-panel p-0 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                {/* Header Terminal */}
                <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-emerald-500 w-5 h-5" />
                        <span className="font-mono font-bold text-gray-200">nexus_db_seeder.exe</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-black/40">

                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Database className="text-amber-400 w-8 h-8" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Database Initialization</h1>
                                <p className="text-gray-400 text-sm">Herramienta de desarrollo y setup</p>
                            </div>
                        </div>

                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 mb-6 hover:bg-amber-900/20 transition-colors">
                            <div className="flex gap-3">
                                <ShieldAlert className="text-amber-500 flex-shrink-0" />
                                <div className="text-sm text-gray-300">
                                    <strong className="text-amber-400 block mb-1">Zona de Peligro</strong>
                                    Esta utilidad escribirá datos de prueba en tu base de datos de producción/desarrollo. Úsala solo al inicializar el proyecto.
                                </div>
                            </div>
                        </div>

                        {/* Diagnóstico */}
                        <div className="space-y-3 font-mono text-sm bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                            <h3 className="text-gray-400 font-bold mb-2 flex items-center gap-2"><Code2 size={14} /> CONNECTION STATUS</h3>

                            <div className="flex justify-between items-center py-1 border-b border-gray-800">
                                <span className="text-gray-500">API Key Config</span>
                                {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?
                                    <span className="text-emerald-400 flex items-center gap-1"><Check size={14} /> OK</span> :
                                    <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14} /> MISSING</span>
                                }
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-800">
                                <span className="text-gray-500">Project ID</span>
                                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?
                                    <span className="text-emerald-400 flex items-center gap-1"><Check size={14} /> LINKED</span> :
                                    <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14} /> UNLINKED</span>
                                }
                            </div>
                        </div>

                        <button
                            onClick={runSeed}
                            disabled={status === 'loading'}
                            className={`mt-6 w-full btn-cyber-primary py-4 text-base font-bold flex items-center justify-center gap-3 ${status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {status === 'loading' ? (
                                <><Loader2 className="animate-spin" /> EXECUTING SCRIPT...</>
                            ) : (
                                <><Terminal size={18} /> INICIAR PROTOCOLO SEED</>
                            )}
                        </button>
                    </div>

                    {/* Console Output */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-1000 blur"></div>
                        <div className="relative h-full bg-black rounded-xl border border-gray-800 p-4 font-mono text-xs overflow-hidden flex flex-col">
                            <div className="text-gray-500 mb-2 pb-2 border-b border-gray-900 flex justify-between">
                                <span>Output Console</span>
                                <span className="animate-pulse text-emerald-500">● LIVE</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700 pr-2">
                                {logs.length === 0 && <span className="text-gray-700 italic">_ Waiting for input commands...</span>}
                                {logs.map((log, i) => (
                                    <div key={i} className="text-green-400 border-l-2 border-green-900 pl-2 animate-fade-in">
                                        <span className="text-green-700 mr-2">{'>'}</span>
                                        {log}
                                    </div>
                                ))}
                                {status === 'loading' && (
                                    <div className="text-green-400 animate-pulse">_</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
