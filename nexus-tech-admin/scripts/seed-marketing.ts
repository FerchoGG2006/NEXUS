
import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({ projectId: 'nexus-autosales' });
const db = admin.firestore();

async function seedMarketing() {
    console.log('🎯 Seeding Marketing Leads...');
    const leads = [
        {
            nombre: 'Roberto Soto',
            telefono: '+57 320 777 8899',
            modelo_celular_actual: 'iPhone 12',
            origen: 'Feria Presencial',
            estado_conversion: 'frio',
            ultima_compra: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            interacciones_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            nombre: 'Ana García',
            telefono: '+57 311 444 5566',
            modelo_celular_actual: 'iPhone 15 Pro',
            origen: 'Instagram',
            estado_conversion: 'comprador',
            ultima_compra: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
            interacciones_count: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    for (const lead of leads) {
        await db.collection('clientes_leads').add(lead);
        console.log(`✅ Added ${lead.nombre}`);
    }
    process.exit(0);
}

seedMarketing().catch(console.error);
