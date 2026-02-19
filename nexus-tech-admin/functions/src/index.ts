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
import axios from 'axios';
import { LogisticsFactory } from './logistics/factory';
import { validateFirebaseIdToken } from './middleware/auth';

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// interfaces
interface ChatMessage {
    rol: 'cliente' | 'ia';
    tipo?: 'texto' | 'imagen';
    url?: string;
    contenido: string;
    timestamp: string;
}

interface Conversacion {
    cliente_id: string;
    cliente_nombre: string;
    plataforma: string;
    estado: string;
    created_at: string;
    updated_at: string;
    historial_chat: ChatMessage[];
    producto_nombre?: string;
    pago_confirmado?: boolean;
    ultimo_mensaje?: string;
    producto_interes?: string; // ID o SKU del producto
    contexto_inicial?: string;
}

interface Producto {
    id: string;
    sku: string;
    nombre: string;
    descripcion_ia?: string;
    precio_retail: number;
    precio_b2b: number; // Nuevo campo
    stock: number;
    link_pago_base?: string;
    activo: boolean;
}

// Interfaces para Payloads
interface MetaPayload {
    object: string;
    entry: any[];
}

// ============================================
// HELPERS Y CONFIGURACIÓN
// ============================================

async function getOpenAIClient(): Promise<OpenAI> {
    const configDoc = await db.collection('configuracion_ia').doc('default').get();
    const config = configDoc.data();
    if (!config?.openai_api_key) throw new Error('OpenAI API Key no configurada');
    return new OpenAI({ apiKey: config.openai_api_key });
}

async function getGeminiResponse(prompt: string, history: ChatMessage[], apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: prompt,
    });

    // Convertir historial al formato de Gemini
    const contents = await Promise.all(history.map(async m => {
        const parts: any[] = [{ text: m.contenido }];

        if (m.tipo === 'imagen' && m.url) {
            try {
                // Descargar imagen y convertir a base64
                const response = await axios.get(m.url, { responseType: 'arraybuffer' });
                const base64Data = Buffer.from(response.data, 'binary').toString('base64');
                const mimeType = response.headers['content-type'];

                parts.unshift({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            } catch (error) {
                console.error('Error descargando imagen para Gemini:', error);
                parts.push({ text: "[Error procesando imagen adjunta]" });
            }
        }

        return {
            role: m.rol === 'cliente' ? 'user' : 'model',
            parts: parts
        };
    }));

    const result = await model.generateContent({
        contents: contents,
        generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
        },
    });

    return result.response.text();
}

async function getProductDetails(searchKey: string): Promise<string> {
    if (!searchKey) return "";

    // 1. Buscar por ID directo
    let doc = await db.collection('productos').doc(searchKey).get();

    // 2. Si no existe, buscar por SKU
    if (!doc.exists) {
        const query = await db.collection('productos').where('sku', '==', searchKey).limit(1).get();
        if (!query.empty) {
            doc = query.docs[0];
        }
    }

    if (!doc.exists) return "";

    const p = doc.data() as Producto;
    if (!p.activo) return `[SISTEMA: El producto '${p.nombre}' está DESCATALOGADO o INACTIVO. Infórmalo amablemente.]`;

    return `
    [CONTEXTO DEL PRODUCTO SELECCIONADO]
    - Nombre: ${p.nombre}
    - SKU: ${p.sku}
    - Precio: $${p.precio_retail} COP
    - Stock Actual: ${p.stock} unidades
    - Descripción Técnica: ${p.descripcion_ia || 'Sin descripción específica.'}
    - LINK DE PAGO: ${p.link_pago_base || 'No disponible (Solicitar generación manual)'}
    
    [INSTRUCCIONES DE VENTA]
    1. Si el stock es 0, di que no hay disponible.
    2. Usa la información de precio y características para responder dudas.
    3. Si preguntan precio, siempre menciona que es en PESOS COLOMBIANOS (COP).
    4. CIERRE DE VENTA: Si el cliente confirma interés, envía EXCLUSIVAMENTE este link de pago: ${p.link_pago_base || '(Indica que generarás uno)'}
    `.trim();
}

