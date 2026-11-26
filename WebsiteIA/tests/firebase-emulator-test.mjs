/* =========================================
   FIREBASE-EMULATOR-TEST.MJS
   Validação REAL das Firestore Security Rules + Fluxo E2E completo de /admin e /
   contra o Firebase Emulator Suite (Auth :9099 + Firestore :8080).

   Uso (na raiz do repositório):
     firebase emulators:exec --only auth,firestore --project demo-malaman-test "node WebsiteIA/tests/firebase-emulator-test.mjs"
========================================= */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

const PROJECT_ID = 'demo-malaman-test';
const AUTH_HOST = 'http://127.0.0.1:9099';
const FIRESTORE_HOST = 'http://127.0.0.1:8080';
const FIRESTORE_DOCS_BASE = `${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TEST_PORT = 4176;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
};

// ── Helpers Auth & Firestore Emulator REST API ──

async function clearEmulators() {
    await fetch(`${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
    await fetch(`${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' });
}

async function createAuthUser(email, password) {
    const res = await fetch(`${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    assert.ok(res.ok && data.localId && data.idToken, `Falha ao criar usuário no Auth Emulator: ${JSON.stringify(data)}`);
    return { uid: data.localId, idToken: data.idToken, email };
}

/**
 * Provisiona admins/{uid} usando token privilegiado `Bearer owner` do Emulator
 * (equivale à criação manual pelo operador no Firebase Console).
 */
async function provisionAdminDocAsOperator(uid) {
    const res = await fetch(`${FIRESTORE_DOCS_BASE}/admins/${uid}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer owner',
        },
        body: JSON.stringify({
            fields: {
                role: { stringValue: 'editor' },
                active: { booleanValue: true },
            },
        }),
    });
    assert.equal(res.status, 200, `Falha ao provisionar admins/${uid}: ${await res.text()}`);
}

function toFirestoreVideoFields(overrides = {}) {
    const base = {
        type: 'portfolio',
        platform: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=uBYjF4wlC84',
        externalId: 'uBYjF4wlC84',
        title: 'Terraria',
        fullTitle: 'Terraria',
        badge: 'YouTube',
        durationSeconds: 320,
        tools: ['Premiere Pro', 'After Effects'],
        featured: false,
        sortOrder: 1,
        published: true,
        startSeconds: 0,
        thumbnailUrl: null,
        ...overrides,
    };

    const fields = {};
    for (const [k, v] of Object.entries(base)) {
        if (v === null) fields[k] = { nullValue: null };
        else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
        else if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (Array.isArray(v)) {
            fields[k] = { arrayValue: { values: v.map((item) => ({ stringValue: String(item) })) } };
        }
    }
    return { fields };
}

async function fsRequest(method, docPath, { idToken = null, body = null } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    const res = await fetch(`${FIRESTORE_DOCS_BASE}/${docPath}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, text };
}

async function fsRunQuery(structuredQuery, idToken = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    const res = await fetch(`${FIRESTORE_DOCS_BASE}:runQuery`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ structuredQuery }),
    });
    const text = await res.text();
    return { status: res.status, text };
}

// ── PARTE 1: Testes Diretos das Firestore Security Rules ──

