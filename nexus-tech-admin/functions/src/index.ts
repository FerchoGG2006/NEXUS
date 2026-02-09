/**
 * NEXUS AUTO-SALES
 * Central de Integraciones & Inteligencia Artificial
 * 
 * Arquitectura:
 * 1. Webhooks (Meta/ML) -> Reciben evento HTTP -> Guardan en 'mensajes_entrantes'
 * 2. Trigger (Firestore) -> Detecta nuevo mensaje -> Llama a GPT-4o -> Genera Respuesta
 * 3. Sender (API) -> Envía respuesta a la plataforma correspondiente
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
// import axios from 'axios';

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ============================================
// HELPERS Y CONFIGURACIÓN
// ============================================

async function getOpenAIClient(): Promise<OpenAI> {
    const configDoc = await db.collection('configuracion_ia').doc('default').get();
    const config = configDoc.data();
    if (!config?.openai_api_key) throw new Error('OpenAI API Key no configurada');
    return new OpenAI({ apiKey: config.openai_api_key });
}

async function getGeminiResponse(prompt: string, history: any[], apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convertir historial al formato de Gemini
    const contents = [
        { role: 'user', parts: [{ text: prompt }] },
        ...history.map(m => ({
            role: m.rol === 'cliente' ? 'user' : 'model',
            parts: [{ text: m.contenido }]
        }))
    ];

    const result = await model.generateContent({
        contents: contents,
        generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
        },
    });

    return result.response.text();
}

// ============================================
// 1. WEBHOOKS PÚBLICOS (ENTRADA)
// ============================================

// Webhook Unificado para Meta (WhatsApp, Instagram, Messenger)
export const webhookMeta = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // A) Verificación del Token (Handshake inicial)
        if (req.method === 'GET') {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            // Usamos un token fijo 'nexus_secure_token' o variable de entorno
            if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'nexus_secure_token')) {
                res.status(200).send(challenge);
            } else {
                res.status(403).send('Forbidden');
            }
            return;
        }

        // B) Recepción de Mensajes (POST)
        try {
            const body = req.body;

            // Log para debug
            console.log('Meta Webhook Payload:', JSON.stringify(body, null, 2));

            // Extraer mensaje (Estructura genérica de Meta)
            if (body.object) {
                let entry = body.entry?.[0];
                let changes = entry?.changes?.[0]?.value || entry?.messaging?.[0]; // WhatsApp vs Messenger

                // WhatsApp Business API Specifics
                if (body.object === 'whatsapp_business_account') {
                    const message = changes?.messages?.[0];
                    const contact = changes?.contacts?.[0];

                    if (message && message.type === 'text') {
                        // Guardar en cola de procesamiento
                        await db.collection('mensajes_entrantes').add({
                            plataforma: 'whatsapp',
                            mensaje_id: message.id,
                            sender_id: message.from,
                            sender_name: contact?.profile?.name || 'Cliente WhatsApp',
                            texto: message.text.body,
                            timestamp: new Date().toISOString(),
                            procesado: false
                        });
                    }
                }
                // Facebook / Instagram
                else if (body.object === 'page' || body.object === 'instagram') {
                    // Lógica similar para Messenger/IG (simplificada para demo)
                    const event = entry?.messaging?.[0];
                    if (event?.message?.text) {
                        await db.collection('mensajes_entrantes').add({
                            plataforma: body.object === 'instagram' ? 'instagram' : 'facebook',
                            mensaje_id: event.message.mid,
                            sender_id: event.sender.id,
                            sender_name: 'Usuario Meta', // FB no manda nombre directo en webhook
                            texto: event.message.text,
                            timestamp: new Date().toISOString(),
                            procesado: false
                        });
                    }
                }
            }

            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error procesando webhook Meta:', error);
            res.status(500).send('Error interno');
        }
    });
});

// Webhook para MercadoLibre
export const webhookMercadoLibre = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { topic, resource, user_id } = req.body;
            console.log('ML Webhook:', topic, resource);

            if (topic === 'questions') {
                // Guardar la notificación para que el procesador vaya a buscar la pregunta a la API de ML
                await db.collection('mensajes_entrantes').add({
                    plataforma: 'mercadolibre',
                    tipo: 'pregunta',
                    resource_id: resource, // ej: /questions/123456
                    user_id,
                    timestamp: new Date().toISOString(),
                    procesado: false
                });
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Error webhook ML:', error);
            res.status(500).send('Error');
        }
    });
});

// ============================================
// 2. TRIGGER DE PROCESAMIENTO (CEREBRO IA)
// ============================================

export const procesarMensajeEntrante = functions.firestore
    .document('mensajes_entrantes/{msgId}')
    .onCreate(async (snap, context) => {
        const payload = snap.data();
        if (payload.procesado) return;

        try {
            let textoUsuario = payload.texto;
            let clienteNombre = payload.sender_name;
            let clienteId = payload.sender_id;

            // Para MercadoLibre, necesitamos hacer fetch extra (Mockeado para MVP)
            if (payload.plataforma === 'mercadolibre') {
                // Aquí iría axios.get(`https://api.mercadolibre.com${payload.resource_id}`)
                // Como no tenemos token real aún, simulamos:
                textoUsuario = "¿Tienen stock disponible del iPhone?";
                clienteNombre = "Usuario ML";
                clienteId = payload.user_id;
            }

            // 1. Buscar o Crear Conversación en NEXUS
            let conversacionId = '';
            const convQuery = await db.collection('conversaciones')
                .where('cliente_id', '==', clienteId)
                .where('plataforma', '==', payload.plataforma)
                .where('estado', 'in', ['activa', 'negociando', 'esperando_pago'])
                .limit(1)
                .get();

            let historialChat: any[] = [];
            let conversacionData: any = {};

            if (!convQuery.empty) {
                const convDoc = convQuery.docs[0];
                conversacionId = convDoc.id;
                conversacionData = convDoc.data();
                historialChat = conversacionData.historial_chat || [];
            } else {
                // Nueva Conversación
                const nuevaConv = {
                    cliente_id: clienteId,
                    cliente_nombre: clienteNombre,
                    plataforma: payload.plataforma,
                    estado: 'activa',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    historial_chat: [],
                    producto_nombre: 'Consulta General', // Idealmente inferir del contexto
                    pago_confirmado: false
                };
                const ref = await db.collection('conversaciones').add(nuevaConv);
                conversacionId = ref.id;
                conversacionData = nuevaConv;
            }

            // 2. Agregar mensaje del usuario
            historialChat.push({
                rol: 'cliente',
                contenido: textoUsuario,
                timestamp: new Date().toISOString()
            });

            // 3. Consultar a GPT-4o
            const configDoc = await db.collection('configuracion_ia').doc('default').get();
            const config = configDoc.data() || {};

            // Construir Prompt Avanzado
            let systemPrompt = config.prompt_sistema || `Eres el vendedor virtual de ${config.nombre_tienda || 'Nexus Tech'}. 
            Tu objetivo es ser profesional, persuasivo y cerrar la venta.
            Responde de forma concisa (2-3 oraciones).
            Si el cliente muestra interés, solicita sus datos de envío y envía el link de pago.`;

            if (config.knowledge_base) {
                const faqs = config.knowledge_base.map((qa: any) => `P: ${qa.pregunta} R: ${qa.respuesta}`).join('\n');
                systemPrompt += `\n\nInformación de soporte:\n${faqs}`;
            }

            let respuestaIA = "";

            // Decidir qué IA usar basado en la configuración
            if (config.gemini_api_key) {
                console.log('Utilizando Gemini 1.5 Flash...');
                respuestaIA = await getGeminiResponse(systemPrompt, historialChat, config.gemini_api_key);
            } else if (config.openai_api_key) {
                console.log('Utilizando OpenAI GPT-4o...');
                const openai = await getOpenAIClient();
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...historialChat.map(m => ({
                            role: (m.rol === 'cliente' ? 'user' : 'assistant') as 'user' | 'assistant',
                            content: m.contenido
                        }))
                    ],
                    max_tokens: 150,
                    temperature: 0.7
                });
                respuestaIA = completion.choices[0].message.content || "Lo siento, ¿puedes repetir?";
            } else {
                respuestaIA = "Configuración de IA no detectada.";
            }

            // 4. Guardar respuesta en Conversación
            historialChat.push({
                rol: 'ia',
                contenido: respuestaIA,
                timestamp: new Date().toISOString()
            });

            let nuevoEstado = conversacionData.estado;
            // Detección mejorada de intención
            const lowerRes = respuestaIA.toLowerCase();
            if (lowerRes.includes('link de pago') || lowerRes.includes('puedes pagar')) {
                nuevoEstado = 'esperando_pago';
            } else if (lowerRes.includes('datos de envío') || lowerRes.includes('dirección')) {
                nuevoEstado = 'negociando';
            }

            await db.collection('conversaciones').doc(conversacionId).update({
                historial_chat: historialChat,
                updated_at: new Date().toISOString(),
                estado: nuevoEstado,
                ultimo_mensaje: respuestaIA
            });

            // 5. ENVIAR RESPUESTA A LA PLATAFORMA (Output)
            // Para integración real, descomenta y configura el Token de Acceso
            /*
            try {
                const platform = payload.plataforma;
                const recipientId = payload.sender_id;
                
                if (platform === 'whatsapp') {
                    // Llamada a WhatsApp API
                    // await axios.post(`https://graph.facebook.com/v18.0/${process.env.WA_PHONE_ID}/messages`, {
                    //     messaging_product: "whatsapp",
                    //     to: recipientId,
                    //     text: { body: respuestaIA }
                    // }, { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } });
                } else if (platform === 'facebook' || platform === 'instagram') {
                    // Llamada a Messenger/IG API
                    // await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.META_ACCESS_TOKEN}`, {
                    //     recipient: { id: recipientId },
                    //     message: { text: respuestaIA }
                    // });
                }
            } catch (err) {
                console.error('Error enviando mensaje a plataforma:', err);
            }
            */
            console.log(`>>> [SIMULACIÓN] Respuesta enviada a ${payload.plataforma} (${payload.sender_id}): ${respuestaIA}`);

            // Marcar mensaje entrante como procesado
            await snap.ref.update({ procesado: true, respuesta_generada: respuestaIA });

        } catch (error) {
            console.error('Error en procesarMensajeEntrante:', error);
        }
    });

