/**
 * NEXUS AUTO-SALES
 * Agente de Ventas IA - Firebase Cloud Functions
 * 
 * Este módulo maneja:
 * 1. Webhooks de FB/IG/WhatsApp
 * 2. Procesamiento de mensajes con GPT-4o
 * 3. Gestión de conversaciones en Firestore
 * 4. Cierre de ventas y notificaciones
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import cors from 'cors';

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ============================================
// INTERFACES
// ============================================

interface MensajeChat {
    rol: 'cliente' | 'ia' | 'sistema';
    contenido: string;
    timestamp: string;
}

interface DatosEnvio {
    nombre_completo: string;
    direccion: string;
    ciudad: string;
    codigo_postal?: string;
    telefono: string;
    notas?: string;
}

interface Conversacion {
    id?: string;
    cliente_id: string;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_email?: string;
    plataforma: string;
    producto_interes_id: string;
    producto_nombre: string;
    estado: 'activa' | 'negociando' | 'esperando_pago' | 'cerrada' | 'abandonada';
    historial_chat: MensajeChat[];
    datos_envio?: DatosEnvio;
    pago_confirmado: boolean;
    comprobante_url?: string;
    total_venta?: number;
    created_at: string;
    updated_at: string;
}

interface Producto {
    id?: string;
    nombre: string;
    descripcion_ia: string;
    precio_retail: number;
    stock: number;
    link_pago_base: string;
    costo_compra: number;
}

// ============================================
// CONFIGURACIÓN OPENAI
// ============================================

let openaiClient: OpenAI | null = null;

async function getOpenAIClient(): Promise<OpenAI> {
    if (openaiClient) return openaiClient;

    const configDoc = await db.collection('configuracion_ia').doc('default').get();
    const config = configDoc.data();

    if (!config?.openai_api_key) {
        throw new Error('OpenAI API Key no configurada');
    }

    openaiClient = new OpenAI({ apiKey: config.openai_api_key });
    return openaiClient;
}

// ============================================
// PROMPT DEL AGENTE DE VENTAS
// ============================================

function buildSystemPrompt(producto: Producto, config: any): string {
    // Construir Base de Conocimiento
    let knowledgeBaseText = '';
    if (config.knowledge_base && Array.isArray(config.knowledge_base)) {
        knowledgeBaseText = config.knowledge_base.map((qa: any) =>
            `- P: ${qa.pregunta}\n  R: ${qa.respuesta}`
        ).join('\n');
    }

    return `Eres el vendedor virtual de ${config.nombre_tienda || 'Nexus Tech'}. Tu nombre es "Nexus Assistant".

REGLAS IMPORTANTES:
1. Tu tono es ${config.tono_vendedor || 'profesional y amigable'}.
2. NUNCA reveles que eres una IA. Actúa como un vendedor humano.
3. Sé persuasivo pero no agresivo. Responde de forma natural y breve.
4. Si el cliente pregunta por un producto, proporciona información útil.
5. Si el cliente muestra interés, guíalo hacia la compra.
6. Para cerrar la venta, solicita: nombre completo, dirección de envío, ciudad y teléfono.
7. Una vez tengas los datos, envía el link de pago.
8. Si envían comprobante de pago, confirma la recepción y agradece.

BASE DE CONOCIMIENTO (FAQ Y POLÍTICAS):
Usa esta información para responder preguntas específicas sobre envíos, garantías, etc.
${knowledgeBaseText}

PRODUCTO EN CONSULTA:
- Nombre: ${producto.nombre}
- Descripción: ${producto.descripcion_ia}
- Precio: $${producto.precio_retail.toFixed(2)} USD
- Disponibilidad: ${producto.stock > 0 ? `${producto.stock} unidades disponibles` : 'AGOTADO'}
- Link de pago: ${producto.link_pago_base}

${producto.stock === 0 ? 'IMPORTANTE: El producto está agotado. Ofrece agregarlo a lista de espera.' : ''}

FLUJO DE VENTA:
1. Responder consultas sobre el producto (usando descripción y FAQ)
2. Si hay interés, preguntar: "¿Te gustaría que te envíe el link de pago?"
3. Solicitar datos de envío: nombre, dirección completa, ciudad, teléfono
4. Enviar link de pago personalizado
5. Esperar comprobante y confirmar venta

Responde siempre en español y de forma concisa (máximo 2-3 oraciones por mensaje).`;
}

// ============================================
// FUNCIÓN PRINCIPAL: PROCESAR MENSAJE
// ============================================

export const procesarMensaje = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            // Validar método
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Método no permitido' });
                return;
            }

            const {
                cliente_id,
                cliente_nombre,
                cliente_telefono,
                plataforma,
                producto_id,
                mensaje,
                conversacion_id
            } = req.body;

            // Validar datos requeridos
            if (!cliente_id || !mensaje) {
                res.status(400).json({ error: 'Datos incompletos' });
                return;
            }

            // Log del webhook
            await db.collection('webhooks_log').add({
                plataforma: plataforma || 'api',
                payload: req.body,
                procesado: false,
                created_at: new Date().toISOString()
            });

            // Obtener o crear conversación
            let conversacion: Conversacion;
            let conversacionRef: admin.firestore.DocumentReference;

            if (conversacion_id) {
                conversacionRef = db.collection('conversaciones').doc(conversacion_id);
                const convDoc = await conversacionRef.get();
                if (!convDoc.exists) {
                    res.status(404).json({ error: 'Conversación no encontrada' });
                    return;
                }
                conversacion = convDoc.data() as Conversacion;
            } else {
                // Buscar conversación activa del cliente
                const convQuery = await db.collection('conversaciones')
                    .where('cliente_id', '==', cliente_id)
                    .where('estado', 'in', ['activa', 'negociando', 'esperando_pago'])
                    .orderBy('created_at', 'desc')
                    .limit(1)
                    .get();

                if (!convQuery.empty) {
                    conversacionRef = convQuery.docs[0].ref;
                    conversacion = convQuery.docs[0].data() as Conversacion;
                } else {
                    // Crear nueva conversación
                    const producto = producto_id
                        ? (await db.collection('productos').doc(producto_id).get()).data() as Producto
                        : null;

                    conversacion = {
                        cliente_id,
                        cliente_nombre: cliente_nombre || 'Cliente',
                        cliente_telefono: cliente_telefono || '',
                        plataforma: plataforma || 'web',
                        producto_interes_id: producto_id || '',
                        producto_nombre: producto?.nombre || 'Consulta general',
                        estado: 'activa',
                        historial_chat: [],
                        pago_confirmado: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    conversacionRef = await db.collection('conversaciones').add(conversacion);
                }
            }

            // Agregar mensaje del cliente al historial
            const mensajeCliente: MensajeChat = {
                rol: 'cliente',
                contenido: mensaje,
                timestamp: new Date().toISOString()
            };
            conversacion.historial_chat.push(mensajeCliente);

            // Obtener producto para contexto
            let producto: Producto | null = null;
            if (conversacion.producto_interes_id) {
                const prodDoc = await db.collection('productos').doc(conversacion.producto_interes_id).get();
                if (prodDoc.exists) {
                    producto = { id: prodDoc.id, ...prodDoc.data() } as Producto;
                }
            }

            // Obtener configuración IA
            const configDoc = await db.collection('configuracion_ia').doc('default').get();
            const config = configDoc.exists ? configDoc.data() : {};

            // Generar respuesta con OpenAI
            const openai = await getOpenAIClient();

            // Construir mensajes para GPT
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: producto
                        ? buildSystemPrompt(producto, config)
                        : `Eres el asistente de ventas de ${config?.nombre_tienda || 'Nexus Tech'}. Ayuda al cliente con sus consultas.`
                },
                // Agregar historial de chat
                ...conversacion.historial_chat.map(msg => ({
                    role: msg.rol === 'cliente' ? 'user' as const : 'assistant' as const,
                    content: msg.contenido
                }))
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                max_tokens: 300,
                temperature: 0.7
            });

            const respuestaIA = completion.choices[0].message.content || 'Lo siento, hubo un error. ¿Podrías repetir tu pregunta?';

            // Agregar respuesta IA al historial
            const mensajeIA: MensajeChat = {
                rol: 'ia',
                contenido: respuestaIA,
                timestamp: new Date().toISOString()
            };
            conversacion.historial_chat.push(mensajeIA);

            // Detectar intención de compra y actualizar estado
            const mensajeLower = mensaje.toLowerCase();
            if (mensajeLower.includes('comprar') || mensajeLower.includes('me interesa') || mensajeLower.includes('cuánto')) {
                conversacion.estado = 'negociando';
            }

            // Detectar datos de envío en el mensaje (análisis básico)
            if (conversacion.estado === 'negociando' &&
                (mensajeLower.includes('calle') || mensajeLower.includes('dirección') || mensajeLower.includes('enviar a'))) {
                conversacion.estado = 'esperando_pago';
            }

            // Detectar comprobante de pago
            if (mensajeLower.includes('comprobante') || mensajeLower.includes('pagué') || mensajeLower.includes('transferí')) {
                conversacion.estado = 'cerrada';
                conversacion.pago_confirmado = true;

                // Crear pedido de despacho
                if (producto) {
                    await db.collection('pedidos_despacho').add({
                        conversacion_id: conversacionRef.id,
                        cliente_datos: conversacion.datos_envio || {
                            nombre_completo: conversacion.cliente_nombre,
                            telefono: conversacion.cliente_telefono,
                            direccion: 'Pendiente confirmar',
                            ciudad: 'Pendiente confirmar'
                        },
                        producto_id: producto.id,
                        producto_nombre: producto.nombre,
                        cantidad: 1,
                        precio_unitario: producto.precio_retail,
                        total: producto.precio_retail,
                        costo_total: producto.costo_compra,
                        ganancia_neta: producto.precio_retail - producto.costo_compra,
                        comprobante_url: '',
                        plataforma: conversacion.plataforma,
                        estado: 'pendiente',
                        created_at: new Date().toISOString()
                    });

                    // Actualizar stock
                    await db.collection('productos').doc(producto.id!).update({
                        stock: admin.firestore.FieldValue.increment(-1),
                        updated_at: new Date().toISOString()
                    });
                }
            }

            // Guardar conversación actualizada
            await conversacionRef.update({
                historial_chat: conversacion.historial_chat,
                estado: conversacion.estado,
                pago_confirmado: conversacion.pago_confirmado,
                updated_at: new Date().toISOString()
            });

            // Actualizar log como procesado
            await db.collection('webhooks_log')
                .where('created_at', '>=', new Date(Date.now() - 5000).toISOString())
                .limit(1)
                .get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        snapshot.docs[0].ref.update({
                            procesado: true,
                            respuesta_ia: respuestaIA
                        });
                    }
                });

            res.status(200).json({
                success: true,
                conversacion_id: conversacionRef.id,
                respuesta: respuestaIA,
                estado: conversacion.estado
            });

        } catch (error: any) {
            console.error('Error procesando mensaje:', error);
            res.status(500).json({
                error: 'Error interno',
                message: error.message
            });
        }
    });
});

// ============================================
// WEBHOOK: FACEBOOK MESSENGER
// ============================================

export const webhookFacebook = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Verificación del webhook (GET request de Meta)
        if (req.method === 'GET') {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
                res.status(200).send(challenge);
                return;
            }
            res.status(403).send('Forbidden');
            return;
        }

        // Procesar mensaje (POST request)
        try {
            const body = req.body;

            if (body.object === 'page') {
                for (const entry of body.entry) {
                    const webhookEvent = entry.messaging?.[0];
                    if (webhookEvent?.message) {
                        // Log del mensaje recibido
                        console.log('FB Message from:', webhookEvent.sender.id);
                        console.log('Message text:', webhookEvent.message.text);

                        // Guardar en webhooks_log para procesamiento
                        await db.collection('webhooks_log').add({
                            plataforma: 'facebook',
                            payload: webhookEvent,
                            sender_id: webhookEvent.sender.id,
                            message_text: webhookEvent.message.text,
                            procesado: false,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }

            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error webhook Facebook:', error);
            res.status(500).send('Error');
        }
    });
});

// ============================================
// FUNCIÓN: NOTIFICAR VENTA CERRADA
// ============================================

export const notificarVentaCerrada = functions.firestore
    .document('pedidos_despacho/{pedidoId}')
    .onCreate(async (snap, context) => {
        const pedido = snap.data();

        // Obtener configuración para futuras notificaciones
        const configDoc = await db.collection('configuracion_ia').doc('default').get();
        const configData = configDoc.data();
        console.log('Config loaded:', configData?.nombre_tienda || 'Nexus Tech');

        // Log de notificación
        console.log(`🎉 Nueva venta cerrada por IA!
            Producto: ${pedido.producto_nombre}
            Cliente: ${pedido.cliente_datos.nombre_completo}
            Total: $${pedido.total}
            Ganancia: $${pedido.ganancia_neta}
            Plataforma: ${pedido.plataforma}
        `);

        // Aquí se puede integrar:
        // - Email con SendGrid
        // - WhatsApp con Twilio
        // - Push notification
        // - Telegram bot

        return null;
    });

// ============================================
// FUNCIÓN: ESTADÍSTICAS DE VENTAS IA
// ============================================

export const getEstadisticasIA = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            // Conversaciones activas
            const conversacionesActivas = await db.collection('conversaciones')
                .where('estado', 'in', ['activa', 'negociando', 'esperando_pago'])
                .get();

            // Ventas cerradas hoy
            const ventasHoy = await db.collection('pedidos_despacho')
                .where('created_at', '>=', hoy.toISOString())
                .get();

            let totalVentasHoy = 0;
            let gananciaHoy = 0;
            ventasHoy.forEach(doc => {
                const data = doc.data();
                totalVentasHoy += data.total || 0;
                gananciaHoy += data.ganancia_neta || 0;
            });

            // Pedidos pendientes de despacho
            const pedidosPendientes = await db.collection('pedidos_despacho')
                .where('estado', '==', 'pendiente')
                .get();

            res.status(200).json({
                conversaciones_activas: conversacionesActivas.size,
                ventas_hoy: ventasHoy.size,
                total_ventas_hoy: totalVentasHoy,
                ganancia_hoy: gananciaHoy,
                pedidos_pendientes: pedidosPendientes.size
            });

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });
});