async function testFirestoreRules(adminUser, intruderUser) {
    const results = [];
    const check = (name, condition, detail = '') => {
        assert.ok(condition, `RULE CHECK FAILED [${name}]: ${detail}`);
        results.push({ name, status: 'PASS' });
    };

    // 1. Admin cria 1 vídeo publicado e 1 rascunho
    const createPub = await fsRequest('PATCH', 'videos/rule-pub-1', {
        idToken: adminUser.idToken,
        body: toFirestoreVideoFields({ title: 'Published Test', published: true, sortOrder: 1 }),
    });
    check('admin_create_published_video', createPub.status === 200, createPub.text);

    const createDraft = await fsRequest('PATCH', 'videos/rule-draft-1', {
        idToken: adminUser.idToken,
        body: toFirestoreVideoFields({ title: 'Secret Draft', published: false, sortOrder: 2 }),
    });
    check('admin_create_draft_video', createDraft.status === 200, createDraft.text);

    // 2. Admin cria vídeos válidos para YouTube Short, Instagram Reel e TikTok
    const createShort = await fsRequest('PATCH', 'videos/rule-short-yt', {
        idToken: adminUser.idToken,
        body: toFirestoreVideoFields({
            type: 'short',
            platform: 'youtube',
            sourceUrl: 'https://www.youtube.com/shorts/nnYtBp6B8-A',
            externalId: 'nnYtBp6B8-A',
            title: 'Nintendo Short',
            badge: 'Short',
            durationSeconds: null,
        }),
    });
    check('admin_create_youtube_short', createShort.status === 200, createShort.text);

    const createIg = await fsRequest('PATCH', 'videos/rule-short-ig', {
        idToken: adminUser.idToken,
        body: toFirestoreVideoFields({
            type: 'short',
            platform: 'instagram',
            sourceUrl: 'https://www.instagram.com/reel/C8abc123XYZ/',
            externalId: 'C8abc123XYZ',
            title: 'IG Reel',
            badge: 'Reel',
            durationSeconds: null,
        }),
    });
    check('admin_create_instagram_short', createIg.status === 200, createIg.text);

    const createTt = await fsRequest('PATCH', 'videos/rule-short-tt', {
        idToken: adminUser.idToken,
        body: toFirestoreVideoFields({
            type: 'short',
            platform: 'tiktok',
            sourceUrl: 'https://www.tiktok.com/@malamanoficial/video/7345678901234567890',
            externalId: '7345678901234567890',
            title: 'TikTok Edit',
            badge: 'TikTok',
            durationSeconds: null,
        }),
    });
    check('admin_create_tiktok_short', createTt.status === 200, createTt.text);

    // 3. Visitante ANÔNIMO: pode ler publicado, NÃO pode ler rascunho, NÃO pode listar todos, NÃO pode escrever
    const anonGetPub = await fsRequest('GET', 'videos/rule-pub-1');
    check('anon_read_published_allowed', anonGetPub.status === 200, anonGetPub.text);

    const anonGetDraft = await fsRequest('GET', 'videos/rule-draft-1');
    check('anon_read_draft_denied', anonGetDraft.status === 403, anonGetDraft.text);

    const anonQueryPub = await fsRunQuery({
        from: [{ collectionId: 'videos' }],
        where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
        orderBy: [{ field: { fieldPath: 'sortOrder' }, direction: 'ASCENDING' }],
    });
    check('anon_query_published_allowed', anonQueryPub.status === 200, anonQueryPub.text);

    const anonQueryAll = await fsRunQuery({
        from: [{ collectionId: 'videos' }],
    });
    check('anon_query_all_videos_denied', anonQueryAll.status === 403, anonQueryAll.text);

    const anonWrite = await fsRequest('PATCH', 'videos/anon-hack', {
        body: toFirestoreVideoFields({ title: 'Anon Hack' }),
    });
    check('anon_write_video_denied', anonWrite.status === 403, anonWrite.text);

    const anonDelete = await fsRequest('DELETE', 'videos/rule-pub-1');
    check('anon_delete_video_denied', anonDelete.status === 403, anonDelete.text);

    const anonReadAdmin = await fsRequest('GET', `admins/${adminUser.uid}`);
    check('anon_read_admins_denied', anonReadAdmin.status === 403, anonReadAdmin.text);

    // 4. Usuário autenticado NÃO AUTORIZADO (intruso): NÃO lê rascunho, NÃO escreve, NÃO se auto-promove em admins/{uid}
    const intruderReadPub = await fsRequest('GET', 'videos/rule-pub-1', { idToken: intruderUser.idToken });
    check('intruder_read_published_allowed', intruderReadPub.status === 200, intruderReadPub.text);

    const intruderReadDraft = await fsRequest('GET', 'videos/rule-draft-1', { idToken: intruderUser.idToken });
    check('intruder_read_draft_denied', intruderReadDraft.status === 403, intruderReadDraft.text);

    const intruderWrite = await fsRequest('PATCH', 'videos/intruder-hack', {
        idToken: intruderUser.idToken,
        body: toFirestoreVideoFields({ title: 'Intruder Hack' }),
    });
    check('intruder_write_video_denied', intruderWrite.status === 403, intruderWrite.text);

    const intruderUpdate = await fsRequest('PATCH', 'videos/rule-pub-1', {
        idToken: intruderUser.idToken,
        body: toFirestoreVideoFields({ title: 'Tampered' }),
    });
    check('intruder_update_video_denied', intruderUpdate.status === 403, intruderUpdate.text);

    const intruderDelete = await fsRequest('DELETE', 'videos/rule-pub-1', { idToken: intruderUser.idToken });
    check('intruder_delete_video_denied', intruderDelete.status === 403, intruderDelete.text);

    const intruderSelfPromote = await fsRequest('PATCH', `admins/${intruderUser.uid}`, {
        idToken: intruderUser.idToken,
        body: { fields: { role: { stringValue: 'editor' } } },
    });
    check('intruder_self_promote_admins_denied', intruderSelfPromote.status === 403, intruderSelfPromote.text);

    const intruderReadOtherAdmin = await fsRequest('GET', `admins/${adminUser.uid}`, { idToken: intruderUser.idToken });
    check('intruder_read_other_admin_denied', intruderReadOtherAdmin.status === 403, intruderReadOtherAdmin.text);

    // 5. Admin NÃO pode escrever em admins/{uid} nem em coleções desconhecidas; validações server-side bloqueiam payloads maliciosos
    const adminWriteAdmins = await fsRequest('PATCH', `admins/${adminUser.uid}`, {
        idToken: adminUser.idToken,
        body: { fields: { role: { stringValue: 'super' } } },
    });
    check('admin_client_write_admins_denied', adminWriteAdmins.status === 403, adminWriteAdmins.text);

    const adminWriteUnknown = await fsRequest('PATCH', 'unknown_col/doc1', {
        idToken: adminUser.idToken,
        body: { fields: { x: { stringValue: 'y' } } },
    });
    check('unknown_collection_denied_even_for_admin', adminWriteUnknown.status === 403, adminWriteUnknown.text);

    const badPayloads = [
        ['reject_javascript_url', toFirestoreVideoFields({ sourceUrl: 'javascript:alert(1)' })],
        ['reject_non_whitelist_host', toFirestoreVideoFields({ sourceUrl: 'https://evil.com/watch?v=uBYjF4wlC84' })],
        ['reject_iframe_html', toFirestoreVideoFields({ sourceUrl: '<iframe src="https://youtube.com/embed/uBYjF4wlC84"></iframe>' })],
        ['reject_empty_title', toFirestoreVideoFields({ title: '' })],
        ['reject_invalid_type', toFirestoreVideoFields({ type: 'banner' })],
        ['reject_negative_sortOrder', toFirestoreVideoFields({ sortOrder: -5 })],
        ['reject_too_many_tools', toFirestoreVideoFields({ tools: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] })],
        ['reject_untrusted_thumbnail', toFirestoreVideoFields({ thumbnailUrl: 'https://evil.com/thumb.jpg' })],
        ['reject_extra_unknown_field', toFirestoreVideoFields({ injectedField: 'hack' })],
    ];

    for (const [name, payload] of badPayloads) {
        const res = await fsRequest('PATCH', `videos/bad-${name}`, {
            idToken: adminUser.idToken,
            body: payload,
        });
        check(name, res.status === 403, `Expected 403, got ${res.status}: ${res.text}`);
    }

    // 6. Admin lê rascunho e deleta vídeos de teste
    const adminReadDraft = await fsRequest('GET', 'videos/rule-draft-1', { idToken: adminUser.idToken });
    check('admin_read_draft_allowed', adminReadDraft.status === 200, adminReadDraft.text);

    const adminDelete = await fsRequest('DELETE', 'videos/rule-draft-1', { idToken: adminUser.idToken });
    check('admin_delete_video_allowed', adminDelete.status === 200, adminDelete.text);

    return results;
}

