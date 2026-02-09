
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'nexus-autosales' });
}

const db = admin.firestore();

async function simulate() {
    console.log('🚀 Iniciando Simulación de Venta con Gemini (CJS)...');

    try {
        // 1. Asegurar configuración
        console.log('⚙️ Configurando Gemini API Key...');
        await db.collection('configuracion_ia').doc('default').set({
            nombre_tienda: 'Nexus Tech',
            gemini_api_key: 'AIzaSyBzbsZHS_09F9CYIDX-_4L9N40GIDvI7so',
            openai_api_key: '',
            prompt_sistema: 'Eres el vendedor estrella de Nexus Tech. Tu objetivo es vender accesorios de iPhone con entusiasmo y profesionalismo. Responde en español de forma concisa.',
            mensaje_bienvenida: '¡Hola! Bienvenido a Nexus Tech.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // 2. Enviar mensaje de cliente
        console.log('💬 Cliente dice: "Hola, ¿tienen fundas para el iPhone 15 Pro?"');
        const msgRef = await db.collection('mensajes_entrantes').add({
            plataforma: 'whatsapp',
            sender_id: 'user_cjs',
            sender_name: 'Fernando',
            texto: 'Hola, ¿tienen fundas para el iPhone 15 Pro?',
            timestamp: new Date().toISOString(),
            procesado: false
        });

        console.log('⏳ Esperando respuesta de Gemini...');

        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            const snap = await db.collection('mensajes_entrantes').doc(msgRef.id).get();
            const data = snap.data();

            if (data && data.procesado && data.respuesta_generada) {
                console.log('\n🤖 GEMINI RESPONDE:');
                console.log(`"${data.respuesta_generada}"`);
                return true;
            }

            await new Promise(r => setTimeout(r, 1000));
            attempts++;
            process.stdout.write('.');
        }

        console.log('\n❌ Error: Timeout esperando la respuesta.');
        return false;
    } catch (e) {
        console.error('\n❌ Error en el script:', e);
        return false;
    }
}

simulate().then(() => process.exit(0));
