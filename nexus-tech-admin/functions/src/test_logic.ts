import * as admin from 'firebase-admin';

// Initialize Admin if not already
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'nexus-autosales'
    });
}

const db = admin.firestore();

async function testMarketplaceLogic() {
    const mockPayload = {
        object: 'page',
        entry: [{
            messaging: [{
                sender: { id: 'test_user_logic' },
                message: {
                    mid: 'mid.test_logic_123',
                    text: 'Hola, vi esto en Marketplace'
                },
                referral: {
                    source: 'MARKETPLACE',
                    ref: 'SKU-LOGIC-TEST'
                }
            }]
        }]
    };

    console.log('Simulando procesamiento de mensaje de Marketplace...');

    // Simular handleFacebokInstagram logic
    const entry = mockPayload.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging.sender.id;
    const message = messaging.message;
    const ref = messaging.referral;
    const contexto = `Marketplace Ad Source: ${ref.source}, Ref: ${ref.ref}`;

    const docData = {
        plataforma: 'facebook',
        mensaje_id: message.mid,
        sender_id: senderId,
        sender_name: 'Usuario Meta (Test Logic)',
        texto: message.text,
        tipo: 'texto',
        contexto_externo: contexto,
        timestamp: new Date().toISOString(),
        procesado: false
    };

    const res = await db.collection('mensajes_entrantes').add(docData);
    console.log('Mensaje guardado en Firestore con ID:', res.id);

    // Verificar persistencia
    const savedDoc = await res.get();
    console.log('Datos guardados:', JSON.stringify(savedDoc.data(), null, 2));

    if (savedDoc.data()?.contexto_externo.includes('SKU-LOGIC-TEST')) {
        console.log('VERIFICACIÓN EXITOSA: El contexto de Marketplace se guardó correctamente.');
    } else {
        console.error('VERIFICACIÓN FALLIDA: El contexto no coincide.');
    }
}

testMarketplaceLogic().catch(console.error);
