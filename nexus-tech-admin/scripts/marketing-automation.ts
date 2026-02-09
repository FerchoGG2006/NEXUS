
import admin from 'firebase-admin';

// Inicializar Firebase Admin
// Si estás en local con emuladores, se conectará automáticamente si FIRESTORE_EMULATOR_HOST está seteado
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'nexus-autosales'
    });
}

const db = admin.firestore();

/**
 * Script de Automatización de Marketing - NEXUS
 * Objetivo: Identificar clientes inactivos y enviarles catálogo.
 */
async function runMarketingAutomation() {
    console.log('🚀 Iniciando Motor de Marketing Automatizado...');

    // 1. Calcular fecha límite (3 meses atrás)
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    const fechaLimite = tresMesesAtras.toISOString();

    console.log(`📅 Buscando clientes sin compras desde: ${new Date(fechaLimite).toLocaleDateString()}`);

    // 2. Consultar leads inactivos
    const leadsSnapshot = await db.collection('clientes_leads')
        .where('ultima_compra', '<=', fechaLimite)
        .get();

    if (leadsSnapshot.empty) {
        console.log('✅ No hay clientes inactivos que requieran contacto hoy.');
        return;
    }

    console.log(`🎯 Se encontraron ${leadsSnapshot.size} clientes para reactivación.`);

    // 3. Procesar cada cliente
    for (const doc of leadsSnapshot.docs) {
        const cliente = doc.data();

        console.log(`\n-----------------------------------------`);
        console.log(`👤 Cliente: ${cliente.nombre}`);
        console.log(`📱 Teléfono: ${cliente.telefono}`);
        console.log(`📱 Dispositivo Actual: ${cliente.modelo_celular_actual || 'No registrado'}`);

        // Simulación de envío (Aquí se integraría la API de Meta/WhatsApp)
        const mensaje = `¡Hola ${cliente.nombre}! 👋 Hace tiempo que no nos visitas en Nexus. 
Vemos que tienes un ${cliente.modelo_celular_actual || 'dispositivo'} y han llegado nuevos accesorios que te encantarán. 
✨ Mira nuestro catálogo actualizado aquí: https://nexus-tech.web.app/catalogo`;

        console.log(`💬 MENSAJE PROGRAMADO:`);
        console.log(`"${mensaje}"`);

        // Log de la interacción
        await db.collection('interacciones_marketing').add({
            cliente_id: doc.id,
            tipo: 'REMARKETING_AUTOMATIZADO',
            mensaje_enviado: mensaje,
            fecha: new Date().toISOString()
        });

        console.log(`✅ Registro de interacción guardado.`);
    }

    console.log(`\n✨ Proceso de Marketing finalizado con éxito.`);
}

// Ejecutar
runMarketingAutomation().catch(err => {
    console.error('❌ Error en el motor de marketing:', err);
    process.exit(1);
});
