"use strict";
/**
 * NEXUS AUTO-SALES
 * Central de Integraciones & Inteligencia Artificial
 *
 * Arquitectura:
 * 1. Webhooks (Meta/ML) -> Reciben evento HTTP -> Guardan en 'mensajes_entrantes'
 * 2. Trigger (Firestore) -> Detecta nuevo mensaje -> Llama a GPT-4o -> Genera Respuesta
 * 3. Sender (API) -> Envía respuesta a la plataforma correspondiente
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReengagementCampaign = exports.getEstadisticasIA = exports.notificarVentaCerrada = exports.procesarMensajeManual = exports.procesarMensajeEntrante = exports.webhookMercadoLibre = exports.webhookMeta = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const corsHandler = (0, cors_1.default)({ origin: true });
// ============================================
// HELPERS Y CONFIGURACIÓN
// ============================================
async function getOpenAIClient() {
    const configDoc = await db.collection('configuracion_ia').doc('default').get();
    const config = configDoc.data();
    if (!(config === null || config === void 0 ? void 0 : config.openai_api_key))
        throw new Error('OpenAI API Key no configurada');
    return new openai_1.default({ apiKey: config.openai_api_key });
}
async function getGeminiResponse(prompt, history, apiKey) {
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: prompt,
    });
    // Convertir historial al formato de Gemini
    const contents = await Promise.all(history.map(async (m) => {
        const parts = [{ text: m.contenido }];
        if (m.tipo === 'imagen' && m.url) {
            try {
                // Descargar imagen y convertir a base64
                const response = await axios_1.default.get(m.url, { responseType: 'arraybuffer' });
                const base64Data = Buffer.from(response.data, 'binary').toString('base64');
                const mimeType = response.headers['content-type'];
                parts.unshift({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            }
            catch (error) {
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
async function getProductDetails(searchKey) {
    if (!searchKey)
        return "";
    // 1. Buscar por ID directo
    let doc = await db.collection('productos').doc(searchKey).get();
    // 2. Si no existe, buscar por SKU
    if (!doc.exists) {
        const query = await db.collection('productos').where('sku', '==', searchKey).limit(1).get();
        if (!query.empty) {
            doc = query.docs[0];
        }
    }
    if (!doc.exists)
        return "";
    const p = doc.data();
    if (!p.activo)
        return `[SISTEMA: El producto '${p.nombre}' está DESCATALOGADO o INACTIVO. Infórmalo amablemente.]`;
    return `
    [CONTEXTO DEL PRODUCTO SELECCIONADO]
    - Nombre: ${p.nombre}
    - SKU: ${p.sku}
    - Precio: $${p.precio_retail}
    - Stock Actual: ${p.stock} unidades
    - Descripción Técnica: ${p.descripcion_ia || 'Sin descripción específica.'}
    - LINK DE PAGO: ${p.link_pago_base || 'No disponible (Solicitar generación manual)'}
    
    [INSTRUCCIONES DE VENTA]
    1. Si el stock es 0, di que no hay disponible.
    2. Usa la información de precio y características para responder dudas.
    3. Si preguntan precio, dalo exactamente como figura aquí.
    4. CIERRE DE VENTA: Si el cliente confirma interés, envía EXCLUSIVAMENTE este link de pago: ${p.link_pago_base || '(Indica que generarás uno)'}
    `.trim();
}
// ============================================
// 1. WEBHOOKS PÚBLICOS (ENTRADA)
// ============================================
// Webhook Unificado para Meta (WhatsApp, Instagram, Messenger)
exports.webhookMeta = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // A) Verificación del Token
        if (req.method === 'GET') {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'nexus_secure_token')) {
                res.status(200).send(challenge);
            }
            else {
                res.status(403).send('Forbidden');
            }
            return;
        }
        // B) Recepción de Mensajes
        try {
            const body = req.body;
            console.log('Meta Webhook Payload:', JSON.stringify(body, null, 2));
            if (body.object === 'whatsapp_business_account') {
                await handleWhatsApp(body);
            }
            else if (body.object === 'page' || body.object === 'instagram') {
                await handleFacebokInstagram(body);
            }
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (error) {
            console.error('Error procesando webhook Meta:', error);
            res.status(500).send('Error interno');
        }
    });
});
async function handleWhatsApp(body) {
    var _a, _b, _c, _d, _e;
    const entry = (_a = body.entry) === null || _a === void 0 ? void 0 : _a[0];
    const changes = (_b = entry === null || entry === void 0 ? void 0 : entry.changes) === null || _b === void 0 ? void 0 : _b[0];
    const value = changes === null || changes === void 0 ? void 0 : changes.value;
    if (!value)
        return;
    const message = (_c = value.messages) === null || _c === void 0 ? void 0 : _c[0];
    const contact = (_d = value.contacts) === null || _d === void 0 ? void 0 : _d[0];
    if (message) {
        let texto = '';
        let tipo = 'texto';
        let url = undefined;
        if (message.type === 'text') {
            texto = message.text.body;
        }
        else if (message.type === 'image') {
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
            sender_name: ((_e = contact === null || contact === void 0 ? void 0 : contact.profile) === null || _e === void 0 ? void 0 : _e.name) || 'Cliente WhatsApp',
            texto: texto,
            tipo: tipo,
            url: url,
            contexto_externo: contexto,
            timestamp: new Date().toISOString(),
            procesado: false
        });
    }
}
async function handleFacebokInstagram(body) {
    var _a, _b;
    const entry = (_a = body.entry) === null || _a === void 0 ? void 0 : _a[0];
    const messaging = (_b = entry === null || entry === void 0 ? void 0 : entry.messaging) === null || _b === void 0 ? void 0 : _b[0];
    if (messaging) {
        const senderId = messaging.sender.id;
        const message = messaging.message;
        let texto = message.text || '';
        let tipo = 'texto';
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
            if (!texto)
                texto = "Hola, vi esto en Marketplace";
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
exports.webhookMercadoLibre = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            console.error('Error webhook ML:', error);
            res.status(500).send('Error');
        }
    });
});
// ============================================
// 2. TRIGGER DE PROCESAMIENTO (CEREBRO IA)
// ============================================
async function saveOrUpdateLead(senderId, platform, name, context) {
    const leadId = `${platform}_${senderId}`; // ID único compuesto
    const docRef = db.collection('clientes_leads').doc(leadId);
    try {
        const doc = await docRef.get();
        if (doc.exists) {
            // Actualizar Lead existente
            await docRef.update(Object.assign({ interacciones_count: admin.firestore.FieldValue.increment(1), updated_at: new Date().toISOString() }, (name !== 'Usuario Meta' && name !== 'Cliente WhatsApp' ? { nombre: name } : {})));
        }
        else {
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
    }
    catch (error) {
        console.error('[CRM] Error guardando lead:', error);
    }
}
exports.procesarMensajeEntrante = functions.firestore
    .document('mensajes_entrantes/{msgId}')
    .onCreate(async (snap, context) => {
    const payload = snap.data();
    if (payload.procesado)
        return;
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
        let historialChat = [];
        let conversacionData = {};
        if (!convQuery.empty) {
            const convDoc = convQuery.docs[0];
            conversacionId = convDoc.id;
            conversacionData = convDoc.data();
            historialChat = conversacionData.historial_chat || [];
        }
        else {
            // Nueva Conversación
            const nuevaConv = {
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
                }
                else {
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
            const faqs = config.knowledge_base.map((qa) => `P: ${qa.pregunta} R: ${qa.respuesta}`).join('\n');
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
        }
        else if (config.openai_api_key) {
            console.log('Utilizando OpenAI GPT-4o...');
            const openai = await getOpenAIClient();
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...historialChat.map(m => ({
                        role: (m.rol === 'cliente' ? 'user' : 'assistant'),
                        content: m.contenido
                    }))
                ],
                max_tokens: 150,
                temperature: 0.7
            });
            respuestaIA = completion.choices[0].message.content || "Lo siento, ¿puedes repetir?";
        }
        else {
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
        }
        else if (lowerRes.includes('datos de envío') || lowerRes.includes('dirección')) {
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
    }
    catch (error) {
        console.error('Error en procesarMensajeEntrante:', error);
    }
});
// Mantener endpoint HTTP para pruebas manuales desde Postman/Frontend Simulator
exports.procesarMensajeManual = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Envolver lógica de simulador web
        // Simplemente guarda en 'mensajes_entrantes' y deja que el trigger haga el trabajo
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
        }
        catch (e) {
            res.status(500).json({ error: e instanceof Error ? e.message : 'Error desconocido' });
        }
    });
});
// ============================================
// FUNCIONES NOTIFICACIÓN Y ESTADÍSTICAS (LEGACY)
// ============================================
exports.notificarVentaCerrada = functions.firestore
    .document('pedidos_despacho/{pedidoId}')
    .onCreate(async (snap) => {
    const pedido = snap.data();
    console.log(`💰 VENTA CERRADA: ${pedido.producto_nombre} - $${pedido.total}`);
    return null;
});
exports.getEstadisticasIA = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            res.status(500).send(error.message);
        }
    });
});
// ============================================
// 3. CAMPAÑAS AUTOMATIZADAS (MARKETING)
// ============================================
exports.runReengagementCampaign = functions.https.onRequest(async (req, res) => {
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
        const results = [];
        await Promise.all(leadsQuery.docs.map(async (doc) => {
            const lead = doc.data();
            // Evitar re-enviar si ya fue contactado recientemente (campo custom)
            if (lead.last_reengagement && new Date(lead.last_reengagement) > yesterday)
                return;
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
    }
    catch (error) {
        console.error('Error en campaña:', error);
        res.status(500).json({ error: error.message });
    }
});
//# sourceMappingURL=index.js.map