// ============================================
// 1. WEBHOOKS PÚBLICOS (ENTRADA)
// ============================================

// Webhook Unificado para Meta (WhatsApp, Instagram, Messenger)
export const webhookMeta = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // A) Verificación del Token
        if (req.method === 'GET') {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'nexus_secure_token')) {
                res.status(200).send(challenge);
            } else {
                res.status(403).send('Forbidden');
            }
            return;
        }

        // B) Recepción de Mensajes
        try {
            const body = req.body as MetaPayload;
            console.log('Meta Webhook Payload:', JSON.stringify(body, null, 2));

            if (body.object === 'whatsapp_business_account') {
                await handleWhatsApp(body);
            } else if (body.object === 'page' || body.object === 'instagram') {
                await handleFacebokInstagram(body);
            }

            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error procesando webhook Meta:', error);
            res.status(500).send('Error interno');
        }
    });
});

async function handleWhatsApp(body: MetaPayload) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return;

    const message = value.messages?.[0];
    const contact = value.contacts?.[0];

    if (message) {
        let texto = '';
        let tipo: 'texto' | 'imagen' = 'texto';
        let url = undefined;

        if (message.type === 'text') {
            texto = message.text.body;
        } else if (message.type === 'image') {
            tipo = 'imagen';
            texto = message.caption || '[Imagen enviada]';
            // Nota: En producción, esto requiere ID y Token para obtener la URL real
            // Por ahora simulamos o guardamos el ID
            url = `https://graph.facebook.com/v18.0/${message.image.id}`;
        }

        // Detección de Contexto (Marketplace/Ads)
        let contexto = '';
        if (message.context && message.context.id) {
            // Si viene de un Ad o Reply
            contexto = `Reply to message: ${message.context.id}`;
        }

        await db.collection('mensajes_entrantes').add({
            plataforma: 'whatsapp',
            mensaje_id: message.id,
            sender_id: message.from,
            sender_name: contact?.profile?.name || 'Cliente WhatsApp',
            texto: texto,
            tipo: tipo,
            url: url,
            contexto_externo: contexto,
            timestamp: new Date().toISOString(),
            procesado: false
        });
    }
}

async function handleFacebokInstagram(body: MetaPayload) {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (messaging) {
        const senderId = messaging.sender.id;
        const message = messaging.message;

        let texto = message.text || '';
        let tipo: 'texto' | 'imagen' = 'texto';
        let url = undefined;
        let contexto = '';

        // Detección de adjuntos (Imágenes)
        if (message.attachments && message.attachments.length > 0) {
            const attachment = message.attachments[0];
            if (attachment.type === 'image') {
                tipo = 'imagen';
                url = attachment.payload.url;
                texto = texto || '[Imagen adjunta]';
            }
        }

        // Detección de Marketplace Referral (Postback)
        if (messaging.referral) {
            const ref = messaging.referral;
            contexto = `Marketplace Ad Source: ${ref.source}, Ref: ${ref.ref}`;
            if (!texto) texto = "Hola, vi esto en Marketplace";
        }

        await db.collection('mensajes_entrantes').add({
            plataforma: body.object === 'instagram' ? 'instagram' : 'facebook',
            mensaje_id: message.mid,
            sender_id: senderId,
            sender_name: 'Usuario Meta', // FB no envía nombre aquí
            texto: texto,
            tipo: tipo,
            url: url,
            contexto_externo: contexto,
            timestamp: new Date().toISOString(),
            procesado: false
        });
    }
}

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

