// ============================================
// FIRESTORE COLLECTIONS STRUCTURE
// NEXUS AUTO-SALES
// ============================================

/*
COLECCIÓN: productos
Catálogo de productos con información para la IA
*/
interface Producto {
    id: string
    sku: string
    nombre: string
    descripcion: string
    descripcion_ia: string          // Descripción optimizada para que la IA venda
    categoria: string
    costo_compra: number
    precio_retail: number
    precio_b2b: number
    stock: number
    stock_minimo: number
    link_pago_base: string          // Link de pago (YaPago, PayPal, etc.)
    imagenes: string[]              // URLs de Storage
    activo: boolean
    created_at: string
    updated_at: string
}

/*
COLECCIÓN: conversaciones
Historial de chats con clientes gestionados por la IA
*/
interface Conversacion {
    id: string
    cliente_id: string
    cliente_nombre: string
    cliente_telefono: string
    cliente_email?: string
    plataforma: 'facebook' | 'instagram' | 'whatsapp' | 'web'
    producto_interes_id: string
    producto_nombre: string
    estado: 'activa' | 'negociando' | 'esperando_pago' | 'cerrada' | 'abandonada'
    historial_chat: MensajeChat[]
    datos_envio?: DatosEnvio
    pago_confirmado: boolean
    comprobante_url?: string
    total_venta?: number
    created_at: string
    updated_at: string
    cerrada_at?: string
}

interface MensajeChat {
    rol: 'cliente' | 'ia' | 'sistema'
    contenido: string
    timestamp: string
}

interface DatosEnvio {
    nombre_completo: string
    direccion: string
    ciudad: string
    codigo_postal?: string
    telefono: string
    notas?: string
}

/*
COLECCIÓN: pedidos_despacho
Ventas cerradas listas para enviar
*/
interface PedidoDespacho {
    id: string
    conversacion_id: string
    cliente_datos: DatosEnvio
    producto_id: string
    producto_nombre: string
    cantidad: number
    precio_unitario: number
    total: number
    costo_total: number
    ganancia_neta: number
    comprobante_url: string
    plataforma: string
    estado: 'pendiente' | 'preparando' | 'enviado' | 'entregado' | 'devuelto'
    tracking_number?: string
    notas_despacho?: string
    created_at: string
    despachado_at?: string
    entregado_at?: string
}

/*
COLECCIÓN: configuracion_ia
Configuración del agente de ventas IA
*/
interface ConfiguracionIA {
    id: string
    nombre_tienda: string
    tono_vendedor: string           // 'profesional' | 'amigable' | 'persuasivo'
    prompt_sistema: string          // Instrucciones base para GPT
    mensaje_bienvenida: string
    mensaje_sin_stock: string
    mensaje_pago_recibido: string
    horario_atencion: {
        inicio: string              // "09:00"
        fin: string                 // "21:00"
    }
    respuesta_fuera_horario: string
    notificar_email: string
    notificar_whatsapp: string
    openai_api_key: string          // Encriptada
}

/*
COLECCIÓN: webhooks_log
Log de webhooks recibidos (debugging)
*/
interface WebhookLog {
    id: string
    plataforma: string
    payload: object
    procesado: boolean
    respuesta_ia?: string
    error?: string
    created_at: string
}

// Export types
export type {
    Producto,
    Conversacion,
    MensajeChat,
    DatosEnvio,
    PedidoDespacho,
    ConfiguracionIA,
    WebhookLog
}
