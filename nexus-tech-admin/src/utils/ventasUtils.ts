import { Producto, Afiliado } from '@/types'

interface CalculoVentaResult {
    subtotal: number
    total: number
    costo: number
    comision: number
    gastos: number
    ganancia: number
}

interface CalculoVentaParams {
    producto_id: string
    tipo_venta: 'Retail' | 'B2B' | 'Afiliado'
    cantidad: number
    afiliado_id: string
    descuento: number
    productos: Producto[]
    afiliados: Afiliado[]
}

export const calcularVenta = (params: CalculoVentaParams): CalculoVentaResult => {
    const { producto_id, tipo_venta, cantidad, afiliado_id, descuento, productos, afiliados } = params

    const producto = productos.find(p => p.id === producto_id)
    if (!producto) return { subtotal: 0, total: 0, costo: 0, comision: 0, gastos: 0, ganancia: 0 }

    const precio = tipo_venta === 'B2B' ? producto.precio_b2b : producto.precio_retail
    const subtotal = precio * cantidad
    const total = subtotal - descuento
    const costo = producto.costo_compra * cantidad

    const afiliado = afiliados.find(a => a.id === afiliado_id)
    const comision = tipo_venta === 'Afiliado' && afiliado
        ? total * (afiliado.comision_porcentaje / 100)
        : 0

    const gastos = total * 0.05
    const ganancia = total - costo - comision - gastos

    return { subtotal, total, costo, comision, gastos, ganancia }
}
