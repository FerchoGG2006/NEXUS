// supabase/functions/notify-sale/index.ts
// Edge Function para enviar notificaciones de WhatsApp ante cada venta

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

interface VentaPayload {
    type: 'INSERT'
    table: 'ventas'
    record: {
        id: string
        numero_venta: string
        producto_id: string
        tipo_venta: string
        cantidad: number
        total_venta: number
        ganancia_neta: number
        fecha: string
    }
    schema: string
    old_record: null
}

interface ProductoData {
    nombre: string
    sku: string
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload: VentaPayload = await req.json()

        // Solo procesar INSERTs
        if (payload.type !== 'INSERT') {
            return new Response(JSON.stringify({ message: 'No INSERT event' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const venta = payload.record

        // Crear cliente de Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Obtener datos del producto
        const { data: producto } = await supabase
            .from('productos')
            .select('nombre, sku')
            .eq('id', venta.producto_id)
            .single()

        const productoInfo = producto as ProductoData | null

        // Construir mensaje de WhatsApp
        const mensaje = `🛒 *NUEVA VENTA REGISTRADA*

📋 *Orden:* ${venta.numero_venta}
📦 *Producto:* ${productoInfo?.nombre || 'N/A'} (${productoInfo?.sku || 'N/A'})
🏷️ *Tipo:* ${venta.tipo_venta}
🔢 *Cantidad:* ${venta.cantidad}

💰 *Total Venta:* $${venta.total_venta.toFixed(2)}
✅ *Ganancia Neta:* $${venta.ganancia_neta.toFixed(2)}

📅 ${new Date(venta.fecha).toLocaleString('es-ES', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })}

_NEXUS TECH-ADMIN_`

        // Enviar notificación WhatsApp (ejemplo con API genérica)
        const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL')
        const whatsappToken = Deno.env.get('WHATSAPP_API_TOKEN')
        const whatsappPhone = Deno.env.get('WHATSAPP_PHONE_NUMBER')

        if (whatsappApiUrl && whatsappToken && whatsappPhone) {
            try {
                const response = await fetch(whatsappApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${whatsappToken}`,
                    },
                    body: JSON.stringify({
                        phone: whatsappPhone,
                        message: mensaje,
                    }),
                })

                if (!response.ok) {
                    console.error('Error sending WhatsApp:', await response.text())
                }
            } catch (whatsappError) {
                console.error('WhatsApp API error:', whatsappError)
            }
        } else {
            console.log('WhatsApp not configured, message would be:', mensaje)
        }

        // Log de la venta para auditoría
        console.log('Venta procesada:', {
            numero_venta: venta.numero_venta,
            total: venta.total_venta,
            ganancia: venta.ganancia_neta,
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Notification processed',
                venta_id: venta.id
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