// ── PARTE 2: Servidor Local com Config de Emulator APENAS em memória (zero alteração no disco) ──

function startEmulatorTestServer(port) {
    const emulatorConfigJs = `
export const FIREBASE_SDK_VERSION = '11.6.0';
export const FIREBASE_CONFIG = Object.freeze({
    apiKey: 'demo-api-key',
    authDomain: '${PROJECT_ID}.firebaseapp.com',
    projectId: '${PROJECT_ID}',
    storageBucket: '${PROJECT_ID}.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:demo000000000000',
});
export const FIREBASE_EMULATOR_CONFIG = Object.freeze({
    useEmulator: true,
    authUrl: '${AUTH_HOST}',
    firestoreHost: '127.0.0.1',
    firestorePort: 8080,
});
export function getMissingFirebaseFields() { return []; }
export function isFirebaseConfigured() { return true; }
export function shouldUseFirebaseEmulator() { return true; }
`;

    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const rawPath = (req.url || '/').split('?')[0];
            if (rawPath === '/js/firebase.config.js') {
                res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
                res.end(emulatorConfigJs);
                return;
            }

            let targetRel;
            if (rawPath === '/' || rawPath === '/index.html') targetRel = 'index.html';
            else if (rawPath === '/admin' || rawPath === '/admin/' || rawPath === '/admin/index.html') targetRel = 'admin/index.html';
            else targetRel = rawPath.replace(/^\/+/, '');

            const fullPath = path.resolve(SITE_ROOT, targetRel);
            fs.readFile(fullPath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(fullPath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                res.end(data);
            });
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}

