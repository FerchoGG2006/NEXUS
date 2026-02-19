import { getProductosActivos, create, COLLECTIONS } from '@/lib/firebase';
import { Producto } from '@/types';

export const ProductosService = {
    getAllActive: async (): Promise<Producto[]> => {
        const data = await getProductosActivos();
        return data as Producto[];
    },

    // Future methods can be added here
    // create: async (producto: Omit<Producto, 'id'>) => { ... }
};
