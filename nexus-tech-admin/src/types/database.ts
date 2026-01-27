export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            productos: {
                Row: {
                    id: string
                    sku: string
                    nombre: string
                    descripcion: string | null
                    stock: number
                    stock_minimo: number
                    costo_compra: number
                    precio_retail: number
                    precio_b2b: number
                    categoria: string
                    imagen_url: string | null
                    activo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    sku: string
                    nombre: string
                    descripcion?: string | null
                    stock?: number
                    stock_minimo?: number
                    costo_compra: number
                    precio_retail: number
                    precio_b2b: number
                    categoria: string
                    imagen_url?: string | null
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    sku?: string
                    nombre?: string
                    descripcion?: string | null
                    stock?: number
                    stock_minimo?: number
                    costo_compra?: number
                    precio_retail?: number
                    precio_b2b?: number
                    categoria?: string
                    imagen_url?: string | null
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            afiliados: {
                Row: {
                    id: string
                    user_id: string | null
                    nombre: string
                    email: string
                    telefono: string | null
                    codigo_referido: string
                    comision_porcentaje: number
                    balance_acumulado: number
                    balance_pagado: number
                    activo: boolean
                    nivel: 'Bronce' | 'Plata' | 'Oro' | 'Platino'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    nombre: string
                    email: string
                    telefono?: string | null
                    codigo_referido: string
                    comision_porcentaje?: number
                    balance_acumulado?: number
                    balance_pagado?: number
                    activo?: boolean
                    nivel?: 'Bronce' | 'Plata' | 'Oro' | 'Platino'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    nombre?: string
                    email?: string
                    telefono?: string | null
                    codigo_referido?: string
                    comision_porcentaje?: number
                    balance_acumulado?: number
                    balance_pagado?: number
                    activo?: boolean
                    nivel?: 'Bronce' | 'Plata' | 'Oro' | 'Platino'
                    created_at?: string
                    updated_at?: string
                }
            }
            clientes_b2b: {
                Row: {
                    id: string
                    razon_social: string
                    ruc: string | null
                    contacto_nombre: string | null
                    contacto_email: string | null
                    contacto_telefono: string | null
                    direccion: string | null
                    linea_credito: number
                    saldo_pendiente: number
                    activo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    razon_social: string
                    ruc?: string | null
                    contacto_nombre?: string | null
                    contacto_email?: string | null
                    contacto_telefono?: string | null
                    direccion?: string | null
                    linea_credito?: number
                    saldo_pendiente?: number
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    razon_social?: string
                    ruc?: string | null
                    contacto_nombre?: string | null
                    contacto_email?: string | null
                    contacto_telefono?: string | null
                    direccion?: string | null
                    linea_credito?: number
                    saldo_pendiente?: number
                    activo?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            ventas: {
                Row: {
                    id: string
                    numero_venta: string
                    producto_id: string
                    afiliado_id: string | null
                    cliente_b2b_id: string | null
                    tipo_venta: 'Retail' | 'B2B' | 'Afiliado'
                    cantidad: number
                    precio_unitario: number
                    subtotal: number
                    descuento: number
                    total_venta: number
                    costo_total: number
                    comision_afiliado: number
                    gastos_operativos: number
                    ganancia_neta: number
                    estado: 'Pendiente' | 'Completada' | 'Cancelada' | 'Reembolsada'
                    notas: string | null
                    fecha: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    numero_venta: string
                    producto_id: string
                    afiliado_id?: string | null
                    cliente_b2b_id?: string | null
                    tipo_venta: 'Retail' | 'B2B' | 'Afiliado'
                    cantidad: number
                    precio_unitario: number
                    subtotal: number
                    descuento?: number
                    total_venta: number
                    costo_total: number
                    comision_afiliado?: number
                    gastos_operativos?: number
                    ganancia_neta: number
                    estado?: 'Pendiente' | 'Completada' | 'Cancelada' | 'Reembolsada'
                    notas?: string | null
                    fecha?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    numero_venta?: string
                    producto_id?: string
                    afiliado_id?: string | null
                    cliente_b2b_id?: string | null
                    tipo_venta?: 'Retail' | 'B2B' | 'Afiliado'
                    cantidad?: number
                    precio_unitario?: number
                    subtotal?: number
                    descuento?: number
                    total_venta?: number
                    costo_total?: number
                    comision_afiliado?: number
                    gastos_operativos?: number
                    ganancia_neta?: number
                    estado?: 'Pendiente' | 'Completada' | 'Cancelada' | 'Reembolsada'
                    notas?: string | null
                    fecha?: string
                    created_at?: string
                }
            }
            cotizaciones_b2b: {
                Row: {
                    id: string
                    numero_cotizacion: string
                    cliente_b2b_id: string
                    items: Json
                    subtotal: number
                    descuento: number
                    total: number
                    estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Vencida'
                    valida_hasta: string | null
                    notas: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    numero_cotizacion: string
                    cliente_b2b_id: string
                    items: Json
                    subtotal: number
                    descuento?: number
                    total: number
                    estado?: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Vencida'
                    valida_hasta?: string | null
                    notas?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    numero_cotizacion?: string
                    cliente_b2b_id?: string
                    items?: Json
                    subtotal?: number
                    descuento?: number
                    total?: number
                    estado?: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Vencida'
                    valida_hasta?: string | null
                    notas?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            pagos_afiliados: {
                Row: {
                    id: string
                    afiliado_id: string
                    monto: number
                    metodo_pago: string
                    referencia: string | null
                    estado: 'Pendiente' | 'Completado' | 'Fallido'
                    notas: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    afiliado_id: string
                    monto: number
                    metodo_pago: string
                    referencia?: string | null
                    estado?: 'Pendiente' | 'Completado' | 'Fallido'
                    notas?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    afiliado_id?: string
                    monto?: number
                    metodo_pago?: string
                    referencia?: string | null
                    estado?: 'Pendiente' | 'Completado' | 'Fallido'
                    notas?: string | null
                    created_at?: string
                }
            }
            configuracion: {
                Row: {
                    id: string
                    clave: string
                    valor: string
                    descripcion: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    clave: string
                    valor: string
                    descripcion?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    clave?: string
                    valor?: string
                    descripcion?: string | null
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            obtener_balance_afiliado: {
                Args: { afiliado_uuid: string }
                Returns: number
            }
            calcular_ganancia_neta: {
                Args: {
                    p_total_venta: number
                    p_costo_compra: number
                    p_cantidad: number
                    p_comision_afiliado?: number
                    p_gastos_operativos?: number
                }
                Returns: number
            }
            generar_numero_venta: {
                Args: Record<string, never>
                Returns: string
            }
            generar_numero_cotizacion: {
                Args: Record<string, never>
                Returns: string
            }
            obtener_stock_critico: {
                Args: Record<string, never>
                Returns: {
                    id: string
                    sku: string
                    nombre: string
                    stock: number
                    stock_minimo: number
                    categoria: string
                }[]
            }
            obtener_metricas_dashboard: {
                Args: { fecha_inicio?: string; fecha_fin?: string }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Tipos de utilidad
export type Producto = Database['public']['Tables']['productos']['Row']
export type ProductoInsert = Database['public']['Tables']['productos']['Insert']
export type ProductoUpdate = Database['public']['Tables']['productos']['Update']

export type Afiliado = Database['public']['Tables']['afiliados']['Row']
export type AfiliadoInsert = Database['public']['Tables']['afiliados']['Insert']
export type AfiliadoUpdate = Database['public']['Tables']['afiliados']['Update']

export type ClienteB2B = Database['public']['Tables']['clientes_b2b']['Row']
export type ClienteB2BInsert = Database['public']['Tables']['clientes_b2b']['Insert']
export type ClienteB2BUpdate = Database['public']['Tables']['clientes_b2b']['Update']

export type Venta = Database['public']['Tables']['ventas']['Row']
export type VentaInsert = Database['public']['Tables']['ventas']['Insert']
export type VentaUpdate = Database['public']['Tables']['ventas']['Update']

export type CotizacionB2B = Database['public']['Tables']['cotizaciones_b2b']['Row']
export type CotizacionB2BInsert = Database['public']['Tables']['cotizaciones_b2b']['Insert']
export type CotizacionB2BUpdate = Database['public']['Tables']['cotizaciones_b2b']['Update']

export type PagoAfiliado = Database['public']['Tables']['pagos_afiliados']['Row']
export type PagoAfiliadoInsert = Database['public']['Tables']['pagos_afiliados']['Insert']
export type PagoAfiliadoUpdate = Database['public']['Tables']['pagos_afiliados']['Update']

export type Configuracion = Database['public']['Tables']['configuracion']['Row']

// Tipos para métricas
export interface MetricasDashboard {
    ganancia_neta_total: number
    total_ventas: number
    numero_transacciones: number
    ventas_retail: number
    ventas_b2b: number
    ventas_afiliados: number
    comisiones_pagadas: number
    productos_stock_critico: number
    afiliados_activos: number
}

// Tipos para cotización PDF
export interface ItemCotizacion {
    producto_id: string
    sku: string
    nombre: string
    cantidad: number
    precio_unitario: number
    subtotal: number
}
