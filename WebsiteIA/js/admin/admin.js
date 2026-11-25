/* =========================================
   ADMIN/ADMIN.JS — Orquestração do Painel Administrativo (/admin)
========================================= */

import { DEFAULT_LANG, STORAGE_KEYS, SUPPORTED_LANGS } from '../config.js';
import { getMissingFirebaseFields, isFirebaseConfigured } from '../firebase.config.js';
import { FALLBACK_THUMBNAIL_DATA_URI, formatDuration } from '../video-utils.js';
import {
    createVideoAdmin,
    deleteVideoAdmin,
    importInitialVideosIdempotent,
    patchVideoFlagsAdmin,
    subscribeAllVideosAdmin,
    swapVideosOrderAdmin,
    updateVideoAdmin,
} from '../videos.repository.js';
import { mapAuthErrorCode, observeAdminAuth, signInAdmin, signOutAdmin } from './auth.js';
import { initVideoForm } from './video-form.js';

const ADMIN_COPY = {
    en: {
        'header.subtitle': 'Video Management',
        'header.viewSite': 'View Public Site',
        'header.signOut': 'Sign Out',
        'state.checkingSession': 'Checking session...',
        'setup.badge': 'Setup Required',
        'setup.title': 'Firebase not configured yet',
        'setup.description': 'Authentication and real-time video publishing require a Firebase project (Authentication Email/Password + Cloud Firestore). No mock login or hardcoded password is enabled for security.',
        'setup.missingLabel': 'Missing public fields in WebsiteIA/js/firebase.config.js:',
        'setup.step1': 'Create a Firebase project and register a Web App to get the public config.',
        'setup.step2': 'Enable Email/Password sign-in and create the single editor account manually.',
        'setup.step3': 'Create the Cloud Firestore database and publish firestore.rules + firestore.indexes.json.',
        'setup.step4': 'Create document admins/{EDITOR_UID} manually in Firestore Console.',
        'setup.step5': 'Fill WebsiteIA/js/firebase.config.js, reload /admin, sign in, and click "Import Initial Videos".',
        'setup.backHome': 'Back to Public Portfolio',
        'login.badge': 'Restricted Access',
        'login.title': 'Editor Sign In',
        'login.subtitle': 'Sign in with your authorized Firebase account to manage portfolio videos and Shorts.',
        'login.emailLabel': 'Email',
        'login.passwordLabel': 'Password',
        'login.submit': 'Sign In',
        'unauth.badge': 'Access Denied',
        'unauth.title': 'Account not authorized',
        'unauth.description': 'Your Firebase session is valid, but this UID is not listed in the Firestore admins collection. Drafts and write operations remain blocked by server rules.',
        'dash.title': 'Videos Manager',
        'dash.signedAs': 'Signed in as',
        'dash.importInitial': 'Import Initial Videos (6 + 4)',
        'dash.newVideo': '+ Add Video',
        'dash.orderHint': 'Order is saved independently per type.',
        'stats.total': 'Total',
        'stats.published': 'Published',
        'stats.drafts': 'Drafts',
        'stats.portfolio': 'Portfolio',
        'stats.shorts': 'Shorts',
        'filter.all': 'All',
        'filter.portfolio': 'Portfolio',
        'filter.shorts': 'Shorts',
        'form.newTitle': 'Add Video',
        'form.cancel': 'Cancel',
        'form.urlLabel': 'Video URL (YouTube, Instagram or TikTok)',
        'form.urlHelp': 'Only validated HTTPS links. Arbitrary HTML/embed tags are blocked.',
        'form.typeLabel': 'Section',
        'form.orderLabel': 'Order',
        'form.titleLabel': 'Project Title',
        'form.durationLabel': 'Duration (mm:ss or sec)',
        'form.startLabel': 'Start Time (sec)',
        'form.toolsLabel': 'Tools Used',
        'form.publishedLabel': 'Published on public site',
        'form.featuredLabel': 'Highlight as Featured',
        'form.previewLabel': 'Live Card Preview',
        'form.save': 'Save Video',
        'confirm.deleteTitle': 'Delete video?',
        'confirm.unpublishTip': 'Tip: you can unpublish instead to hide it safely without losing metadata.',
        'confirm.unpublishInstead': 'Unpublish instead',
        'confirm.confirmDelete': 'Delete permanently',
    },
    pt: {
        'header.subtitle': 'Gestão de Vídeos',
        'header.viewSite': 'Ver Site Público',
        'header.signOut': 'Sair',
        'state.checkingSession': 'Verificando sessão...',
        'setup.badge': 'Configuração Pendente',
        'setup.title': 'Firebase ainda não configurado',
        'setup.description': 'A autenticação e a publicação em tempo real exigem um projeto Firebase (Authentication E-mail/Senha + Cloud Firestore). Nenhum login simulado com senha fixa foi habilitado por segurança.',
        'setup.missingLabel': 'Campos públicos ausentes em WebsiteIA/js/firebase.config.js:',
        'setup.step1': 'Crie um projeto Firebase e registre um Web App para obter a configuração pública.',
        'setup.step2': 'Habilite login por E-mail/Senha e crie manualmente a conta única do editor.',
        'setup.step3': 'Crie o banco Cloud Firestore e publique firestore.rules + firestore.indexes.json.',
        'setup.step4': 'Crie manualmente o documento admins/{UID_DO_EDITOR} no Console do Firestore.',
        'setup.step5': 'Preencha WebsiteIA/js/firebase.config.js, recarregue /admin, faça login e clique em "Importar Vídeos Iniciais".',
        'setup.backHome': 'Voltar ao Portfólio Público',
        'login.badge': 'Acesso Restrito',
        'login.title': 'Entrar no Painel',
        'login.subtitle': 'Entre com sua conta Firebase autorizada para gerenciar os vídeos do portfólio e Shorts.',
        'login.emailLabel': 'E-mail',
        'login.passwordLabel': 'Senha',
        'login.submit': 'Entrar',
        'unauth.badge': 'Acesso Negado',
        'unauth.title': 'Conta não autorizada',
        'unauth.description': 'Sua sessão Firebase é válida, mas este UID não está cadastrado na coleção admins do Firestore. Rascunhos e escritas continuam bloqueados pelas regras do servidor.',
        'dash.title': 'Gerenciador de Vídeos',
        'dash.signedAs': 'Conectado como',
        'dash.importInitial': 'Importar Vídeos Iniciais (6 + 4)',
        'dash.newVideo': '+ Novo Vídeo',
        'dash.orderHint': 'A ordenação é salva de forma independente por seção.',
        'stats.total': 'Total',
        'stats.published': 'Publicados',
        'stats.drafts': 'Rascunhos',
        'stats.portfolio': 'Portfólio',
        'stats.shorts': 'Shorts',
        'filter.all': 'Todos',
        'filter.portfolio': 'Portfólio',
        'filter.shorts': 'Shorts',
        'form.newTitle': 'Adicionar Vídeo',
        'form.cancel': 'Cancelar',
        'form.urlLabel': 'URL do Vídeo (YouTube, Instagram ou TikTok)',
        'form.urlHelp': 'Somente links HTTPS validados. HTML/embed arbitrário é bloqueado.',
        'form.typeLabel': 'Seção',
        'form.orderLabel': 'Ordem',
        'form.titleLabel': 'Título do Projeto',
        'form.durationLabel': 'Duração (mm:ss ou seg)',
        'form.startLabel': 'Início (seg)',
        'form.toolsLabel': 'Ferramentas Utilizadas',
        'form.publishedLabel': 'Publicado no site público',
        'form.featuredLabel': 'Marcar como Destaque',
        'form.previewLabel': 'Prévia do Cartão',
        'form.save': 'Salvar Vídeo',
        'confirm.deleteTitle': 'Excluir vídeo?',
        'confirm.unpublishTip': 'Dica: você pode apenas despublicar para ocultá-lo com segurança sem perder os dados.',
        'confirm.unpublishInstead': 'Apenas despublicar',
        'confirm.confirmDelete': 'Excluir permanentemente',
    },
};

