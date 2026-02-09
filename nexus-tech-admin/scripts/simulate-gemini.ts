
import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'nexus-autosales' });
}

const db = admin.firestore();

async function simulate() {
    console.log('🚀 Iniciando Simulación de Venta con Gemini...');

    // 1. Asegurar configuración
    console.log('⚙️ Configurando Gemini API Key...');
    await db.collection('configuracion_ia').doc('default').set({
        nombre_tienda: 'Nexus Tech',
        gemini_api_key: 'AIzaSyBzbsZHS_09F9CYIDX-_4L9N40GIDvI7so',
        openai_api_key: '',
        prompt_sistema: 'Eres el vendedor estrella de Nexus Tech. Tu objetivo es vender accesorios de iPhone con entusiasmo y profesionalismo. Responde en español.',
        mensaje_bienvenida: '¡Hola! Bienvenido a Nexus Tech.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });

    // 2. Enviar mensaje de cliente
    console.log('💬 Cliente dice: "Hola, ¿tienen fundas para el iPhone 15 Pro? ¿Qué colores hay?"');
    const msgRef = await db.collection('mensajes_entrantes').add({
        plataforma: 'whatsapp',
        sender_id: 'user_123',
        sender_name: 'Fernando',
        texto: 'Hola, ¿tienen fundas para el iPhone 15 Pro? ¿Qué colores hay?',
        timestamp: new Date().toISOString(),
        procesado: false
    });

    console.log('⏳ Esperando respuesta de Gemini (máx 20s)...');

    // 3. Monitorear el documento por la respuesta
    return new Promise((resolve) => {
        const unsubscribe = db.collection('mensajes_entrantes').doc(msgRef.id).onSnapshot((doc) => {
            const data = doc.data();
            if (data?.procesado && data.respuesta_generada) {
                console.log('\n🤖 GEMINI RESPONDE:');
                console.log(`"${data.respuesta_generada}"`);
                unsubscribe();
                resolve(true);
            }
        });

        // Timeout por si algo falla
        setTimeout(() => {
            unsubscribe();
            console.log('❌ Error: Timeout esperando la respuesta. Revisa si los emuladores están corriendo.');
            resolve(false);
        }, 20000);
    });
}

simulate().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