async function saveOrUpdateLead(senderId: string, platform: string, name: string, context?: string) {
    const leadId = `${platform}_${senderId}`; // ID único compuesto
    const docRef = db.collection('clientes_leads').doc(leadId);

    try {
        const doc = await docRef.get();
        if (doc.exists) {
            // Actualizar Lead existente
            await docRef.update({
                interacciones_count: admin.firestore.FieldValue.increment(1),
                updated_at: new Date().toISOString(),
                // Si el nombre era genérico y ahora tenemos uno mejor, actualizarlo
                ...(name !== 'Usuario Meta' && name !== 'Cliente WhatsApp' ? { nombre: name } : {})
            });
        } else {
            // Crear Nuevo Lead
            const newLead = {
                id: leadId,
                nombre: name || 'Prospecto Desconocido',
                telefono: platform === 'whatsapp' ? senderId : '',
                facebook_id: platform === 'facebook' ? senderId : '',
                instagram_user: platform === 'instagram' ? senderId : '',
                plataforma_origen: platform,
                origen: 'Chat IA Inbound',
                estado_conversion: 'frio', // frio | tibio | caliente
                interacciones_count: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                contexto_inicial: context || ''
            };
            await docRef.set(newLead);
            console.log(`[CRM] Nuevo Lead capturado: ${name} (${leadId})`);
        }
    } catch (error) {
        console.error('[CRM] Error guardando lead:', error);
    }
}