let currentLang = DEFAULT_LANG;
let allVideos = [];
let activeFilter = 'all';
let unsubscribeVideos = null;
let pendingDeleteVideo = null;
let lastFocusBeforeDialog = null;
let toastTimer = null;
let formController = null;

function loadLang() {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEYS.language);
        if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch {}
    return DEFAULT_LANG;
}

function saveLang(lang) {
    try { window.localStorage.setItem(STORAGE_KEYS.language, lang); } catch {}
}

function applyAdminLang(lang, { persist = true } = {}) {
    currentLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    if (persist) saveLang(currentLang);

    document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-admin-i18n]').forEach((el) => {
        const key = el.getAttribute('data-admin-i18n');
        const text = ADMIN_COPY[currentLang]?.[key];
        if (text) el.textContent = text;
    });

    const langBtn = document.getElementById('admin-lang-btn');
    if (langBtn) {
        langBtn.textContent = currentLang === 'pt' ? 'PT → EN' : 'EN → PT';
    }

    if (formController) formController.updatePreview();
    renderVideosList();
}

function showToast(message, variant = 'success') {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${variant}`;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.hidden = true;
    }, 4000);
}

function showView(viewId) {
    ['view-loading', 'view-setup', 'view-login', 'view-unauthorized', 'view-dashboard'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.hidden = id !== viewId;
    });

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.hidden = viewId !== 'view-dashboard' && viewId !== 'view-unauthorized';
    }
}

function computeNextOrder(type) {
    const sameType = allVideos.filter((v) => v.type === type);
    if (!sameType.length) return 1;
    return Math.max(...sameType.map((v) => v.sortOrder || 0)) + 1;
}

function updateStats() {
    const total = allVideos.length;
    const published = allVideos.filter((v) => v.published).length;
    const drafts = total - published;
    const portfolio = allVideos.filter((v) => v.type === 'portfolio').length;
    const shorts = allVideos.filter((v) => v.type === 'short').length;

    document.getElementById('stat-total').textContent = String(total);
    document.getElementById('stat-published').textContent = String(published);
    document.getElementById('stat-drafts').textContent = String(drafts);
    document.getElementById('stat-portfolio').textContent = String(portfolio);
    document.getElementById('stat-shorts').textContent = String(shorts);
}

function openConfirmDialog(video, trigger) {
    pendingDeleteVideo = video;
    lastFocusBeforeDialog = trigger;

    const dialog = document.getElementById('confirm-dialog');
    const msg = document.getElementById('confirm-message');
    const isPt = currentLang === 'pt';
    msg.textContent = isPt
        ? `Deseja remover "${video.title}" permanentemente do banco de dados?`
        : `Permanently delete "${video.title}" from the database?`;

    dialog.hidden = false;
    document.getElementById('confirm-cancel-btn').focus();
}

function closeConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    dialog.hidden = true;
    pendingDeleteVideo = null;
    if (lastFocusBeforeDialog && document.contains(lastFocusBeforeDialog)) {
        lastFocusBeforeDialog.focus();
    }
    lastFocusBeforeDialog = null;
}

function renderVideosList() {
    const listEl = document.getElementById('videos-list');
    const stateEl = document.getElementById('videos-list-state');
    if (!listEl || !stateEl) return;

    const isPt = currentLang === 'pt';
    const filtered = allVideos
        .filter((v) => activeFilter === 'all' || v.type === activeFilter)
        .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'portfolio' ? -1 : 1;
            return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
        });

    listEl.replaceChildren();

    if (!filtered.length) {
        stateEl.hidden = false;
        stateEl.textContent = isPt
            ? 'Nenhum vídeo encontrado nesta seção. Adicione um novo vídeo ou importe os vídeos iniciais.'
            : 'No videos found in this view. Add a new video or import the initial videos.';
        return;
    }

    stateEl.hidden = true;

    const groupedByType = {
        portfolio: allVideos.filter((v) => v.type === 'portfolio').sort((a, b) => a.sortOrder - b.sortOrder),
        short: allVideos.filter((v) => v.type === 'short').sort((a, b) => a.sortOrder - b.sortOrder),
    };

    const fragment = document.createDocumentFragment();

    filtered.forEach((video) => {
        const siblings = groupedByType[video.type] || [];
        const posInType = siblings.findIndex((s) => s.id === video.id);

        const row = document.createElement('article');
        row.className = 'admin-video-row';
        if (!video.published) row.classList.add('admin-video-row--draft');
        if (video.featured) row.classList.add('admin-video-row--featured');

        const thumb = document.createElement('img');
        thumb.className = video.type === 'short'
            ? 'admin-video-thumb admin-video-thumb--short'
            : 'admin-video-thumb';
        thumb.src = video.thumbnailUrl || FALLBACK_THUMBNAIL_DATA_URI;
        thumb.alt = video.title;
        thumb.loading = 'lazy';
        thumb.addEventListener('error', () => {
            if (thumb.src !== FALLBACK_THUMBNAIL_DATA_URI) thumb.src = FALLBACK_THUMBNAIL_DATA_URI;
        });

        const meta = document.createElement('div');
        meta.className = 'admin-video-meta';

        const head = document.createElement('div');
        head.className = 'admin-video-head';

        const title = document.createElement('strong');
        title.className = 'admin-video-title';
        title.textContent = video.title;

        const typeBadge = document.createElement('span');
        typeBadge.className = video.type === 'short' ? 'admin-badge admin-badge--coral' : 'admin-badge admin-badge--violet';
        typeBadge.textContent = video.type === 'short' ? 'Short' : (isPt ? 'Portfólio' : 'Portfolio');

        const statusBadge = document.createElement('span');
        statusBadge.className = video.published ? 'admin-badge admin-badge--green' : 'admin-badge admin-badge--amber';
        statusBadge.textContent = video.published
            ? (isPt ? 'Publicado' : 'Published')
            : (isPt ? 'Rascunho' : 'Draft');

        head.append(title, typeBadge, statusBadge);

        if (video.featured) {
            const featBadge = document.createElement('span');
            featBadge.className = 'admin-badge admin-badge--amber';
            featBadge.textContent = isPt ? '★ Destaque' : '★ Featured';
            head.appendChild(featBadge);
        }

        const sub = document.createElement('div');
        sub.className = 'admin-video-sub';
        const infoParts = [`#${video.sortOrder}`, video.platform.toUpperCase()];
        if (video.durationSeconds) infoParts.push(formatDuration(video.durationSeconds));
        if (video.startSeconds > 0) infoParts.push(`start=${video.startSeconds}s`);
        if (video.tools.length) infoParts.push(video.tools.join(', '));
        sub.textContent = infoParts.join(' · ');

        meta.append(head, sub);

        const actions = document.createElement('div');
        actions.className = 'admin-video-actions';

        // Reordenar subir/descer (independente por tipo)
        const btnUp = document.createElement('button');
        btnUp.type = 'button';
        btnUp.className = 'admin-btn admin-btn--ghost admin-btn--sm';
        btnUp.textContent = '↑';
        btnUp.title = isPt ? 'Mover para cima' : 'Move up';
        btnUp.setAttribute('aria-label', `${btnUp.title}: ${video.title}`);
        btnUp.disabled = posInType <= 0;
        btnUp.addEventListener('click', async () => {
            if (posInType <= 0) return;
            try {
                await swapVideosOrderAdmin(video, siblings[posInType - 1]);
                showToast(isPt ? 'Ordem atualizada.' : 'Order updated.');
            } catch {
                showToast(isPt ? 'Erro ao reordenar.' : 'Failed to reorder.', 'error');
            }
        });

        const btnDown = document.createElement('button');
        btnDown.type = 'button';
        btnDown.className = 'admin-btn admin-btn--ghost admin-btn--sm';
        btnDown.textContent = '↓';
        btnDown.title = isPt ? 'Mover para baixo' : 'Move down';
        btnDown.setAttribute('aria-label', `${btnDown.title}: ${video.title}`);
        btnDown.disabled = posInType < 0 || posInType >= siblings.length - 1;
        btnDown.addEventListener('click', async () => {
            if (posInType < 0 || posInType >= siblings.length - 1) return;
            try {
                await swapVideosOrderAdmin(video, siblings[posInType + 1]);
                showToast(isPt ? 'Ordem atualizada.' : 'Order updated.');
            } catch {
                showToast(isPt ? 'Erro ao reordenar.' : 'Failed to reorder.', 'error');
            }
        });

        const btnFeature = document.createElement('button');
        btnFeature.type = 'button';
        btnFeature.className = 'admin-btn admin-btn--ghost admin-btn--sm';
        btnFeature.textContent = video.featured ? '★' : '☆';
        btnFeature.title = isPt ? 'Alternar destaque' : 'Toggle featured';
        btnFeature.setAttribute('aria-label', `${btnFeature.title}: ${video.title}`);
        btnFeature.addEventListener('click', async () => {
            try {
                await patchVideoFlagsAdmin(video.id, { featured: !video.featured });
                showToast(isPt ? 'Destaque atualizado.' : 'Featured updated.');
            } catch {
                showToast(isPt ? 'Erro ao atualizar destaque.' : 'Failed to update featured.', 'error');
            }
        });

        const btnPublish = document.createElement('button');
        btnPublish.type = 'button';
        btnPublish.className = 'admin-btn admin-btn--ghost admin-btn--sm';
        btnPublish.textContent = video.published
            ? (isPt ? 'Ocultar' : 'Unpublish')
            : (isPt ? 'Publicar' : 'Publish');
        btnPublish.addEventListener('click', async () => {
            try {
                await patchVideoFlagsAdmin(video.id, { published: !video.published });
                showToast(
                    !video.published
                        ? (isPt ? 'Vídeo publicado no site!' : 'Video published!')
                        : (isPt ? 'Vídeo movido para rascunho.' : 'Video unpublished.')
                );
            } catch {
                showToast(isPt ? 'Erro ao alterar status.' : 'Failed to update status.', 'error');
            }
        });

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'admin-btn admin-btn--ghost admin-btn--sm';
        btnEdit.textContent = isPt ? 'Editar' : 'Edit';
        btnEdit.addEventListener('click', () => formController?.loadVideoForEdit(video));

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'admin-btn admin-btn--danger admin-btn--sm';
        btnDelete.textContent = isPt ? 'Excluir' : 'Delete';
        btnDelete.addEventListener('click', () => openConfirmDialog(video, btnDelete));

        actions.append(btnUp, btnDown, btnFeature, btnPublish, btnEdit, btnDelete);
        row.append(thumb, meta, actions);
        fragment.appendChild(row);
    });

    listEl.appendChild(fragment);
}

