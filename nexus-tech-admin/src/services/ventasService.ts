import { db, create, generarNumeroVenta, COLLECTIONS } from '@/lib/firebase';
import { Venta, VentasServiceResponse } from '@/types';
import { collection, query, orderBy, limit, startAfter, getDocs, QueryConstraint, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export const VentasService = {
    getAll: async (limitCount: number = 10, lastDoc: any = null): Promise<VentasServiceResponse> => {
        if (!db) return { data: [], lastDoc: null };

        try {
            const constraints: QueryConstraint[] = [orderBy('fecha', 'desc')];
            if (lastDoc) constraints.push(startAfter(lastDoc));
            if (limitCount) constraints.push(limit(limitCount));

            const q = query(collection(db, COLLECTIONS.VENTAS), ...constraints);
            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Venta[];

            const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

            return { data, lastDoc: lastVisible };
        } catch (error) {
            console.error('Error fetching ventas:', error);
            return { data: [], lastDoc: null };
        }
    },

    create: async (venta: Omit<Venta, 'id'>): Promise<string> => {
        // En un escenario real, aquí se validarían reglas de negocio antes de guardar
        const newId = await create(COLLECTIONS.VENTAS, venta);
        if (!newId) {
            throw new Error('Failed to create sale in database');
        }
        return newId;
    },

    generateNewSaleNumber: (): string => {
        return generarNumeroVenta();
    }
};
