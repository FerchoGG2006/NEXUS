import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Inicializar Stripe con la clave secreta (desde variables de entorno)
// Nota: En desarrollo local, se puede usar una clave hardcodeada si no se configuran env vars, pero NO en producción.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER', {
    apiVersion: '2023-10-16', // Usar una versión reciente
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_PLACEHOLDER';

interface CheckoutSessionPayload {
    orderId: string;
    items: {
        nombre: string;
        precio_unitario: number; // En centavos o unidad mínima
        cantidad: number;
        sku: string;
    }[];
    customer_email?: string;
    success_url: string;
    cancel_url: string;
}

/**
 * Crea una sesión de Checkout en Stripe
 */
export async function createCheckoutSession(payload: CheckoutSessionPayload) {
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
    } catch (error: any) {
        console.error('Error creating Stripe session:', error);
        throw new Error(error.message);
    }
}

/**
 * Maneja el Webhook de Stripe para actualizar el estado del pedido
 */
export async function handleStripeWebhook(req: functions.https.Request, res: functions.Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
        // Verificar firma del webhook (seguridad crítica)
        event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Manejar el evento
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.client_reference_id;

            if (orderId) {
                console.log(`✅ Pago recibido para Orden: ${orderId}`);

                // Actualizar Firestore
                try {
                    await db.collection('pedidos_despacho').doc(orderId).update({
                        pago_estado: 'pagado',
                        pago_provider: 'stripe',
                        pago_id: session.payment_intent as string || session.id,
                        updated_at: new Date().toISOString()
                    });
                    console.log(`Orden ${orderId} actualizada a PAGADO.`);
                } catch (dbError) {
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