export const procesarMensajeEntrante = functions.firestore
    .document('mensajes_entrantes/{msgId}')
    .onCreate(async (snap, context) => {
        const payload = snap.data();
        if (payload.procesado) return;

        try {
            let textoUsuario = payload.texto;
            let clienteNombre = payload.sender_name;
            let clienteId = payload.sender_id;

            // [CRM] Guardar o Actualizar Lead al recibir mensaje
            await saveOrUpdateLead(clienteId, payload.plataforma, clienteNombre, payload.contexto_externo);

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

            let historialChat: ChatMessage[] = [];
            let conversacionData: Partial<Conversacion> = {};

            if (!convQuery.empty) {
                const convDoc = convQuery.docs[0];
                conversacionId = convDoc.id;
                conversacionData = convDoc.data();
                historialChat = conversacionData.historial_chat || [];
            } else {
                // Nueva Conversación
                const nuevaConv: any = {
                    cliente_id: clienteId,
                    cliente_nombre: clienteNombre,
                    plataforma: payload.plataforma,
                    estado: 'activa',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    historial_chat: [],
                    producto_nombre: 'Consulta General',
                    contexto_inicial: payload.contexto_externo || '',
                    pago_confirmado: false
                };

                // Intentar inferir producto del contexto (Ref: XXXXX)
                if (payload.contexto_externo && payload.contexto_externo.includes('Ref:')) {
                    const match = payload.contexto_externo.match(/Ref:\s*(\w+)/);
                    if (match && match[1]) {
                        nuevaConv.producto_interes = match[1];
                        nuevaConv.producto_nombre = 'Producto #' + match[1];
                    } else {
                        nuevaConv.producto_nombre = 'Artículo de Marketplace';
                    }
                }

                const ref = await db.collection('conversaciones').add(nuevaConv);
                conversacionId = ref.id;
                conversacionData = nuevaConv;
            }

            // 2. Agregar mensaje del usuario
            historialChat.push({
                rol: 'cliente',
                contenido: textoUsuario,
                tipo: payload.tipo === 'imagen' ? 'imagen' : 'texto',
                url: payload.url,
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

            // INYECCIÓN DE CONTEXTO DE PRODUCTO
            if (conversacionData.producto_interes) {
                console.log(`Buscando info de producto: ${conversacionData.producto_interes}`);
                const productContext = await getProductDetails(conversacionData.producto_interes);
                if (productContext) {
                    systemPrompt += `\n\n${productContext}`;
                }
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
                // [CRM] Upgrade a Caliente si pide pago
                await db.collection('clientes_leads').doc(`${payload.plataforma}_${clienteId}`).update({
                    estado_conversion: 'caliente',
                    updated_at: new Date().toISOString()
                }).catch(e => console.error('Error actualizando estado lead:', e));

            } else if (lowerRes.includes('datos de envío') || lowerRes.includes('dirección')) {
                nuevoEstado = 'negociando';
                // [CRM] Upgrade a Tibio/Caliente si da datos
                await db.collection('clientes_leads').doc(`${payload.plataforma}_${clienteId}`).update({
                    estado_conversion: 'caliente',
                    updated_at: new Date().toISOString()
                }).catch(e => console.error('Error actualizando estado lead:', e));
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
// Mantener endpoint HTTP para pruebas manuales desde Postman/Frontend Simulator
export const procesarMensajeManual = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Auth Middleware: Proteger simulación manual
        await validateFirebaseIdToken(req, res, async () => {
            try {
                const { mensaje, cliente_id, plataforma, image_url } = req.body;
                await db.collection('mensajes_entrantes').add({
                    plataforma: plataforma || 'web',
                    texto: mensaje,
                    tipo: image_url ? 'imagen' : 'texto',
                    url: image_url,
                    sender_id: cliente_id || 'web-user',
                    sender_name: 'Usuario Web',
                    timestamp: new Date().toISOString(),
                    procesado: false
                });
                res.json({ success: true, message: 'Mensaje encolado para IA' });
            } catch (e: any) {
                res.status(500).json({ error: e instanceof Error ? e.message : 'Error desconocido' });
            }
        });
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

// ============================================
// 4. GESTIÓN DE PEDIDOS Y PAGOS (TRANSACTIONAL LAYER)
// ============================================

interface OrderItem {
    producto_id: string;
    sku: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface OrderPayload {
    cliente_id: string;
    cliente_nombre: string;
    plataforma: string;
    items: OrderItem[];
    total: number;
    datos_envio?: {
        direccion: string;
        ciudad: string;
        telefono: string;
    };
    origen_pago: string; // 'stripe', 'mercadopago', 'simulado', 'credito_b2b'
    external_reference?: string;
    referral_code?: string; // Nuevo campo para afiliados
    es_b2b?: boolean;      // Nuevo campo para identificar venta corporativa
}

async function createOrder(payload: OrderPayload) {
    const orderRef = db.collection('pedidos_despacho').doc();

    await db.runTransaction(async (t) => {
        // 0. VALIDACIONES DE NEGOCIO (B2B)
        if (payload.es_b2b) {
            const clienteRef = db.collection('clientes_b2b').doc(payload.cliente_id);
            const clienteDoc = await t.get(clienteRef);

            if (!clienteDoc.exists) throw new Error(`Cliente B2B ${payload.cliente_id} no encontrado`);

            const clienteData = clienteDoc.data()!;
            const nuevoSaldo = (clienteData.saldo_pendiente || 0) + payload.total;

            if (nuevoSaldo > clienteData.linea_credito) {
                throw new Error(`Crédito insuficiente. Línea: $${clienteData.linea_credito} | Saldo actual: $${clienteData.saldo_pendiente} | Intento: $${payload.total}`);
            }

            // Actualizar Saldo
            t.update(clienteRef, {
                saldo_pendiente: nuevoSaldo,
                updated_at: new Date().toISOString()
            });
            console.log(`[B2B] Crédito aprobado para ${clienteData.razon_social}. Nuevo saldo: $${nuevoSaldo}`);
        }

        // 1. Verificar Stock de todos los items
        const stockUpdates: { ref: admin.firestore.DocumentReference, newStock: number }[] = [];

        for (const item of payload.items) {
            const prodRef = db.collection('productos').doc(item.producto_id);
            const prodDoc = await t.get(prodRef);

            if (!prodDoc.exists) throw new Error(`Producto ${item.sku} no existe`);

            const prodData = prodDoc.data() as Producto;
            if (prodData.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${prodData.stock}`);
            }

            stockUpdates.push({ ref: prodRef, newStock: prodData.stock - item.cantidad });
        }

        // 2. Descontar Stock
        for (const update of stockUpdates) {
            t.update(update.ref, {
                stock: update.newStock,
                updated_at: new Date().toISOString()
            });
        }

        // 3. GESTIÓN DE AFILIADOS
        let affiliateId = null;
        let comisionGenerada = 0;

        if (payload.referral_code) {
            const afiQuery = await t.get(db.collection('afiliados').where('codigo_referido', '==', payload.referral_code).limit(1));

            if (!afiQuery.empty) {
                const afiDoc = afiQuery.docs[0];
                const afiData = afiDoc.data();

                // Calcular Comisión
                comisionGenerada = (payload.total * afiData.comision_porcentaje) / 100;
                affiliateId = afiDoc.id;

                // Actualizar Balance Afiliado
                t.update(afiDoc.ref, {
                    balance_acumulado: admin.firestore.FieldValue.increment(comisionGenerada),
                    updated_at: new Date().toISOString()
                });

                console.log(`[AFILIADOS] Comisión de $${comisionGenerada} generada para ${afiData.nombre} (Ref: ${payload.referral_code})`);
            }
        }

        // 4. LOGÍSTICA AUTOMATIZADA (MODULAR ADAPTER)
        const logisticsProvider = LogisticsFactory.getProvider();
        let despachoEstado = 'pendiente';
        let courierAsignado = null;
        let gastosEnvio = 0;
        let trackingNumber = '';

        if (payload.datos_envio?.ciudad) {
            try {
                // Obtener cotización y generar guía
                const shipment = await logisticsProvider.createShipment({
                    ...payload,
                    id: orderRef.id
                });

                courierAsignado = shipment.courier_name;
                gastosEnvio = shipment.cost;
                trackingNumber = shipment.tracking_number;
                despachoEstado = shipment.estimated_days <= 1 ? 'preparando' : 'pendiente';

                console.log(`[DISPATCH] Asignado a ${courierAsignado} (Tracking: ${trackingNumber})`);
            } catch (logisticsError) {
                console.error('Error en logística:', logisticsError);
                // Fallback a manual
                despachoEstado = 'error_logistica';
            }
        }

        // 5. Crear Pedido
        t.set(orderRef, {
            id: orderRef.id,
            cliente_id: payload.cliente_id,
            cliente_nombre: payload.cliente_nombre,
            plataforma: payload.plataforma,
            items: payload.items,
            total: payload.total,
            gastos_envio: gastosEnvio,
            total_con_envio: payload.total + gastosEnvio,
            estado: despachoEstado,
            pago_estado: payload.origen_pago === 'credito_b2b' ? 'credito' : 'pagado',
            origen_pago: payload.origen_pago,
            external_reference: payload.external_reference || '',
            datos_envio: payload.datos_envio || {},
            es_b2b: payload.es_b2b || false,
            afiliado_id: affiliateId,
            comision_afiliado: comisionGenerada,
            courier_asignado: courierAsignado,
            tracking_number: trackingNumber,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // 5. Actualizar Lead a "Comprador" (Si no es B2B)
        if (!payload.es_b2b) {
            const leadRef = db.collection('clientes_leads').doc(`${payload.plataforma}_${payload.cliente_id}`);
            t.set(leadRef, {
                estado_conversion: 'comprador',
                ultima_compra: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { merge: true });
        }
    });

    console.log(`✅ Pedido Creado Exitosamente: ${orderRef.id} por $${payload.total}`);
    return orderRef.id;
}

// Webhook Simulado de Pago (Para pruebas sin Gateway real)
export const webhookPagoSimulado = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { sku, cantidad, cliente_id, cliente_nombre, plataforma, direccion, referral_code, es_b2b } = req.body;

            if (!sku || !cliente_id) {
                res.status(400).json({ error: 'Faltan datos (sku, cliente_id)' });
                return;
            }

            // Buscar producto por SKU
            const prodQuery = await db.collection('productos').where('sku', '==', sku).limit(1).get();
            if (prodQuery.empty) {
                res.status(404).json({ error: 'Producto no encontrado' });
                return;
            }
            const prodDoc = prodQuery.docs[0];
            const prodData = prodDoc.data() as Producto;

            const qty = cantidad || 1;
            // Si es B2B, usar precio B2B
            const unitPrice = es_b2b ? prodData.precio_b2b : prodData.precio_retail;
            const total = unitPrice * qty;

            const orderId = await createOrder({
                cliente_id,
                cliente_nombre: cliente_nombre || (es_b2b ? 'Empresa B2B' : 'Cliente Web'),
                plataforma: plataforma || 'web',
                items: [{
                    producto_id: prodDoc.id,
                    sku: prodData.sku,
                    nombre: prodData.nombre,
                    cantidad: qty,
                    precio_unitario: unitPrice,
                    subtotal: total
                }],
                total: total,
                origen_pago: es_b2b ? 'credito_b2b' : 'simulado',
                datos_envio: {
                    direccion: direccion || 'Dirección de prueba',
                    ciudad: 'Ciudad Demo',
                    telefono: cliente_id
                },
                external_reference: `SIM-${Date.now()}`,
                referral_code,
                es_b2b
            });

            res.json({ success: true, order_id: orderId, message: 'Orden procesada correctamente.' });

        } catch (error: any) {
            console.error('Error en pago simulado:', error);
            res.status(500).json({ error: error.message });
        }
    });
});




export const runReengagementCampaign = functions.https.onRequest(async (req, res) => {
    // Seguridad básica (en prod usar Bearer Token)
    if (req.query.key !== (process.env.CRON_KEY || 'nexus_cron_secret')) {
        res.status(403).send('Forbidden');
        return;
    }

    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24h atrás

        // Buscar leads 'tibios' o 'calientes' que no se actualizan hace > 24h
        const leadsQuery = await db.collection('clientes_leads')
            .where('estado_conversion', 'in', ['tibio', 'caliente'])
            .where('updated_at', '<', yesterday.toISOString())
            .limit(10) // Límite de seguridad para MVP
            .get();

        const results: any[] = [];

        await Promise.all(leadsQuery.docs.map(async (doc) => {
            const lead = doc.data();
            // Evitar re-enviar si ya fue contactado recientemente (campo custom)
            if (lead.last_reengagement && new Date(lead.last_reengagement) > yesterday) return;

            // Generar Mensaje de Reactivación
            let mensajeNudge = `Hola ${lead.nombre}, notamos que te interesaste en nuestros productos. ¿Sigues buscando?`;

            // Si hay contexto, personalizar
            if (lead.contexto_inicial) {
                mensajeNudge = `Hola ${lead.nombre}, vimos que preguntaste por un artículo en Marketplace. Aún tenemos stock disponible. ¿Te gustaría reservarlo?`;
            }

            // [MOCK] Enviar mensaje
            // Aquí iría la llamada real a Meta API
            console.log(`>>> [CAMPAÑA] Enviando Nudge a ${lead.nombre} (${lead.plataforma_origen}): "${mensajeNudge}"`);

            // Actualizar Lead para no spammear
            await doc.ref.update({
                last_reengagement: now.toISOString(),
                interacciones_count: admin.firestore.FieldValue.increment(1)
            });

            results.push({ id: doc.id, nombre: lead.nombre, mensaje: mensajeNudge });
        }));

        res.json({ success: true, processed: results.length, details: results });

    } catch (error: any) {
        console.error('Error en campaña:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 6. STRIPE INTEGRATION (REAL PAYMENTS)
// ============================================

import { createCheckoutSession, handleStripeWebhook } from './stripe';

export const createStripeSession = functions.https.onRequest((req, res) => {
    // 1. CORS
    corsHandler(req, res, async () => {
        // 2. Auth Middleware
        await validateFirebaseIdToken(req, res, async () => {
            try {
                const { items, customer_email, cliente_id } = req.body;

                // 1. Crear Orden "Pendiente" en Firestore primero (para tener ID)
                // Opcional: Podríamos crearla después, pero Stripe necesita un client_reference_id
                // Vamos a reutilizar logic de createOrder pero en estado "iniciado"

                const orderRef = db.collection('pedidos_despacho').doc();
                await orderRef.set({
                    id: orderRef.id,
                    cliente_id: cliente_id || 'GUEST',
                    estado: 'creado_pendiente_pago',
                    created_at: new Date().toISOString(),
                    items // Guardar items por si acaso
                });

                // 2. Crear Sesión de Stripe
                const session = await createCheckoutSession({
                    orderId: orderRef.id, // ID De la orden en Firestore
                    items: items, // [{ nombre, precio_unitario, cantidad, sku }]
                    customer_email,
                    success_url: 'http://localhost:3000/dashboard?payment=success&order_id=' + orderRef.id, // En prod usar variable de entorno
                    cancel_url: 'http://localhost:3000/dashboard?payment=cancel'
                });

                res.json({ url: session.url });

            } catch (error: any) {
                console.error('Error creating Stripe session:', error);
                res.status(500).json({ error: error.message });
            }
        });
    });
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    // No usamos corsHandler porque Stripe llama directamente
    await handleStripeWebhook(req, res);
});
