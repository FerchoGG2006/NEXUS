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
    CLIENTES_B2B: 'clientes_b2b'
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

export async function getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    if (!db || !isFirebaseConfigured()) return []

    try {
        const q = query(collection(db, collectionName), ...constraints)
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

export async function getById<T>(collectionName: string, id: string): Promise<T | null> {
    if (!db || !isFirebaseConfigured()) return null

    try {
        const docRef = doc(db, collectionName, id)
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

export async function getMetricasDashboard() {
    if (!db || !isFirebaseConfigured()) return null

    try {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        // Productos
        const productosSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTOS))
        const productos = productosSnap.docs.map(d => d.data())
        const stockCritico = productos.filter((p: any) => p.stock <= (p.stock_minimo || 10)).length

        // Conversaciones activas
        const convActivas = await getDocs(query(
            collection(db, COLLECTIONS.CONVERSACIONES),
            where('estado', 'in', ['activa', 'negociando', 'esperando_pago'])
        ))

        // Pedidos pendientes
        const pedidosPendientes = await getDocs(query(
            collection(db, COLLECTIONS.PEDIDOS_DESPACHO),
            where('estado', '==', 'pendiente')
        ))

        // Ventas totales (todos los pedidos)
        const todosLosPedidos = await getDocs(collection(db, COLLECTIONS.PEDIDOS_DESPACHO))
        let totalVentas = 0
        let gananciaNeta = 0
        todosLosPedidos.forEach(doc => {
            const data = doc.data()
            totalVentas += data.total || 0
            gananciaNeta += data.ganancia_neta || 0
        })

        // Afiliados activos
        const afiliadosSnap = await getDocs(query(
            collection(db, COLLECTIONS.AFILIADOS),
            where('activo', '==', true)
        ))

        return {
            ganancia_neta_total: gananciaNeta,
            total_ventas: totalVentas,
            numero_transacciones: todosLosPedidos.size,
            conversaciones_activas: convActivas.size,
            pedidos_pendientes: pedidosPendientes.size,
            productos_stock_critico: stockCritico,
            afiliados_activos: afiliadosSnap.size,
            ventas_retail: totalVentas * 0.4,  // Placeholder
            ventas_b2b: totalVentas * 0.35,
            ventas_afiliados: totalVentas * 0.25
        }
    } catch (error) {
        console.error('Error getting dashboard metrics:', error)
        return null
    }
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
