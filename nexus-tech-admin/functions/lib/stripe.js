"use strict";
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
exports.createCheckoutSession = createCheckoutSession;
exports.handleStripeWebhook = handleStripeWebhook;
const stripe_1 = __importDefault(require("stripe"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Inicializar Stripe con la clave secreta (desde variables de entorno)
// Nota: En desarrollo local, se puede usar una clave hardcodeada si no se configuran env vars, pero NO en producción.
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER', {
    apiVersion: '2023-10-16', // Cast to any to avoid version mismatch errors
});
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_PLACEHOLDER';
/**
 * Crea una sesión de Checkout en Stripe
 */
async function createCheckoutSession(payload) {
    try {
        const line_items = payload.items.map(item => ({
            price_data: {
                currency: 'cop', // Moneda por defecto
                product_data: {
                    name: item.nombre,
                    metadata: { sku: item.sku }
                },
                unit_amount: Math.round(item.precio_unitario * 100), // Stripe usa centavos (COP no tiene decimales generalmente, pero Stripe requiere entero)
                // OJO: Para COP en Stripe, 1000 COP se envían como 1000. 
                // Sin embargo, si la moneda fuese USD, 10.00 USD son 1000 centavos.
                // Ajuste para COP: Stripe considera COP como "zero-decimal" en algunas APIs antiguas, pero modernamente usa centavos.
                // Verificación rápida: COP es una moneda decimal? Oficialmente tiene 2 decimales pero no se usan.
                // Stripe trata COP con 2 decimales. 1000 pesos => 100000 cents.
                // NOTA IMPORTANTE: Si el precio viene en pesos ENTEROS (ej. 150000), multiplicar por 100.
            },
            quantity: item.cantidad,
        }));
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: payload.success_url,
            cancel_url: payload.cancel_url,
            customer_email: payload.customer_email,
            client_reference_id: payload.orderId, // Para vincular el webhook
            metadata: {
                orderId: payload.orderId
            }
        });
        return { url: session.url, sessionId: session.id };
    }
    catch (error) {
        console.error('Error creating Stripe session:', error);
        throw new Error(error.message);
    }
}
/**
 * Maneja el Webhook de Stripe para actualizar el estado del pedido
 */
async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        // Verificar firma del webhook (seguridad crítica)
        event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
    }
    catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Manejar el evento
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const orderId = session.client_reference_id;
            if (orderId) {
                console.log(`✅ Pago recibido para Orden: ${orderId}`);
                // Actualizar Firestore
                try {
                    await db.collection('pedidos_despacho').doc(orderId).update({
                        pago_estado: 'pagado',
                        pago_provider: 'stripe',
                        pago_id: session.payment_intent || session.id,
                        updated_at: new Date().toISOString()
                    });
                    console.log(`Orden ${orderId} actualizada a PAGADO.`);
                }
                catch (dbError) {
                    console.error('Error actualizando DB:', dbError);
                }
            }
            break;
        // Se pueden manejar otros eventos como 'payment_intent.payment_failed'
        default:
            console.log(`Evento no manejado: ${event.type}`);
    }
    res.json({ received: true });
}
//# sourceMappingURL=stripe.js.map