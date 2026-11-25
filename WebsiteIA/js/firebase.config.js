/* =========================================
   FIREBASE.CONFIG.JS — Configuração pública do Firebase Web SDK
   IMPORTANTE:
   - Estes campos são a configuração PÚBLICA do aplicativo Web Firebase (NÃO são segredos de servidor).
   - NUNCA coloque private key, service account JSON ou senhas neste arquivo.
   - Enquanto os campos abaixo estiverem vazios/placeholder, o site público opera
     em modo fallback local somente leitura (`videos.data.js`) e o `/admin` exibe
     instruções de configuração.
   - Consulte `WebsiteIA/docs/SETUP_E_OPERACAO.md` para preencher corretamente.
========================================= */

export const FIREBASE_SDK_VERSION = '11.6.0';

export const FIREBASE_CONFIG = Object.freeze({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
});

/**
 * Emulador local (opcional para testes de regras sem tocar em produção).
 * Para testar localmente com `firebase emulators:start`, altere `useEmulator: true`
 * apenas durante testes locais em localhost.
 */
export const FIREBASE_EMULATOR_CONFIG = Object.freeze({
    useEmulator: false,
    authUrl: 'http://127.0.0.1:9099',
    firestoreHost: '127.0.0.1',
    firestorePort: 8080,
});

const PLACEHOLDER_PATTERN = /^(YOUR_|SUA_|SEU_|REPLACE_|<)/i;

export function getMissingFirebaseFields() {
    const required = ['apiKey', 'authDomain', 'projectId'];
    return required.filter((key) => {
        const val = FIREBASE_CONFIG[key];
        return typeof val !== 'string' || !val.trim() || PLACEHOLDER_PATTERN.test(val.trim());
    });
}

export function isFirebaseConfigured() {
    return getMissingFirebaseFields().length === 0;
}

export function shouldUseFirebaseEmulator() {
    if (!FIREBASE_EMULATOR_CONFIG.useEmulator) return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
}
