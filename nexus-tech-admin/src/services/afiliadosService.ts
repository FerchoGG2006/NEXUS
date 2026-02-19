import { getAfiliados, create, COLLECTIONS } from '@/lib/firebase';
import { Afiliado } from '@/types';

export const AfiliadosService = {
    getAll: async (): Promise<Afiliado[]> => {
        const data = await getAfiliados();
        return data as Afiliado[];
    },

    // Future methods can be added here
};
