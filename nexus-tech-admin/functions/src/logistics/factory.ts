import { LogisticsProvider } from './types';
import { MockProvider } from './providers/mock';

export class LogisticsFactory {
    static getProvider(): LogisticsProvider {
        // En el futuro, aquí podríamos leer una variable de entorno
        // para retornar ServientregaProvider, CoordinadoraProvider, etc.
        return new MockProvider();
    }
}
