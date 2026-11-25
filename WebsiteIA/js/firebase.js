/* =========================================
   FIREBASE.JS — Inicialização sob demanda do Firebase Web SDK Modular
   Carrega Auth apenas no /admin; site público carrega apenas App + Firestore.
========================================= */

import {
    FIREBASE_CONFIG,
    FIREBASE_EMULATOR_CONFIG,
    FIREBASE_SDK_VERSION,
    isFirebaseConfigured,
    shouldUseFirebaseEmulator,
} from './firebase.config.js';

const CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

let appInstance = null;
let firestoreInstance = null;
let authInstance = null;
let firestoreModuleCache = null;
let authModuleCache = null;
let emulatorsConnected = { auth: false, firestore: false };

export { isFirebaseConfigured };

async function getFirebaseApp() {
    if (!isFirebaseConfigured()) {
        throw new Error('FIREBASE_NOT_CONFIGURED');
    }
    if (appInstance) return appInstance;

    const { initializeApp, getApps, getApp } = await import(`${CDN_BASE}/firebase-app.js`);
    appInstance = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    return appInstance;
}

export async function getFirestoreContext() {
    const app = await getFirebaseApp();
    if (!firestoreModuleCache) {
        firestoreModuleCache = await import(`${CDN_BASE}/firebase-firestore.js`);
    }
    if (!firestoreInstance) {
        firestoreInstance = firestoreModuleCache.getFirestore(app);
        if (shouldUseFirebaseEmulator() && !emulatorsConnected.firestore) {
            firestoreModuleCache.connectFirestoreEmulator(
                firestoreInstance,
                FIREBASE_EMULATOR_CONFIG.firestoreHost,
                FIREBASE_EMULATOR_CONFIG.firestorePort
            );
            emulatorsConnected.firestore = true;
        }
    }
    return { db: firestoreInstance, firestore: firestoreModuleCache };
}

export async function getAuthContext() {
    const app = await getFirebaseApp();
    if (!authModuleCache) {
        authModuleCache = await import(`${CDN_BASE}/firebase-auth.js`);
    }
    if (!authInstance) {
        authInstance = authModuleCache.getAuth(app);
        if (shouldUseFirebaseEmulator() && !emulatorsConnected.auth) {
            authModuleCache.connectAuthEmulator(authInstance, FIREBASE_EMULATOR_CONFIG.authUrl, {
                disableWarnings: true,
            });
            emulatorsConnected.auth = true;
        }
    }
    return { auth: authInstance, authMod: authModuleCache };
}
