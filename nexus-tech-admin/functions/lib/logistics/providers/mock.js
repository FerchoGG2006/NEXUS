"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProvider = void 0;
class MockProvider {
    constructor() {
        this.name = 'MOCK_LOGISTICS';
    }
    async quote(destination) {
        const dest = destination.toLowerCase();
        // Simulación: Lima es más barato y rápido
        if (dest.includes('lima') || dest.includes('callao')) {
            return { cost: 10000, days: 1 };
        }
        // Provincia
        return { cost: 25000, days: 3 };
    }
    async createShipment(order) {
        var _a;
        const dest = ((_a = order.datos_envio) === null || _a === void 0 ? void 0 : _a.ciudad) || '';
        const quote = await this.quote(dest);
        const timestamp = Date.now().toString().slice(-4);
        const prefix = quote.days === 1 ? 'LIMA' : 'PROV';
        return {
            tracking_number: `MOCK-${prefix}-${timestamp}`,
            courier_name: quote.days === 1 ? 'FLOTA_PROPIA_MOCK' : 'SHALOM_MOCK',
            cost: quote.cost,
            estimated_days: quote.days,
            label_url: `https://nexus-logistics.demo/labels/${order.id}.pdf`
        };
    }
}
exports.MockProvider = MockProvider;
//# sourceMappingURL=mock.js.map