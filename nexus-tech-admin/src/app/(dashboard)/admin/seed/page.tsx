'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { Database, Check, AlertCircle, Loader2 } from 'lucide-react'

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
        addLog('🚀 Iniciando Seed...')

        // Helper para timeout
        const withTimeout = (promise: Promise<any>, ms: number = 5000) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Tiempo de espera agotado (Timeout) - Firebase no responde")), ms))
            ])
        }

        try {
            // 1. Configuración IA
            addLog('📝 Configurando IA (Intentando conectar a Firestore)...')

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
            addLog('✅ Configuración IA OK')

            // 2. Productos
            addLog('📦 Creando Productos...')
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
                addLog(`  + Producto: ${p.nombre}`)
            }

            // 3. Conversación Demo
            addLog('💬 Creando Chat Demo...')
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
            addLog('✅ Chat Demo OK')

            setStatus('success')
            addLog('🎉 ¡SEED COMPLETADO!')

        } catch (error: any) {
            console.error(error)
            addLog(`❌ Error: ${error.message}`)
            setStatus('error')
        }
    }

    return (
        <div className="animate-fade-in p-8 max-w-2xl mx-auto">
            <div className="card">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <Database className="text-amber-400" size={24} />
                    <h1 className="text-xl font-bold">Inicializar Base de Datos (Seed)</h1>
                </div>

                {/* Panel de Diagnóstico */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 text-sm">
                    <h3 className="font-semibold mb-3 text-gray-300">Diagnóstico de Conexión:</h3>
                    <div className="space-y-2 font-mono">
                        <div className="flex justify-between">
                            <span className="text-gray-500">API Key:</span>
                            {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?
                                <span className="text-green-400 flex items-center gap-1"><Check size={14} /> Configurada</span> :
                                <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14} /> FALTANTE</span>
                            }
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Auth Domain:</span>
                            {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?
                                <span className="text-green-400 flex items-center gap-1"><Check size={14} /> Configurada</span> :
                                <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14} /> FALTANTE</span>
                            }
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Project ID:</span>
                            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?
                                <span className="text-green-400 flex items-center gap-1"><Check size={14} /> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</span> :
                                <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14} /> FALTANTE</span>
                            }
                        </div>
                    </div>
                    {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
                        <div className="mt-3 p-2 bg-red-500/20 text-red-200 rounded text-xs">
                            ⚠️ Falta configurar el archivo <strong>.env.local</strong> con tus credenciales de Firebase.
                        </div>
                    )}
                </div>

                <p className="text-gray-400 mb-6">
                    Esta herramienta poblará tu Firestore con datos de ejemplo:
                    Configuración IA, 2 Productos y 1 Conversación.
                    <br /><br />
                    <strong className="text-red-400">⚠️ Úsala solo en desarrollo o proyecto nuevo.</strong>
                </p>

                <button
                    onClick={runSeed}
                    disabled={status === 'loading'}
                    className={`btn w-full ${status === 'loading' ? 'btn--disabled' : 'btn--primary'}`}
                >
                    {status === 'loading' ? (
                        <><Loader2 className="animate-spin mr-2" /> Ejecutando...</>
                    ) : (
                        <><Database className="mr-2" /> Poblar Base de Datos</>
                    )}
                </button>

                <div className="mt-6 bg-black/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs border border-white/10">
                    {logs.length === 0 && <span className="text-gray-600">Esperando ejecución...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 text-green-400">{log}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}
