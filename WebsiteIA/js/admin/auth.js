/* =========================================
   ADMIN/AUTH.JS — Firebase Auth (Email/Senha) + verificação de UID em admins/{uid}
========================================= */

import { getAuthContext, getFirestoreContext, isFirebaseConfigured } from '../firebase.js';

export { isFirebaseConfigured };

/**
 * Verifica no Firestore se o UID autenticado está provisionado em `admins/{uid}`.
 * Regra de segurança impede qualquer cliente de escrever em `admins/`.
 */
export async function checkAdminAuthorization(uid) {
    if (!uid) return false;
    try {
        const { db, firestore } = await getFirestoreContext();
        const { doc, getDoc } = firestore;
        const snap = await getDoc(doc(db, 'admins', uid));
        return snap.exists();
    } catch {
        return false;
    }
}

export async function observeAdminAuth(callback) {
    const { auth, authMod } = await getAuthContext();
    return authMod.onAuthStateChanged(auth, async (user) => {
        if (!user) {
            callback({ state: 'signed-out', user: null, isAdmin: false });
            return;
        }
        const isAdmin = await checkAdminAuthorization(user.uid);
        callback({
            state: isAdmin ? 'authorized' : 'unauthorized',
            user,
            isAdmin,
        });
    });
}

export async function signInAdmin(email, password) {
    const { auth, authMod } = await getAuthContext();
    return authMod.signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOutAdmin() {
    const { auth, authMod } = await getAuthContext();
    return authMod.signOut(auth);
}

export function mapAuthErrorCode(error, lang = 'en') {
    const code = error?.code || '';
    const isPt = lang === 'pt';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return isPt ? 'E-mail ou senha inválidos.' : 'Invalid email or password.';
    }
    if (code === 'auth/invalid-email') {
        return isPt ? 'Informe um e-mail válido.' : 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
        return isPt ? 'Muitas tentativas. Aguarde alguns minutos.' : 'Too many attempts. Please wait a few minutes.';
    }
    if (code === 'auth/network-request-failed') {
        return isPt ? 'Falha de rede ao conectar ao Firebase.' : 'Network error connecting to Firebase.';
    }
    return isPt ? 'Não foi possível entrar. Verifique suas credenciais.' : 'Sign in failed. Please check your credentials.';
}
