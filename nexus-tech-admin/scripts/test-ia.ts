import 'dotenv/config';
import admin from 'firebase-admin';

// Conectar al emulador si la variable está presente
if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Connecting to Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
}

admin.initializeApp({ projectId: 'nexus-autosales' });
const db = admin.firestore();

async function run() {
    console.log('1. Setting up IA Config...');
    await db.collection('configuracion_ia').doc('default').set({
        nombre_tienda: 'Nexus Tech',
        tono_vendedor: 'profesional',
        prompt_sistema: 'Eres el vendedor de Nexus Tech. Sé amable y profesional.',
        openai_api_key: process.env.OPENAI_API_KEY || '',
        created_at: new Date().toISOString()
    });
    console.log('Config OK.');

    console.log('2. Sending message...');
    const ref = await db.collection('mensajes_entrantes').add({
        plataforma: 'whatsapp',
        texto: 'Hola, ¿tienen disponibilidad de la funda para iPhone 15? ¿Hacen envíos a Bogotá?',
        sender_id: 'test_user_' + Date.now(),
        sender_name: 'Juan Prueba',
        timestamp: new Date().toISOString(),
        procesado: false
    });
    console.log('Message ID:', ref.id);

    console.log('3. Waiting for AI response (30s timeout)...');
    for (let i = 0; i < 30; i++) {
        const snap = await ref.get();
        const data = snap.data();
        if (data?.procesado) {
            console.log('\n🤖 IA RESPONDIÓ:');
            console.log('---------------------------');
            console.log(data.respuesta_generada);
            console.log('---------------------------');
            process.exit(0);
        }
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n❌ Timeout: La IA no respondió a tiempo. Revisa los logs de las Cloud Functions.');
    process.exit(1);
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
