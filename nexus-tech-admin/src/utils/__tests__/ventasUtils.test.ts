import { calcularVenta } from '../ventasUtils'
import { Producto, Afiliado } from '@/types'

const mockProductos: Producto[] = [
    {
        id: 'p1', nombre: 'iPhone 15', sku: 'IP15',
        precio_retail: 1000, precio_b2b: 900, costo_compra: 800,
        stock: 10, activo: true, categoria: 'Celulares', descripcion: '', imagen_url: ''
    },
    {
        id: 'p2', nombre: 'Case', sku: 'CASE1',
        precio_retail: 50, precio_b2b: 30, costo_compra: 10,
        stock: 50, activo: true, categoria: 'Accesorios', descripcion: '', imagen_url: ''
    }
]

const mockAfiliados: Afiliado[] = [
    {
        id: 'a1', nombre: 'Juan', email: '', telefono: '',
        codigo_referido: 'JUAN123', comision_porcentaje: 10,
        balance_acumulado: 0, banco: '', numero_cuenta: '', tipo_cuenta: '',
        created_at: '', updated_at: '', estado: 'activo'
    }
]

describe('calcularVenta', () => {
    test('Calcula venta Retail correctamente', () => {
        const result = calcularVenta({
            producto_id: 'p1',
            tipo_venta: 'Retail',
            cantidad: 1,
            afiliado_id: '',
            descuento: 0,
            productos: mockProductos,
            afiliados: mockAfiliados
        })

        expect(result.subtotal).toBe(1000)
        expect(result.total).toBe(1000)
        expect(result.costo).toBe(800)
        expect(result.comision).toBe(0)
        expect(result.gastos).toBe(50) // 5% de 1000
        expect(result.ganancia).toBe(150) // 1000 - 800 - 0 - 50
    })

    test('Calcula venta B2B correctamente', () => {
        const result = calcularVenta({
            producto_id: 'p1',
            tipo_venta: 'B2B',
            cantidad: 2,
            afiliado_id: '',
            descuento: 0,
            productos: mockProductos,
            afiliados: mockAfiliados
        })

        expect(result.subtotal).toBe(1800) // 900 * 2
        expect(result.total).toBe(1800)
        expect(result.costo).toBe(1600) // 800 * 2
        expect(result.ganancia).toBe(110) // 1800 - 1600 - 0 - 90
    })

    test('Calcula comisión de Afiliado correctamente', () => {
        const result = calcularVenta({
            producto_id: 'p1',
            tipo_venta: 'Afiliado',
            cantidad: 1,
            afiliado_id: 'a1',
            descuento: 0,
            productos: mockProductos,
            afiliados: mockAfiliados
        })

        expect(result.total).toBe(1000)
        expect(result.comision).toBe(100) // 10% de 1000
        expect(result.ganancia).toBe(50) // 1000 - 800 - 100 - 50
    })
})