class CDP {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.id = 0;
        this.pending = new Map();
        this.listeners = new Map();
        this.ready = new Promise((res, rej) => {
            this.ws.addEventListener('open', res);
            this.ws.addEventListener('error', rej);
        });
        this.ws.addEventListener('message', (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(msg.error.message));
                else resolve(msg.result);
            } else if (msg.method) {
                (this.listeners.get(msg.method) || []).forEach((cb) => cb(msg.params));
            }
        });
    }
    on(m, cb) {
        if (!this.listeners.has(m)) this.listeners.set(m, []);
        this.listeners.get(m).push(cb);
    }
    send(method, params = {}) {
        const id = ++this.id;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }
    async eval(expression) {
        const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
        }
        return res.result.value;
    }
    close() { try { this.ws.close(); } catch {} }
}

async function waitForCondition(cdp, jsExpr, timeoutMs = 8000, label = 'condition') {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const val = await cdp.eval(jsExpr);
        if (val) return val;
        await new Promise((r) => setTimeout(r, 150));
    }
    const diag = await cdp.eval(`({
        toast: document.getElementById('admin-toast')?.textContent,
        formErr: document.getElementById('form-error')?.textContent,
        errUrl: document.getElementById('err-url')?.textContent,
        errTitle: document.getElementById('err-title')?.textContent,
        titles: Array.from(document.querySelectorAll('.admin-video-title')).map(e => e.textContent),
        drafts: document.getElementById('stat-drafts')?.textContent,
    })`);
    throw new Error(`Timeout waiting for ${label} | diag=${JSON.stringify(diag)}`);
}

