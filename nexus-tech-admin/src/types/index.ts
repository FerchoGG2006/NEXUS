export interface VentasServiceResponse {
    data: Venta[];
    lastDoc: any;
}

export interface Venta {
    id: string;
    numero_venta: string;
    producto_id: string;
    afiliado_id: string | null;
    tipo_venta: 'Retail' | 'B2B' | 'Afiliado';
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    descuento: number;
    total_venta: number;
    costo_total: number;
    comision_afiliado: number;
    gastos_operativos: number;
    ganancia_neta: number;
    estado: string;
    fecha: string;
}

export interface Producto {
    id: string;
    nombre: string;
    precio_retail: number;
    precio_b2b: number;
    costo_compra: number;
    // Add other fields if necessary based on usage in other files
    stock?: number;
    categoria?: string;
    estado?: boolean;
}

export interface Afiliado {
    id: string;
    nombre: string;
    comision_porcentaje: number;
    // Add other fields if necessary
    email?: string;
    telefono?: string;
    activo?: boolean;
}
