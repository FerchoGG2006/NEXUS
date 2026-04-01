"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
// Initialize Admin if not already
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'nexus-autosales'
    });
}
const db = admin.firestore();
async function testMarketplaceLogic() {
    var _a, _b, _c;
    const mockPayload = {
        object: 'page',
        entry: [{
                messaging: [{
                        sender: { id: 'test_user_logic' },
                        message: {
                            mid: 'mid.test_logic_123',
                            text: 'Hola, vi esto en Marketplace'
                        },
                        referral: {
                            source: 'MARKETPLACE',
                            ref: 'SKU-LOGIC-TEST'
                        }
                    }]
            }]
    };
    console.log('Simulando procesamiento de mensaje de Marketplace...');
    // Simular handleFacebokInstagram logic
    const entry = (_a = mockPayload.entry) === null || _a === void 0 ? void 0 : _a[0];
    const messaging = (_b = entry === null || entry === void 0 ? void 0 : entry.messaging) === null || _b === void 0 ? void 0 : _b[0];
    const senderId = messaging.sender.id;
    const message = messaging.message;
    const ref = messaging.referral;
    const contexto = `Marketplace Ad Source: ${ref.source}, Ref: ${ref.ref}`;
    const docData = {
        plataforma: 'facebook',
        mensaje_id: message.mid,
        sender_id: senderId,
        sender_name: 'Usuario Meta (Test Logic)',
        texto: message.text,
        tipo: 'texto',
        contexto_externo: contexto,
        timestamp: new Date().toISOString(),
        procesado: false
    };
    const res = await db.collection('mensajes_entrantes').add(docData);
    console.log('Mensaje guardado en Firestore con ID:', res.id);
    // Verificar persistencia
    const savedDoc = await res.get();
    console.log('Datos guardados:', JSON.stringify(savedDoc.data(), null, 2));
    if ((_c = savedDoc.data()) === null || _c === void 0 ? void 0 : _c.contexto_externo.includes('SKU-LOGIC-TEST')) {
        console.log('VERIFICACIÓN EXITOSA: El contexto de Marketplace se guardó correctamente.');
    }
    else {
        console.error('VERIFICACIÓN FALLIDA: El contexto no coincide.');
    }
}
testMarketplaceLogic().catch(console.error);
//# sourceMappingURL=test_logic.js.map