// Mantener endpoint HTTP para pruebas manuales desde Postman/Frontend Simulator
export const procesarMensajeManual = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Envolver lógica de simulador web
        // Simplemente guarda en 'mensajes_entrantes' y deja que el trigger haga el trabajo
        try {
            const { mensaje, cliente_id, plataforma } = req.body;
            await db.collection('mensajes_entrantes').add({
                plataforma: plataforma || 'web',
                texto: mensaje,
                sender_id: cliente_id || 'web-user',
                sender_name: 'Usuario Web',
                timestamp: new Date().toISOString(),
                procesado: false
            });
            res.json({ success: true, message: 'Mensaje encolado para IA' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });
});

// ============================================
// FUNCIONES NOTIFICACIÓN Y ESTADÍSTICAS (LEGACY)
// ============================================

export const notificarVentaCerrada = functions.firestore
    .document('pedidos_despacho/{pedidoId}')
    .onCreate(async (snap) => {
        const pedido = snap.data();
        console.log(`💰 VENTA CERRADA: ${pedido.producto_nombre} - $${pedido.total}`);
        return null;
    });

export const getEstadisticasIA = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const [conversaciones, ventas, pendientes] = await Promise.all([
                db.collection('conversaciones').where('estado', 'in', ['activa', 'negociando']).get(),
                db.collection('pedidos_despacho').where('created_at', '>=', hoy.toISOString()).get(),
                db.collection('pedidos_despacho').where('estado', '==', 'pendiente').get()
            ]);

            let total = 0;
            ventas.forEach(d => total += (d.data().total || 0));

            res.json({
                conversaciones_activas: conversaciones.size,
                ventas_hoy: ventas.size,
                total_ventas_hoy: total,
                pedidos_pendientes: pendientes.size
            });
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    });
});
