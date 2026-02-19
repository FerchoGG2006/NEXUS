"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsFactory = void 0;
const mock_1 = require("./providers/mock");
class LogisticsFactory {
    static getProvider() {
        // En el futuro, aquí podríamos leer una variable de entorno
        // para retornar ServientregaProvider, CoordinadoraProvider, etc.
        return new mock_1.MockProvider();
    }
}
exports.LogisticsFactory = LogisticsFactory;
//# sourceMappingURL=factory.js.map