async function testBrowserAdminAndPublicRealtime(baseUrl, adminCreds, intruderCreds) {
    const chromeBin = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const cdpPort = 9229;
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'malaman-emu-e2e-'));
    const chrome = spawn(
        chromeBin,
        [
            '--headless=new',
            `--remote-debugging-port=${cdpPort}`,
            `--user-data-dir=${userDataDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-gpu',
            '--window-size=1280,900',
            'about:blank',
        ],
        { stdio: 'ignore' }
    );

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const consoleErrors = [];

    try {
        let wsUrl = null;
        for (let i = 0; i < 40; i++) {
            try {
                const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
                wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
                if (wsUrl) break;
            } catch {}
            await wait(150);
        }
        assert.ok(wsUrl, 'Chrome DevTools não respondeu');

        const cdp = new CDP(wsUrl);
        await cdp.ready;
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        cdp.on('Runtime.consoleAPICalled', (p) => {
            if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' '));
        });
        cdp.on('Runtime.exceptionThrown', (p) => consoleErrors.push(p.exceptionDetails?.text || 'Uncaught exception'));

        // A. Site público com Firestore configurado e VAZIO -> deve mostrar estado vazio real (NÃO mascarar com fallback!)
        await cdp.send('Page.navigate', { url: `${baseUrl}/` });
        await waitForCondition(
            cdp,
            `document.querySelector('#portfolio-grade .section__state') !== null`,
            10000,
            'empty Firestore state on public /'
        );
        const publicEmptyState = await cdp.eval(`({
            portfolioText: document.querySelector('#portfolio-grade .section__state p')?.textContent,
            shortsHidden: document.querySelector('.shorts__carrossel__viewport')?.hidden === true,
            shortsEmptyText: document.querySelector('#shorts-state .section__state p')?.textContent,
        })`);
        assert.equal(publicEmptyState.portfolioText, 'No published videos yet.');
        assert.equal(publicEmptyState.shortsHidden, true);
        assert.equal(publicEmptyState.shortsEmptyText, 'No vertical videos published yet.');

        // B. Abrir /admin -> deve exibir tela de LOGIN (não setup!)
        await cdp.send('Page.navigate', { url: `${baseUrl}/admin` });
        await waitForCondition(cdp, `getComputedStyle(document.getElementById('view-login')).display !== 'none'`, 10000, 'login view visible');

        // C. Login com senha incorreta -> erro amigável
        await cdp.eval(`(() => {
            document.getElementById('login-email').value = ${JSON.stringify(adminCreds.email)};
            document.getElementById('login-password').value = 'WrongPassword!123';
            document.getElementById('admin-login-form').requestSubmit();
        })()`);
        await waitForCondition(cdp, `!document.getElementById('login-error').hidden`, 8000, 'invalid login error');
        const wrongPassMsg = await cdp.eval(`document.getElementById('login-error').textContent`);
        assert.ok(wrongPassMsg.length > 5, 'Mensagem de erro ao errar senha');

        // D. Login com usuário NÃO autorizado -> deve exibir #view-unauthorized com UID e bloquear dashboard
        await cdp.eval(`(() => {
            document.getElementById('login-email').value = ${JSON.stringify(intruderCreds.email)};
            document.getElementById('login-password').value = ${JSON.stringify(intruderCreds.password)};
            document.getElementById('admin-login-form').requestSubmit();
        })()`);
        await waitForCondition(cdp, `getComputedStyle(document.getElementById('view-unauthorized')).display !== 'none'`, 10000, 'unauthorized view');
        const unauthCheck = await cdp.eval(`({
            uidShown: document.getElementById('unauth-uid').textContent,
            dashHidden: getComputedStyle(document.getElementById('view-dashboard')).display === 'none',
        })`);
        assert.equal(unauthCheck.uidShown, intruderCreds.uid);
        assert.equal(unauthCheck.dashHidden, true);

        // Logout do usuário não autorizado
        await cdp.eval(`document.getElementById('unauth-logout-btn').click()`);
        await waitForCondition(cdp, `getComputedStyle(document.getElementById('view-login')).display !== 'none'`, 8000, 'return to login after unauth logout');

        // E. Login como ADMIN autorizado -> #view-dashboard visível!
        await cdp.eval(`(() => {
            document.getElementById('login-email').value = ${JSON.stringify(adminCreds.email)};
            document.getElementById('login-password').value = ${JSON.stringify(adminCreds.password)};
            document.getElementById('admin-login-form').requestSubmit();
        })()`);
        await waitForCondition(cdp, `getComputedStyle(document.getElementById('view-dashboard')).display !== 'none'`, 10000, 'admin dashboard visible');

        // F. Importação inicial idempotente (6 + 4 = 10) -> 1ª vez importa 10, 2ª vez importa 0 (pula 10)
        await cdp.eval(`document.getElementById('btn-import-initial').click()`);
        await waitForCondition(
            cdp,
            `document.getElementById('stat-total').textContent === '10' && !document.getElementById('admin-toast').hidden`,
            10000,
            '10 videos imported and toast shown'
        );
        const toastImport1 = await cdp.eval(`document.getElementById('admin-toast').textContent`);
        assert.ok(toastImport1.includes('10 imported'), `Toast 1ª importação inesperado: ${toastImport1}`);

        await cdp.eval(`document.getElementById('btn-import-initial').click()`);
        await waitForCondition(
            cdp,
            `document.getElementById('admin-toast').textContent.includes(': 0 imported')`,
            8000,
            'idempotent 2nd import toast'
        );
        const toastImport2 = await cdp.eval(`document.getElementById('admin-toast').textContent`);
        assert.ok(toastImport2.includes(': 0 imported') && toastImport2.includes('10 already present'), `Idempotência falhou: ${toastImport2}`);
        assert.equal(await cdp.eval(`document.getElementById('stat-total').textContent`), '10');

        // G. Criar 7º vídeo de Portfólio com duração, ferramentas e destaque
        await cdp.eval(`(() => {
            document.getElementById('btn-new-video').click();
            document.getElementById('field-url').value = 'https://youtu.be/dQw4w9WgXcQ?t=42s';
            document.getElementById('field-url').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('field-title').value = 'E2E Featured Edit';
            document.getElementById('field-duration').value = '08:30';
            document.querySelectorAll('#tools-checkboxes input[type="checkbox"]')[0].checked = true;
            document.querySelectorAll('#tools-checkboxes input[type="checkbox"]')[1].checked = true;
            document.getElementById('field-featured').checked = true;
            document.getElementById('field-published').checked = true;
            document.getElementById('video-form').requestSubmit();
        })()`);
        await waitForCondition(cdp, `document.getElementById('stat-portfolio').textContent === '7'`, 10000, '7th portfolio video created');

        // H. Reordenar: subir o 2º vídeo de portfólio (Playstation 2) para 1º lugar
        await cdp.eval(`(() => {
            document.querySelector('.admin-tab[data-filter="portfolio"]').click();
        })()`);
        await wait(200);
        const beforeOrder = await cdp.eval(`Array.from(document.querySelectorAll('.admin-video-title')).slice(0, 2).map(e => e.textContent)`);
        assert.deepEqual(beforeOrder, ['Terraria', 'Playstation 2']);

        await cdp.eval(`document.querySelectorAll('.admin-video-row')[1].querySelector('button[title="Move up"]').click()`);
        await waitForCondition(
            cdp,
            `document.querySelectorAll('.admin-video-title')[0]?.textContent === 'Playstation 2' && document.getElementById('admin-toast').textContent === 'Order updated.'`,
            8000,
            'reordered Playstation 2 to first (server confirmed)'
        );

        // I. Verificar site público `/` refletindo em tempo real: 7 vídeos, nova ordem, duração 8:30, tools, Featured badge!
        await cdp.send('Page.navigate', { url: `${baseUrl}/` });
        await waitForCondition(cdp, `document.querySelectorAll('#portfolio-grade .video__card').length === 7`, 10000, '7 videos on public site');
        const publicAfterAdmin = await cdp.eval(`(() => {
            const cards = Array.from(document.querySelectorAll('#portfolio-grade .video__card'));
            const titles = cards.map(c => c.querySelector('.video__titulo')?.textContent);
            const featuredCard = cards.find(c => c.classList.contains('video__card--featured'));
            return {
                count: cards.length,
                firstTitle: titles[0],
                secondTitle: titles[1],
                featuredTitle: featuredCard?.querySelector('.video__titulo')?.textContent,
                featuredDuration: featuredCard?.querySelector('.video__duration')?.textContent,
                featuredTools: Array.from(featuredCard?.querySelectorAll('.video__tool__pill') || []).map(p => p.textContent),
                shortFocusable: Array.from(document.querySelectorAll('.short__trigger')).filter(b => b.tabIndex >= 0).length,
                iframes: document.querySelectorAll('iframe').length,
            };
        })()`);
        assert.equal(publicAfterAdmin.count, 7);
        assert.equal(publicAfterAdmin.firstTitle, 'Playstation 2');
        assert.equal(publicAfterAdmin.secondTitle, 'Terraria');
        assert.equal(publicAfterAdmin.featuredTitle, 'E2E Featured Edit');
        assert.equal(publicAfterAdmin.featuredDuration, '8:30');
        assert.deepEqual(publicAfterAdmin.featuredTools, ['Premiere Pro', 'After Effects']);
        assert.equal(publicAfterAdmin.shortFocusable, 4);
        assert.equal(publicAfterAdmin.iframes, 0);

        // J. Voltar ao /admin (sessão persistida!), editar título, ocultar (unpublish) e excluir o 7º vídeo via modal de confirmação
        await cdp.send('Page.navigate', { url: `${baseUrl}/admin` });
        await waitForCondition(cdp, `document.getElementById('stat-portfolio').textContent === '7'`, 10000, 'admin reloaded with persisted session');

        // Editar título do E2E Featured Edit -> E2E Edited Title
        await cdp.eval(`(() => {
            const rows = Array.from(document.querySelectorAll('.admin-video-row'));
            const target = rows.find(r => r.querySelector('.admin-video-title')?.textContent === 'E2E Featured Edit');
            Array.from(target.querySelectorAll('button')).find(b => b.textContent === 'Edit').click();
            document.getElementById('field-title').value = 'E2E Edited Title';
            document.getElementById('video-form').requestSubmit();
        })()`);
        await waitForCondition(
            cdp,
            `Array.from(document.querySelectorAll('.admin-video-title')).some(e => e.textContent === 'E2E Edited Title') && document.getElementById('admin-toast').textContent === 'Video updated!'`,
            8000,
            'edited title saved (server confirmed)'
        );

        // Unpublish -> aguarda confirmação do servidor no toast antes de navegar
        await cdp.eval(`(() => {
            const rows = Array.from(document.querySelectorAll('.admin-video-row'));
            const target = rows.find(r => r.querySelector('.admin-video-title')?.textContent === 'E2E Edited Title');
            Array.from(target.querySelectorAll('button')).find(b => b.textContent === 'Unpublish').click();
        })()`);
        await waitForCondition(
            cdp,
            `document.getElementById('stat-drafts').textContent === '1' && document.getElementById('admin-toast').textContent === 'Video unpublished.'`,
            8000,
            'video unpublished to draft (server confirmed)'
        );

        // Confirmar no site público que voltou a exibir somente 6 publicados (rascunho invisível!)
        await cdp.send('Page.navigate', { url: `${baseUrl}/` });
        await waitForCondition(cdp, `document.querySelectorAll('#portfolio-grade .video__card').length === 6`, 10000, 'public back to 6 published videos');

        // Voltar ao /admin, excluir o rascunho via modal de confirmação e fazer Logout
        await cdp.send('Page.navigate', { url: `${baseUrl}/admin` });
        await waitForCondition(cdp, `document.getElementById('stat-drafts').textContent === '1'`, 10000, 'draft visible in admin');
        await cdp.eval(`(() => {
            const rows = Array.from(document.querySelectorAll('.admin-video-row'));
            const target = rows.find(r => r.querySelector('.admin-video-title')?.textContent === 'E2E Edited Title');
            Array.from(target.querySelectorAll('button')).find(b => b.textContent === 'Delete').click();
        })()`);
        await waitForCondition(cdp, `getComputedStyle(document.getElementById('confirm-dialog')).display !== 'none'`, 5000, 'delete confirm dialog');
        await cdp.eval(`document.getElementById('confirm-delete-btn').click()`);
        await waitForCondition(cdp, `document.getElementById('stat-total').textContent === '10'`, 8000, 'draft deleted cleanly');

        // Logout final
        await cdp.eval(`document.getElementById('admin-logout-btn').click()`);
        await waitForCondition(cdp, `getComputedStyle(document.getElementById('view-login')).display !== 'none'`, 8000, 'logged out to login view');

        assert.equal(consoleErrors.length, 0, `Erros de console no E2E Emulator: ${consoleErrors.join('; ')}`);

        cdp.close();
        return {
            publicEmptyState,
            wrongPassRejected: true,
            unauthorizedBlocked: true,
            idempotentImportVerified: true,
            publicAfterAdmin,
            editUnpublishDeleteLogoutVerified: true,
            consoleErrors,
        };
    } finally {
        chrome.kill();
        setTimeout(() => { try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {} }, 500);
    }
}

// ── Execução Principal ──

await clearEmulators();
const adminCreds = { email: 'carlos.admin@test.local', password: 'StrongAdminPassword#2026' };
const intruderCreds = { email: 'intruder@test.local', password: 'IntruderPassword#2026' };

const adminUser = await createAuthUser(adminCreds.email, adminCreds.password);
const intruderUser = await createAuthUser(intruderCreds.email, intruderCreds.password);
await provisionAdminDocAsOperator(adminUser.uid);

// 1. Regras do Firestore
const rulesResults = await testFirestoreRules(adminUser, intruderUser);

// Limpa documentos de teste de regras mantendo contas Auth + admins/{uid}
await fetch(`${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' });
await provisionAdminDocAsOperator(adminUser.uid);

// 2. E2E no Chrome real (/admin + / contra Auth & Firestore Emulators)
const server = await startEmulatorTestServer(TEST_PORT);
try {
    const e2eResults = await testBrowserAdminAndPublicRealtime(
        `http://127.0.0.1:${TEST_PORT}`,
        { ...adminCreds, uid: adminUser.uid },
        { ...intruderCreds, uid: intruderUser.uid }
    );
    console.log(JSON.stringify({
        status: 'ALL_FIREBASE_EMULATOR_RULES_AND_E2E_PASSED',
        rulesChecksPassed: rulesResults.length,
        rulesResults,
        e2eResults,
    }, null, 2));
} finally {
    server.close();
}
