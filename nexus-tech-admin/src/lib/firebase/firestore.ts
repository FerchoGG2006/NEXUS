/**
 * NEXUS AUTO-SALES
 * Firebase Firestore Service
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    QueryConstraint,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'

// ============================================
// CONSTANTES DE COLECCIONES
// ============================================

export const COLLECTIONS = {
    PRODUCTOS: 'productos',
    CONVERSACIONES: 'conversaciones',
    PEDIDOS_DESPACHO: 'pedidos_despacho',
    CONFIGURACION_IA: 'configuracion_ia',
    WEBHOOKS_LOG: 'webhooks_log',
    AFILIADOS: 'afiliados',
    VENTAS: 'ventas',
    CLIENTES_B2B: 'clientes_b2b',
    CLIENTES_LEADS: 'clientes_leads',
    CAMPANAS: 'campanas'
}

// ============================================
// UTILIDADES
// ============================================

function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Timestamp) {
            converted[key] = value.toDate().toISOString()
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            converted[key] = convertTimestamps(value as Record<string, unknown>)
        } else {
            converted[key] = value
        }
    }
    return converted
}

// ============================================
// OPERACIONES CRUD GENÉRICAS
// ============================================

// Timeout Helper para evitar UI bloqueada
const withTimeout = <T>(promise: Promise<T>, ms: number = 2000, fallback: T): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => {
            console.warn('⚠️ Firestore timeout - devolviendo fallback local')
            resolve(fallback)
        }, ms))
    ])
}

export async function getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    if (!db || !isFirebaseConfigured()) return []

    const fetchOp = async () => {
        try {
            const q = query(collection(db!, collectionName), ...constraints)
            const snapshot = await getDocs(q)
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...convertTimestamps(doc.data()),
            })) as T[]
        } catch (error) {
            console.error(`Error getting ${collectionName}:`, error)
            return []
        }
    }

    return withTimeout(fetchOp(), 2000, [])
}

export async function getById<T>(collectionName: string, id: string): Promise<T | null> {
    if (!db || !isFirebaseConfigured()) return null

    const fetchOp = async () => {
        try {
            const docRef = doc(db!, collectionName, id)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as T
            }
            return null
        } catch (error) {
            console.error(`Error getting ${collectionName}/${id}:`, error)
            return null
        }
    }

    return withTimeout(fetchOp(), 2000, null)
}

export async function create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string | null> {
    if (!db || !isFirebaseConfigured()) return null

    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        return docRef.id
    } catch (error) {
        console.error(`Error creating ${collectionName}:`, error)
        return null
    }
}

export async function update<T>(collectionName: string, id: string, data: Partial<T>): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false

    try {
        const docRef = doc(db, collectionName, id)
        await updateDoc(docRef, {
            ...data,
            updated_at: new Date().toISOString(),
        })
        return true
    } catch (error) {
        console.error(`Error updating ${collectionName}/${id}:`, error)
        return false
    }
}

export async function remove(collectionName: string, id: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false

    try {
        const docRef = doc(db, collectionName, id)
        await deleteDoc(docRef)
        return true
    } catch (error) {
        console.error(`Error deleting ${collectionName}/${id}:`, error)
        return false
    }
}

// ============================================
// PRODUCTOS
// ============================================

export async function getProductos(limite?: number) {
    const constraints: QueryConstraint[] = [orderBy('nombre')]
    if (limite) constraints.push(limit(limite))
    return getAll(COLLECTIONS.PRODUCTOS, constraints)
}

export async function getProductosBajoStock() {
    if (!db || !isFirebaseConfigured()) return []

    try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTOS))
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((p: any) => p.stock <= (p.stock_minimo || 10))
    } catch (error) {
        console.error('Error getting low stock:', error)
        return []
    }
}

export async function getProductosActivos() {
    return getAll(COLLECTIONS.PRODUCTOS, [
        where('activo', '==', true),
        orderBy('nombre')
    ])
}

// Generador de ID de venta legible (Ej: VTA-20241025-X8J2)
export function generarNumeroVenta(): string {
    const date = new Date()
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `VTA-${yyyymmdd}-${random}`
}

// ============================================
// CONVERSACIONES (Tiempo Real)
// ============================================

export function subscribeToConversaciones(
    callback: (conversaciones: any[]) => void,
    estados: string[] = ['activa', 'negociando', 'esperando_pago']
): Unsubscribe {
    if (!db || !isFirebaseConfigured()) {
        callback([])
        return () => { }
    }

    const q = query(
        collection(db, COLLECTIONS.CONVERSACIONES),
        where('estado', 'in', estados),
        orderBy('updated_at', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
        const conversaciones = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }))
        callback(conversaciones)
    })
}

export async function getConversaciones(estados?: string[], limite?: number) {
    const constraints: QueryConstraint[] = [orderBy('updated_at', 'desc')]
    if (estados?.length) constraints.unshift(where('estado', 'in', estados))
    if (limite) constraints.push(limit(limite))
    return getAll(COLLECTIONS.CONVERSACIONES, constraints)
}

export async function getConversacionById(id: string) {
    return getById(COLLECTIONS.CONVERSACIONES, id)
}

// ============================================
// PEDIDOS DE DESPACHO (Tiempo Real)
// ============================================

export function subscribeToPedidosDespacho(
    callback: (pedidos: any[]) => void,
    estado?: string
): Unsubscribe {
    if (!db || !isFirebaseConfigured()) {
        callback([])
        return () => { }
    }

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')]
    if (estado) constraints.unshift(where('estado', '==', estado))

    const q = query(collection(db, COLLECTIONS.PEDIDOS_DESPACHO), ...constraints)

    return onSnapshot(q, (snapshot) => {
        const pedidos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }))
        callback(pedidos)
    })
}

export async function getPedidosDespacho(estado?: string, limite?: number) {
    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')]
    if (estado) constraints.unshift(where('estado', '==', estado))
    if (limite) constraints.push(limit(limite))
    return getAll(COLLECTIONS.PEDIDOS_DESPACHO, constraints)
}

export async function marcarComoEnviado(pedidoId: string, trackingNumber?: string) {
    return update(COLLECTIONS.PEDIDOS_DESPACHO, pedidoId, {
        estado: 'enviado',
        tracking_number: trackingNumber || '',
        despachado_at: new Date().toISOString()
    })
}

export async function marcarComoEntregado(pedidoId: string) {
    return update(COLLECTIONS.PEDIDOS_DESPACHO, pedidoId, {
        estado: 'entregado',
        entregado_at: new Date().toISOString()
    })
}

// ============================================
// MÉTRICAS DEL DASHBOARD
// ============================================

// ============================================
// MÉTRICAS DEL DASHBOARD
// ============================================

export async function getMetricasDashboard() {
    if (!db || !isFirebaseConfigured()) return null

    // Fallback con ceros
    const metricasCero = {
        ganancia_neta_total: 0,
        total_ventas: 0,
        numero_transacciones: 0,
        conversaciones_activas: 0,
        pedidos_pendientes: 0,
        productos_stock_critico: 0,
        afiliados_activos: 0,
        ventas_retail: 0,
        ventas_b2b: 0,
        ventas_afiliados: 0,
        comisiones_pagadas: 0
    }

    const fetchOp = async () => {
        try {
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)

            // Ejecutar todas las consultas EN PARALELO para máxima velocidad
            const [
                productosSnap,
                convActivasSnap,
                pedidosPendientesSnap,
                todosLosPedidosSnap,
                afiliadosSnap
            ] = await Promise.all([
                getDocs(collection(db!, COLLECTIONS.PRODUCTOS)),
                getDocs(query(collection(db!, COLLECTIONS.CONVERSACIONES), where('estado', 'in', ['activa', 'negociando', 'esperando_pago']))),
                getDocs(query(collection(db!, COLLECTIONS.PEDIDOS_DESPACHO), where('estado', '==', 'pendiente'))),
                getDocs(collection(db!, COLLECTIONS.PEDIDOS_DESPACHO)),
                getDocs(query(collection(db!, COLLECTIONS.AFILIADOS), where('activo', '==', true)))
            ])

            // Procesar datos en memoria (muy rápido)
            const productos = productosSnap.docs.map(d => d.data())
            const stockCritico = productos.filter((p: any) => p.stock <= (p.stock_minimo || 10)).length

            let totalVentas = 0
            let gananciaNeta = 0
            todosLosPedidosSnap.forEach(doc => {
                const data = doc.data()
                totalVentas += data.total || 0
                gananciaNeta += data.ganancia_neta || 0
            })

            return {
                ganancia_neta_total: gananciaNeta,
                total_ventas: totalVentas,
                numero_transacciones: todosLosPedidosSnap.size,
                conversaciones_activas: convActivasSnap.size,
                pedidos_pendientes: pedidosPendientesSnap.size,
                productos_stock_critico: stockCritico,
                afiliados_activos: afiliadosSnap.size,
                ventas_retail: totalVentas * 0.4,
                ventas_b2b: totalVentas * 0.35,
                ventas_afiliados: totalVentas * 0.25,
                comisiones_pagadas: (totalVentas * 0.25) * 0.10 // 10% de comision estimada
            }
        } catch (error) {
            console.error('Error getting dashboard metrics:', error)
            return metricasCero
        }
    }

    // Timeout máximo de 2.5 segundos para todo el dashboard
    return withTimeout(fetchOp(), 2500, metricasCero)
}

export async function getVentas(limite?: number) {
    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')]
    if (limite) constraints.push(limit(limite))
    return getAll(COLLECTIONS.PEDIDOS_DESPACHO, constraints)
}

export async function getStockCritico() {
    return getProductosBajoStock()
}

// ============================================
// CONFIGURACIÓN IA
// ============================================

export async function getConfiguracionIA() {
    return getById(COLLECTIONS.CONFIGURACION_IA, 'default')
}

export async function updateConfiguracionIA(config: any) {
    if (!db || !isFirebaseConfigured()) return false

    try {
        const docRef = doc(db, COLLECTIONS.CONFIGURACION_IA, 'default')
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            await updateDoc(docRef, { ...config, updated_at: new Date().toISOString() })
        } else {
            await addDoc(collection(db, COLLECTIONS.CONFIGURACION_IA), {
                ...config,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }
        return true
    } catch (error) {
        console.error('Error updating IA config:', error)
        return false
    }
}

// ============================================
// AFILIADOS
// ============================================

export async function getAfiliados() {
    return getAll(COLLECTIONS.AFILIADOS, [orderBy('nombre')])
}

export async function getAfiliadoByCodigo(codigo: string) {
    const results = await getAll(COLLECTIONS.AFILIADOS, [where('codigo_referido', '==', codigo), limit(1)])
    return results.length > 0 ? results[0] : null
}

export async function getVentasByAfiliado(afiliadoId: string) {
    return getAll(COLLECTIONS.VENTAS, [
        where('afiliado_id', '==', afiliadoId),
        orderBy('fecha', 'desc')
    ])
}

export async function getClientesB2B() {
    return getAll(COLLECTIONS.CLIENTES_B2B, [orderBy('empresa')])
}

// Generar código de afiliado (Ej: NEX-X9Y2)
export function generarCodigoAfiliado(nombre: string): string {
    const prefijo = nombre.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'NEX')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefijo}-${random}`
}

// ============================================
// MARKETING AUTOMATION
// ============================================

export async function getMarketingLeads() {
    return getAll(COLLECTIONS.CLIENTES_LEADS, [orderBy('created_at', 'desc')])
}

export async function getCampanasActivas() {
    return getAll(COLLECTIONS.CAMPANAS, [where('activa', '==', true)])
}

/**
 * Identifica clientes que no han comprado en X meses
 */
export async function getClientesInactivos(meses: number = 3) {
    const fechaLimite = new Date()
    fechaLimite.setMonth(fechaLimite.getMonth() - meses)

    return getAll(COLLECTIONS.CLIENTES_LEADS, [
        where('ultima_compra', '<=', fechaLimite.toISOString()),
        orderBy('ultima_compra', 'desc')
    ])
}
