/**
 * Script para inicializar datos de ejemplo en Firestore
 * Ejecutar: npx ts-node scripts/seed-firestore.ts
 */

import * as admin from 'firebase-admin';

// Inicializar con credenciales de servicio
// Si ejecutas localmente, configura GOOGLE_APPLICATION_CREDENTIALS
admin.initializeApp();

const db = admin.firestore();

async function seedDatabase() {
    console.log('🌱 Iniciando seed de base de datos...\n');

    // 1. Configuración IA
    console.log('📝 Creando configuración IA...');
    await db.collection('configuracion_ia').doc('default').set({
        nombre_tienda: 'Nexus Tech',
        tono_vendedor: 'profesional',
        prompt_sistema: `Eres el vendedor virtual de Nexus Tech. Tu objetivo es ayudar a los clientes y cerrar ventas.

REGLAS:
1. Sé amable y profesional
2. Responde de forma concisa (2-3 oraciones)
3. Si hay interés, guía hacia la compra
4. Solicita datos de envío: nombre, dirección, ciudad, teléfono
5. Envía el link de pago
6. Confirma cuando recibas comprobante`,
        mensaje_bienvenida: '¡Hola! 👋 Soy el asistente de Nexus Tech. ¿En qué puedo ayudarte?',
        mensaje_sin_stock: 'Este producto está agotado. ¿Te aviso cuando esté disponible?',
        mensaje_pago_recibido: '¡Pago recibido! 🎉 Tu pedido será despachado hoy.',
        horario_atencion: {
            inicio: '09:00',
            fin: '21:00'
        },
        respuesta_fuera_horario: 'Gracias por escribir. Horario: 9am-9pm. Te respondo mañana.',
        notificar_email: '',
        notificar_whatsapp: '',
        openai_api_key: '', // IMPORTANTE: Agregar tu API key aquí
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    console.log('✅ Configuración IA creada\n');

    // 2. Productos de ejemplo
    console.log('📦 Creando productos de ejemplo...');
    const productos = [
        {
            sku: 'ACC-001',
            nombre: 'iPhone 15 Pro Case - Negro',
            descripcion: 'Funda de silicona premium con protección militar',
            descripcion_ia: 'Funda premium de silicona para iPhone 15 Pro. Protección militar contra caídas de hasta 3 metros. Material suave al tacto, no añade volumen. Disponible en negro mate. Garantía de 1 año incluida.',
            categoria: 'Fundas',
            costo_compra: 12.00,
            precio_retail: 29.99,
            precio_b2b: 22.00,
            stock: 50,
            stock_minimo: 10,
            link_pago_base: 'https://paypal.me/nexustech/29.99',
            imagenes: [],
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            sku: 'ACC-002',
            nombre: 'Cable USB-C 2m Premium',
            descripcion: 'Cable trenzado de nylon, carga rápida 65W',
            descripcion_ia: 'Cable USB-C de 2 metros con revestimiento de nylon trenzado. Soporta carga rápida hasta 65W. Compatible con todos los dispositivos USB-C. Conectores reforzados anti-rotura.',
            categoria: 'Cables',
            costo_compra: 4.00,
            precio_retail: 12.99,
            precio_b2b: 9.00,
            stock: 100,
            stock_minimo: 20,
            link_pago_base: 'https://paypal.me/nexustech/12.99',
            imagenes: [],
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            sku: 'ACC-003',
            nombre: 'AirPods Pro Case Silicona',
            descripcion: 'Funda protectora con mosquetón',
            descripcion_ia: 'Funda de silicona para AirPods Pro. Incluye mosquetón para colgar. Protección completa contra golpes y arañazos. Compatible con carga inalámbrica. Colores disponibles: negro, blanco, azul.',
            categoria: 'Fundas',
            costo_compra: 3.00,
            precio_retail: 9.99,
            precio_b2b: 7.00,
            stock: 75,
            stock_minimo: 15,
            link_pago_base: 'https://paypal.me/nexustech/9.99',
            imagenes: [],
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            sku: 'ACC-004',
            nombre: 'Soporte Magnético MagSafe',
            descripcion: 'Soporte de escritorio con carga MagSafe',
            descripcion_ia: 'Soporte de escritorio para iPhone con MagSafe. Imanes extra fuertes, soporta hasta 1kg. Base antideslizante. Ángulo ajustable 360°. Compatible con todos los iPhone 12/13/14/15.',
            categoria: 'Accesorios',
            costo_compra: 8.00,
            precio_retail: 24.99,
            precio_b2b: 18.00,
            stock: 5,
            stock_minimo: 10,
            link_pago_base: 'https://paypal.me/nexustech/24.99',
            imagenes: [],
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            sku: 'ACC-005',
            nombre: 'Protector Pantalla iPhone 15',
            descripcion: 'Vidrio templado 9H con kit de instalación',
            descripcion_ia: 'Protector de pantalla de vidrio templado 9H para iPhone 15. Incluye kit de instalación con marco alineador. Cobertura completa edge-to-edge. Anti-huellas y oleofóbico. Pack de 2 unidades.',
            categoria: 'Protectores',
            costo_compra: 2.00,
            precio_retail: 14.99,
            precio_b2b: 10.00,
            stock: 200,
            stock_minimo: 30,
            link_pago_base: 'https://paypal.me/nexustech/14.99',
            imagenes: [],
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    for (const producto of productos) {
        await db.collection('productos').add(producto);
        console.log(`  ✅ ${producto.nombre}`);
    }
    console.log('\n');

    // 3. Afiliados de ejemplo
    console.log('👥 Creando afiliados de ejemplo...');
    const afiliados = [
        {
            nombre: 'Carlos Mendoza',
            email: 'carlos@ejemplo.com',
            telefono: '+57 311 234 5678',
            codigo_referido: 'CARLOS10',
            comision_porcentaje: 10,
            total_ventas: 1250.00,
            comisiones_pendientes: 125.00,
            comisiones_pagadas: 350.00,
            activo: true,
            created_at: new Date().toISOString()
        },
        {
            nombre: 'María López',
            email: 'maria@ejemplo.com',
            telefono: '+57 300 987 6543',
            codigo_referido: 'MARIA15',
            comision_porcentaje: 15,
            total_ventas: 2340.00,
            comisiones_pendientes: 0,
            comisiones_pagadas: 702.00,
            activo: true,
            created_at: new Date().toISOString()
        }
    ];

    for (const afiliado of afiliados) {
        await db.collection('afiliados').add(afiliado);
        console.log(`  ✅ ${afiliado.nombre}`);
    }
    console.log('\n');

    // 4. Conversación de ejemplo
    console.log('💬 Creando conversación de ejemplo...');
    await db.collection('conversaciones').add({
        cliente_id: 'demo_cliente_1',
        cliente_nombre: 'Juan Pérez',
        cliente_telefono: '+57 320 111 2233',
        plataforma: 'whatsapp',
        producto_interes_id: '',
        producto_nombre: 'iPhone 15 Pro Case',
        estado: 'negociando',
        historial_chat: [
            {
                rol: 'cliente',
                contenido: 'Hola, vi la funda para iPhone 15 Pro. ¿Está disponible?',
                timestamp: new Date(Date.now() - 300000).toISOString()
            },
            {
                rol: 'ia',
                contenido: '¡Hola Juan! 👋 Sí, tenemos la funda para iPhone 15 Pro disponible. Es de silicona premium con protección militar. El precio es $29.99 USD. ¿Te gustaría más información?',
                timestamp: new Date(Date.now() - 290000).toISOString()
            },
            {
                rol: 'cliente',
                contenido: 'Sí, me interesa. ¿Hacen envíos a Bogotá?',
                timestamp: new Date(Date.now() - 200000).toISOString()
            },
            {
                rol: 'ia',
                contenido: '¡Claro! Hacemos envíos a todo Colombia. El envío a Bogotá es gratis para compras mayores a $25. ¿Quieres que te envíe el link de pago?',
                timestamp: new Date(Date.now() - 190000).toISOString()
            }
        ],
        pago_confirmado: false,
        created_at: new Date(Date.now() - 300000).toISOString(),
        updated_at: new Date(Date.now() - 190000).toISOString()
    });
    console.log('✅ Conversación de ejemplo creada\n');

    // 5. Pedido de despacho de ejemplo
    console.log('📦 Creando pedido de despacho de ejemplo...');
    await db.collection('pedidos_despacho').add({
        conversacion_id: 'demo_conv_1',
        cliente_datos: {
            nombre_completo: 'Ana García',
            direccion: 'Calle 100 #15-20, Apto 301',
            ciudad: 'Bogotá',
            codigo_postal: '110111',
            telefono: '+57 310 555 6677'
        },
        producto_id: 'demo_prod_1',
        producto_nombre: 'Cable USB-C 2m Premium',
        cantidad: 2,
        precio_unitario: 12.99,
        total: 25.98,
        costo_total: 8.00,
        ganancia_neta: 17.98,
        comprobante_url: '',
        plataforma: 'facebook',
        estado: 'pendiente',
        created_at: new Date().toISOString()
    });
    console.log('✅ Pedido de despacho creado\n');

    console.log('🎉 ¡Seed completado exitosamente!\n');
    console.log('Datos creados:');
    console.log('  - 1 configuración IA');
    console.log('  - 5 productos');
    console.log('  - 2 afiliados');
    console.log('  - 1 conversación');
    console.log('  - 1 pedido de despacho');
    console.log('\n⚠️  IMPORTANTE: No olvides agregar tu OpenAI API Key en Firestore o en /configuracion-ia');

    process.exit(0);
}

seedDatabase().catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
});