async function startDashboardStream() {
    if (typeof unsubscribeVideos === 'function') {
        unsubscribeVideos();
        unsubscribeVideos = null;
    }

    unsubscribeVideos = await subscribeAllVideosAdmin({
        onData: (videos) => {
            allVideos = videos;
            updateStats();
            renderVideosList();
        },
        onError: () => {
            const isPt = currentLang === 'pt';
            showToast(
                isPt ? 'Sem permissão ou erro ao ler o Firestore.' : 'Permission denied or error reading Firestore.',
                'error'
            );
        },
    });
}

function teardownDashboardStream() {
    if (typeof unsubscribeVideos === 'function') {
        unsubscribeVideos();
        unsubscribeVideos = null;
    }
    allVideos = [];
    updateStats();
    renderVideosList();
}

function renderSetupMissingFields() {
    const list = document.getElementById('setup-missing-list');
    if (!list) return;
    list.replaceChildren();
    getMissingFirebaseFields().forEach((field) => {
        const li = document.createElement('li');
        const code = document.createElement('code');
        code.textContent = field;
        li.appendChild(code);
        list.appendChild(li);
    });
}

function bindEvents() {
    document.getElementById('admin-lang-btn')?.addEventListener('click', () => {
        applyAdminLang(currentLang === 'en' ? 'pt' : 'en');
    });

    // Login form
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    const loginSubmit = document.getElementById('login-submit-btn');

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.hidden = true;
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email.trim() || !password) {
            loginError.textContent = currentLang === 'pt'
                ? 'Preencha e-mail e senha.'
                : 'Please enter both email and password.';
            loginError.hidden = false;
            return;
        }

        loginSubmit.disabled = true;
        try {
            await signInAdmin(email, password);
            loginForm.reset();
        } catch (err) {
            loginError.textContent = mapAuthErrorCode(err, currentLang);
            loginError.hidden = false;
        } finally {
            loginSubmit.disabled = false;
        }
    });

    // Logout buttons
    const handleLogout = async () => {
        teardownDashboardStream();
        try {
            await signOutAdmin();
        } catch {
            showToast(currentLang === 'pt' ? 'Erro ao encerrar sessão.' : 'Could not sign out.', 'error');
        }
    };
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('unauth-logout-btn')?.addEventListener('click', handleLogout);

    // Filter tabs
    document.querySelectorAll('.admin-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            activeFilter = tab.dataset.filter || 'all';
            document.querySelectorAll('.admin-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('is-active', active);
                t.setAttribute('aria-selected', String(active));
            });
            renderVideosList();
        });
    });

    // New video button
    document.getElementById('btn-new-video')?.addEventListener('click', () => {
        const defaultType = activeFilter === 'short' ? 'short' : 'portfolio';
        formController?.resetForm(computeNextOrder(defaultType), defaultType);
        document.getElementById('field-url')?.focus();
    });

    // Import initial videos (idempotent)
    const importBtn = document.getElementById('btn-import-initial');
    importBtn?.addEventListener('click', async () => {
        const isPt = currentLang === 'pt';
        importBtn.disabled = true;
        try {
            const { importedCount, skippedCount } = await importInitialVideosIdempotent();
            showToast(
                isPt
                    ? `Importação concluída: ${importedCount} importados, ${skippedCount} já existentes.`
                    : `Import finished: ${importedCount} imported, ${skippedCount} already present.`
            );
        } catch {
            showToast(
                isPt ? 'Erro ao importar vídeos iniciais. Verifique as regras do Firestore.' : 'Failed to import initial videos. Check Firestore rules.',
                'error'
            );
        } finally {
            importBtn.disabled = false;
        }
    });

    // Confirm delete dialog
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeConfirmDialog);
    document.getElementById('confirm-unpublish-btn')?.addEventListener('click', async () => {
        if (!pendingDeleteVideo) return;
        const target = pendingDeleteVideo;
        closeConfirmDialog();
        try {
            await patchVideoFlagsAdmin(target.id, { published: false });
            showToast(currentLang === 'pt' ? 'Vídeo ocultado com segurança.' : 'Video safely unpublished.');
        } catch {
            showToast(currentLang === 'pt' ? 'Erro ao ocultar vídeo.' : 'Failed to unpublish video.', 'error');
        }
    });
    document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
        if (!pendingDeleteVideo) return;
        const target = pendingDeleteVideo;
        closeConfirmDialog();
        try {
            await deleteVideoAdmin(target.id);
            showToast(currentLang === 'pt' ? 'Vídeo excluído.' : 'Video deleted.');
        } catch {
            showToast(currentLang === 'pt' ? 'Erro ao excluir vídeo.' : 'Failed to delete video.', 'error');
        }
    });

    document.addEventListener('keydown', (e) => {
        const dialog = document.getElementById('confirm-dialog');
        if (e.key === 'Escape' && dialog && !dialog.hidden) {
            closeConfirmDialog();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    applyAdminLang(loadLang(), { persist: false });
    bindEvents();

    formController = initVideoForm({
        getLang: () => currentLang,
        onCancel: () => formController.resetForm(computeNextOrder('portfolio'), 'portfolio'),
        onSubmit: async ({ id, payload }) => {
            const isPt = currentLang === 'pt';
            if (id) {
                await updateVideoAdmin(id, payload);
                showToast(isPt ? 'Vídeo atualizado com sucesso!' : 'Video updated!');
            } else {
                await createVideoAdmin(payload);
                showToast(isPt ? 'Vídeo criado com sucesso!' : 'Video created!');
            }
            formController.resetForm(computeNextOrder(payload.type), payload.type);
        },
    });

    if (!isFirebaseConfigured()) {
        renderSetupMissingFields();
        showView('view-setup');
        return;
    }

    showView('view-loading');
    try {
        await observeAdminAuth(({ state, user }) => {
            if (state === 'signed-out') {
                teardownDashboardStream();
                showView('view-login');
            } else if (state === 'unauthorized') {
                teardownDashboardStream();
                document.getElementById('unauth-uid').textContent = user?.uid || '—';
                showView('view-unauthorized');
            } else if (state === 'authorized') {
                document.getElementById('dash-user-email').textContent = user?.email || user?.uid || '—';
                showView('view-dashboard');
                formController.resetForm(computeNextOrder('portfolio'), 'portfolio');
                startDashboardStream();
            }
        });
    } catch {
        renderSetupMissingFields();
        showView('view-setup');
    }
});
