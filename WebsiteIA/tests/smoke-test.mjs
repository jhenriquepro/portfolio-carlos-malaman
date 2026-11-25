/* =========================================
   SMOKE-TEST.MJS — Servidor local + Smoke Tests E2E/A11y/Performance (Zero dependências)
   Uso:
     node tests/smoke-test.mjs              -> executa todos os testes unitários e no Chrome Headless
     node tests/smoke-test.mjs --serve-only -> sobe servidor local em http://127.0.0.1:4173/
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
const SERVE_ONLY = process.argv.includes('--serve-only');
const SERVER_PORT = Number(process.env.PORT || 4173);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
};

function startStaticServer(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const rawPath = (req.url || '/').split('?')[0];
            let targetRel;
            if (rawPath === '/' || rawPath === '/index.html') {
                targetRel = 'index.html';
            } else if (rawPath === '/admin' || rawPath === '/admin/' || rawPath === '/admin/index.html') {
                targetRel = 'admin/index.html';
            } else {
                targetRel = rawPath.replace(/^\/+/, '');
            }

            const fullPath = path.resolve(SITE_ROOT, targetRel);
            if (!fullPath.startsWith(SITE_ROOT)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

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

function findChromeBinary() {
    const candidates = [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean);

    return candidates.find((p) => fs.existsSync(p)) || null;
}

class CDPClient {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.id = 0;
        this.pending = new Map();
        this.listeners = new Map();
        this.ready = new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve);
            this.ws.addEventListener('error', reject);
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
    on(method, cb) {
        if (!this.listeners.has(method)) this.listeners.set(method, []);
        this.listeners.get(method).push(cb);
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

async function runUnitChecks() {
    const { INITIAL_VIDEOS } = await import('../js/videos.data.js');
    const {
        parseVideoUrl,
        parseYouTubeUrl,
        buildYouTubeEmbedUrl,
        getPublishedVideosByType,
        formatDuration,
        parseDurationInput,
    } = await import('../js/video-utils.js');
    const { isFirebaseConfigured } = await import('../js/firebase.config.js');

    const portfolio = getPublishedVideosByType(INITIAL_VIDEOS, 'portfolio');
    const shorts = getPublishedVideosByType(INITIAL_VIDEOS, 'short');
    assert.equal(portfolio.length, 6, 'Deve preservar 6 vídeos horizontais');
    assert.equal(shorts.length, 4, 'Deve preservar 4 Shorts originais');
    assert.equal(portfolio.find((v) => v.externalId === 'x7-gclcs0Kk').startSeconds, 199);
    assert.equal(portfolio.find((v) => v.externalId === 'DhFKlwNxL1M').startSeconds, 337);

    // Suporte multi-plataforma seguro
    assert.equal(parseVideoUrl('https://www.instagram.com/reel/C8abc123XYZ/').platform, 'instagram');
    assert.equal(parseVideoUrl('https://www.instagram.com/reel/C8abc123XYZ/').embeddable, false);
    assert.equal(parseVideoUrl('https://www.tiktok.com/@malamanoficial/video/7345678901234567890').platform, 'tiktok');
    assert.equal(parseDurationInput('12:40'), 760);
    assert.equal(formatDuration(760), '12:40');

    // Rejeições de segurança
    for (const bad of [
        'javascript:alert(1)',
        '<iframe src="https://www.youtube.com/embed/uBYjF4wlC84"></iframe>',
        'http://www.youtube.com/watch?v=uBYjF4wlC84',
        'https://evil.com/watch?v=uBYjF4wlC84',
        'data:text/html,<script>alert(1)</script>',
        '',
    ]) {
        assert.equal(parseVideoUrl(bad), null, `URL maliciosa deveria ser bloqueada: ${bad}`);
        assert.equal(parseYouTubeUrl(bad), null);
    }
    assert.equal(buildYouTubeEmbedUrl('<script>'), null);

    // HTML sem iframes iniciais
    const indexHtml = fs.readFileSync(path.join(SITE_ROOT, 'index.html'), 'utf8');
    assert.equal((indexHtml.match(/<iframe/gi) || []).length, 0, 'index.html não pode ter iframes estáticos');

    const adminHtml = fs.readFileSync(path.join(SITE_ROOT, 'admin', 'index.html'), 'utf8');
    assert.ok(adminHtml.includes('name="robots" content="noindex, nofollow"'), '/admin deve conter meta noindex');

    return { firebaseConfigured: isFirebaseConfigured(), portfolioCount: portfolio.length, shortsCount: shorts.length };
}

async function runBrowserSuite(baseUrl) {
    const chromeBin = findChromeBinary();
    assert.ok(chromeBin, 'Chrome/Edge não encontrado para rodar os testes em navegador');

    const cdpPort = 9228;
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'malaman-v2-qa-'));
    const chrome = spawn(
        chromeBin,
        [
            '--headless=new',
            `--remote-debugging-port=${cdpPort}`,
            `--user-data-dir=${userDataDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-gpu',
            '--window-size=1280,800',
            'about:blank',
        ],
        { stdio: 'ignore' }
    );

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

        const cdp = new CDPClient(wsUrl);
        await cdp.ready;

        await cdp.send('Page.enable');
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Runtime.enable');

        await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `
                window.__PERF = { lcp: null, cls: 0, fcp: null };
                try {
                    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__PERF.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
                    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__PERF.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
                    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__PERF.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
                } catch {}
            `,
        });

        const requests = new Map();
        const failedLocal = [];
        const consoleErrors = [];

        cdp.on('Network.requestWillBeSent', (p) => {
            requests.set(p.requestId, { url: p.request.url, status: null });
        });
        cdp.on('Network.responseReceived', (p) => {
            const r = requests.get(p.requestId);
            if (r) r.status = p.response.status;
            if (p.response.url.startsWith(baseUrl) && p.response.status >= 400) {
                failedLocal.push(`${p.response.status} ${p.response.url}`);
            }
        });
        cdp.on('Runtime.consoleAPICalled', (p) => {
            if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' '));
        });
        cdp.on('Runtime.exceptionThrown', (p) => {
            consoleErrors.push(p.exceptionDetails?.text || 'Uncaught exception');
        });

        const navigateAndWait = async (url) => {
            const p = new Promise((res) => {
                const handler = () => res();
                cdp.on('Page.loadEventFired', handler);
            });
            await cdp.send('Page.navigate', { url });
            await p;
            await wait(450);
        };

        // 1. Desktop 1280x800 — Carga inicial + Performance
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        await navigateAndWait(`${baseUrl}/`);

        const perfMetrics = await cdp.eval(`(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            return {
                dclMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
                loadMs: nav ? Math.round(nav.loadEventEnd) : null,
                fcpMs: window.__PERF.fcp ? Math.round(window.__PERF.fcp) : null,
                lcpMs: window.__PERF.lcp ? Math.round(window.__PERF.lcp) : null,
                cls: Number(window.__PERF.cls.toFixed(4)),
                iframeCount: document.querySelectorAll('iframe').length,
                portfolioCount: document.querySelectorAll('#portfolio-grade .video__card').length,
                shortFocusable: Array.from(document.querySelectorAll('.short__trigger')).filter(b => b.tabIndex >= 0).length,
                clientsHidden: getComputedStyle(document.getElementById('clientes')).display === 'none',
                clientsNavHidden: Array.from(document.querySelectorAll('[data-clients-nav]')).every(el => getComputedStyle(el).display === 'none'),
                ytjobsHidden: getComputedStyle(document.getElementById('cta-ytjobs')).display === 'none',
                heroContactVisible: getComputedStyle(document.getElementById('cta-hero-contact')).display !== 'none',
                timelineVisible: getComputedStyle(document.getElementById('timeline-nav')).display === 'flex',
                overflow1280: document.documentElement.scrollWidth > window.innerWidth,
            };
        })()`);

        const allInitialReqs = Array.from(requests.values());
        const ytPlayerReqsInitial = allInitialReqs.filter((r) => /youtube\.com|youtube-nocookie\.com|googlevideo\.com/.test(r.url));

        assert.equal(perfMetrics.iframeCount, 0, 'Zero iframes antes de interação');
        assert.equal(ytPlayerReqsInitial.length, 0, 'Zero requisições a player YouTube no load inicial');
        assert.equal(perfMetrics.portfolioCount, 6, '6 cards de portfólio renderizados');
        assert.equal(perfMetrics.shortFocusable, 4, 'Apenas 4 Shorts focáveis por teclado');
        assert.equal(perfMetrics.clientsHidden, true, 'Seção clientes realmente oculta (display: none)');
        assert.equal(perfMetrics.clientsNavHidden, true, 'Links de clientes realmente ocultos (display: none)');
        assert.equal(perfMetrics.ytjobsHidden, true, 'Botão YTJobs realmente oculto (display: none)');
        assert.equal(perfMetrics.heroContactVisible, true, 'CTA fallback Discord visível no Hero');
        assert.equal(perfMetrics.timelineVisible, true, 'Timeline desktop visível em 1280px');
        assert.equal(perfMetrics.overflow1280, false, 'Sem overflow horizontal em 1280px');

        // 2. Modal Horizontal + Start=199 + Escape + Focus Restore
        const modalHoriz = await cdp.eval(`(() => {
            const trigger = document.querySelectorAll('#portfolio-grade .video__trigger')[4];
            trigger.focus();
            trigger.click();
            const modal = document.getElementById('video-modal');
            const iframe = modal.querySelector('iframe');
            return {
                open: !modal.hidden,
                iframeSrc: iframe?.src || null,
                mainInert: document.querySelector('main').inert,
                timelineInert: document.getElementById('timeline-nav').inert,
                closeFocused: document.activeElement?.classList.contains('video-modal__close'),
            };
        })()`);
        assert.equal(modalHoriz.open, true);
        assert.ok(modalHoriz.iframeSrc.includes('x7-gclcs0Kk') && modalHoriz.iframeSrc.includes('start=199'));
        assert.equal(modalHoriz.mainInert, true);
        assert.equal(modalHoriz.timelineInert, true);
        assert.equal(modalHoriz.closeFocused, true);

        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await wait(120);

        const afterHorizClose = await cdp.eval(`({
            closed: document.getElementById('video-modal').hidden === true,
            iframes: document.querySelectorAll('iframe').length,
            focusRestored: document.activeElement === document.querySelectorAll('#portfolio-grade .video__trigger')[4],
        })`);
        assert.deepEqual(afterHorizClose, { closed: true, iframes: 0, focusRestored: true });

        // 3. Modal Vertical (Short) + Fechamento por botão
        const shortFlow = await cdp.eval(`(() => {
            const btn = document.querySelector('#shorts-row-top .short__trigger');
            btn.click();
            const isVertical = document.querySelector('.video-modal__dialog').classList.contains('video-modal__dialog--vertical');
            const iframesOpen = document.querySelectorAll('iframe').length;
            document.querySelector('.video-modal__close').click();
            return { isVertical, iframesOpen, iframesAfter: document.querySelectorAll('iframe').length };
        })()`);
        assert.deepEqual(shortFlow, { isVertical: true, iframesOpen: 1, iframesAfter: 0 });

        // 4. Idioma EN -> PT -> persistência após reload -> EN
        await cdp.eval(`document.getElementById('btn-lang').click()`);
        const langPt = await cdp.eval(`({
            lang: document.documentElement.lang,
            title: document.title,
            devLinkIntact: document.querySelector('a.rodape__dev__link')?.href === 'https://www.instagram.com/jhenrique_dev',
        })`);
        assert.equal(langPt.lang, 'pt-BR');
        assert.equal(langPt.devLinkIntact, true);

        await navigateAndWait(`${baseUrl}/`);
        assert.equal(await cdp.eval(`document.documentElement.lang`), 'pt-BR', 'PT deve persistir após reload');
        await cdp.eval(`document.getElementById('btn-lang').click()`);
        assert.equal(await cdp.eval(`document.documentElement.lang`), 'en');

        // 5. Responsividade em 1440px, 768px, 390px e 375px + Menu Mobile
        const viewports = [
            { w: 1440, h: 900, mobile: false },
            { w: 768, h: 1024, mobile: true },
            { w: 390, h: 844, mobile: true },
            { w: 375, h: 812, mobile: true },
        ];
        const viewportResults = {};
        for (const vp of viewports) {
            await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.mobile ? 2 : 1, mobile: vp.mobile });
            await wait(120);
            const overflow = await cdp.eval(`document.documentElement.scrollWidth > window.innerWidth`);
            viewportResults[`${vp.w}x${vp.h}`] = overflow ? 'OVERFLOW' : 'OK';
            assert.equal(overflow, false, `Sem overflow em ${vp.w}x${vp.h}`);
        }

        const mobileMenu = await cdp.eval(`(() => {
            document.getElementById('hamburguer').click();
            const opened = document.getElementById('hamburguer').getAttribute('aria-expanded');
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const closed = document.getElementById('hamburguer').getAttribute('aria-expanded');
            return { opened, closed };
        })()`);
        assert.deepEqual(mobileMenu, { opened: 'true', closed: 'false' });

        // 6. Reduced Motion
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await navigateAndWait(`${baseUrl}/`);
        const rm1 = await cdp.eval(`({
            pressed: document.getElementById('shorts-toggle-motion').getAttribute('aria-pressed'),
            tx: document.querySelector('#shorts-row-top .shorts__fita').style.transform,
        })`);
        await wait(300);
        const rm2 = await cdp.eval(`document.querySelector('#shorts-row-top .shorts__fita').style.transform`);
        assert.equal(rm1.pressed, 'true', 'Carrossel inicia pausado em prefers-reduced-motion');
        assert.equal(rm1.tx, rm2, 'Carrossel estacionário em prefers-reduced-motion');

        // 7. Rota /admin (sem barra e com barra) — verifica estado setup (Firebase não configurado) e troca de idioma
        await cdp.send('Emulation.setEmulatedMedia', { features: [] });
        await navigateAndWait(`${baseUrl}/admin`);
        const adminCheck = await cdp.eval(`(() => {
            const setupVisible = getComputedStyle(document.getElementById('view-setup')).display !== 'none';
            const loadingHidden = getComputedStyle(document.getElementById('view-loading')).display === 'none';
            const loginHidden = getComputedStyle(document.getElementById('view-login')).display === 'none';
            const unauthHidden = getComputedStyle(document.getElementById('view-unauthorized')).display === 'none';
            const dashHidden = getComputedStyle(document.getElementById('view-dashboard')).display === 'none';
            const logoutHidden = getComputedStyle(document.getElementById('admin-logout-btn')).display === 'none';
            const missingCount = document.querySelectorAll('#setup-missing-list li').length;
            const robots = document.querySelector('meta[name="robots"]')?.content || '';
            document.getElementById('admin-lang-btn').click();
            const ptTitle = document.querySelector('#view-setup h1')?.textContent;
            document.getElementById('admin-lang-btn').click();
            return { setupVisible, loadingHidden, loginHidden, unauthHidden, dashHidden, logoutHidden, missingCount, robots, ptTitle };
        })()`);
        assert.equal(adminCheck.setupVisible, true, '/admin exibe estado setup quando Firebase não configurado');
        assert.equal(adminCheck.loadingHidden, true, '#view-loading oculto (display: none)');
        assert.equal(adminCheck.loginHidden, true, '#view-login oculto (display: none)');
        assert.equal(adminCheck.unauthHidden, true, '#view-unauthorized oculto (display: none)');
        assert.equal(adminCheck.dashHidden, true, '#view-dashboard oculto (display: none)');
        assert.equal(adminCheck.logoutHidden, true, '#admin-logout-btn oculto (display: none)');
        assert.equal(adminCheck.missingCount, 3, 'Lista 3 campos obrigatórios ausentes');
        assert.equal(adminCheck.robots, 'noindex, nofollow');
        assert.equal(adminCheck.ptTitle, 'Firebase ainda não configurado');

        await navigateAndWait(`${baseUrl}/admin/`);
        assert.equal(await cdp.eval(`!document.getElementById('view-setup').hidden`), true, '/admin/ com barra também funciona');

        assert.equal(failedLocal.length, 0, `404s locais encontrados: ${failedLocal.join(', ')}`);
        assert.equal(consoleErrors.length, 0, `Erros de console encontrados: ${consoleErrors.join('; ')}`);

        cdp.close();
        return { perfMetrics, ytPlayerReqsInitial: ytPlayerReqsInitial.length, viewportResults, adminCheck, failedLocal, consoleErrors };
    } finally {
        chrome.kill();
        setTimeout(() => { try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {} }, 500);
    }
}

// Entry point
const server = await startStaticServer(SERVER_PORT);
const baseUrl = `http://127.0.0.1:${SERVER_PORT}`;

if (SERVE_ONLY) {
    console.log(`Malaman Portfolio V2 server running at:`);
    console.log(`  Public: ${baseUrl}/`);
    console.log(`  Admin:  ${baseUrl}/admin`);
    console.log(`Press Ctrl+C to stop.`);
} else {
    try {
        const unit = await runUnitChecks();
        const browser = await runBrowserSuite(baseUrl);
        console.log(JSON.stringify({ status: 'ALL_V2_SMOKE_TESTS_PASSED', unit, browser }, null, 2));
    } finally {
        server.close();
    }
}
