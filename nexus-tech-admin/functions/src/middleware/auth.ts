import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Extender la interfaz Request para incluir el usuario decodificado
declare module 'express-serve-static-core' {
    interface Request {
        user?: admin.auth.DecodedIdToken;
    }
}

/**
 * Middleware para validar el Bearer Token de Firebase Auth
 */
export const validateFirebaseIdToken = async (req: functions.https.Request, res: functions.Response, next: () => void) => {
    // 1. Verificar presencia del header Authorization
    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)) {
        res.status(403).send('Unauthorized');
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        // "Bearer <token>"
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
        // "__session=<token>"
        idToken = req.cookies.__session;
    } else {
        res.status(403).send('Unauthorized');
        return;
    }

    try {
        // 2. Verificar token con Firebase Admin
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        next();
        return;
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized');
        return;
    }
};
