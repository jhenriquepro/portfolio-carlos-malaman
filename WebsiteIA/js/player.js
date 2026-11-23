/* =========================================
   PLAYER.JS — Modal acessível com player sob demanda
========================================= */

import { t } from './i18n.js';
import { buildYouTubeEmbedUrl } from './video-utils.js';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'iframe',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

const BACKGROUND_REGIONS_SELECTOR = 'header, main, footer';

let modalRoot = null;
let dialogEl = null;
let titleEl = null;
let stageEl = null;
let closeBtn = null;
let externalLinkEl = null;
let externalLabelEl = null;

let isOpen = false;
let activeVideo = null;
let lastTriggerEl = null;
let previousOverflow = '';

function getFocusableInModal() {
    if (!dialogEl) return [];
    return Array.from(dialogEl.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
    );
}

function setBackgroundInert(inertState) {
    document.querySelectorAll(BACKGROUND_REGIONS_SELECTOR).forEach((region) => {
        if (inertState) {
            region.setAttribute('aria-hidden', 'true');
            region.inert = true;
        } else {
            region.removeAttribute('aria-hidden');
            region.inert = false;
        }
    });
}

function syncModalTranslations() {
    if (!modalRoot) return;
    const closeLabel = t('player.close');
    if (closeBtn) {
        closeBtn.setAttribute('aria-label', closeLabel);
        closeBtn.title = closeLabel;
    }
    if (externalLabelEl) {
        externalLabelEl.textContent = t('player.watchExternal');
    }
}

function createIframeElement(video) {
    const embedUrl = buildYouTubeEmbedUrl(video.externalId, {
        startSeconds: video.startSeconds,
        autoplay: true,
    });

    if (!embedUrl) return null;

    const iframe = document.createElement('iframe');
    iframe.className = 'video-modal__iframe';
    iframe.src = embedUrl;
    iframe.title = video.fullTitle || video.title;
    iframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    );
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.allowFullscreen = true;
    return iframe;
}

function handleKeyDown(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
        e.preventDefault();
        closeVideoModal();
        return;
    }

    if (e.key === 'Tab') {
        const focusables = getFocusableInModal();
        if (!focusables.length) {
            e.preventDefault();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

function ensureModalDom() {
    if (modalRoot) return modalRoot;

    const root = document.createElement('div');
    root.className = 'video-modal';
    root.id = 'video-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'video-modal-title');
    root.hidden = true;

    const backdrop = document.createElement('div');
    backdrop.className = 'video-modal__backdrop';
    backdrop.addEventListener('click', () => closeVideoModal());

    const dialog = document.createElement('div');
    dialog.className = 'video-modal__dialog';

    const header = document.createElement('div');
    header.className = 'video-modal__header';

    const title = document.createElement('h3');
    title.className = 'video-modal__title';
    title.id = 'video-modal-title';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'video-modal__close';
    close.setAttribute('aria-label', t('player.close'));
    close.title = t('player.close');

    const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'none');
    closeSvg.setAttribute('stroke', 'currentColor');
    closeSvg.setAttribute('stroke-width', '2.5');
    closeSvg.setAttribute('stroke-linecap', 'round');
    closeSvg.setAttribute('stroke-linejoin', 'round');
    closeSvg.setAttribute('aria-hidden', 'true');
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '18');
    line1.setAttribute('y1', '6');
    line1.setAttribute('x2', '6');
    line1.setAttribute('y2', '18');
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '6');
    line2.setAttribute('y1', '6');
    line2.setAttribute('x2', '18');
    line2.setAttribute('y2', '18');
    closeSvg.append(line1, line2);
    close.appendChild(closeSvg);
    close.addEventListener('click', () => closeVideoModal());

    header.append(title, close);

    const stage = document.createElement('div');
    stage.className = 'video-modal__stage';

    const footer = document.createElement('div');
    footer.className = 'video-modal__footer';

    const externalLink = document.createElement('a');
    externalLink.className = 'video-modal__external';
    externalLink.target = '_blank';
    externalLink.rel = 'noopener noreferrer';

    const externalLabel = document.createElement('span');
    externalLabel.textContent = t('player.watchExternal');

    const extIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    extIcon.setAttribute('viewBox', '0 0 24 24');
    extIcon.setAttribute('fill', 'none');
    extIcon.setAttribute('stroke', 'currentColor');
    extIcon.setAttribute('stroke-width', '2');
    extIcon.setAttribute('stroke-linecap', 'round');
    extIcon.setAttribute('stroke-linejoin', 'round');
    extIcon.setAttribute('aria-hidden', 'true');
    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '15 3 21 3 21 9');
    const l3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l3.setAttribute('x1', '10');
    l3.setAttribute('y1', '14');
    l3.setAttribute('x2', '21');
    l3.setAttribute('y2', '3');
    extIcon.append(p1, poly, l3);

    externalLink.append(externalLabel, extIcon);
    footer.appendChild(externalLink);

    dialog.append(header, stage, footer);
    root.append(backdrop, dialog);
    document.body.appendChild(root);

    modalRoot = root;
    dialogEl = dialog;
    titleEl = title;
    stageEl = stage;
    closeBtn = close;
    externalLinkEl = externalLink;
    externalLabelEl = externalLabel;

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('portfolio:languagechange', syncModalTranslations);

    return root;
}

export function initPlayerModal() {
    ensureModalDom();
}

export function openVideoModal(video, triggerElement = null) {
    if (!video || !video.externalId) return;

    ensureModalDom();

    lastTriggerEl = triggerElement instanceof HTMLElement ? triggerElement : document.activeElement;
    activeVideo = video;

    const isVertical = video.type === 'short';
    dialogEl.classList.toggle('video-modal__dialog--vertical', isVertical);
    dialogEl.classList.toggle('video-modal__dialog--horizontal', !isVertical);

    titleEl.textContent = video.fullTitle || video.title;

    if (video.watchUrl) {
        externalLinkEl.href = video.watchUrl;
        externalLinkEl.hidden = false;
    } else {
        externalLinkEl.removeAttribute('href');
        externalLinkEl.hidden = true;
    }

    stageEl.replaceChildren();
    const iframe = createIframeElement(video);
    if (iframe) {
        stageEl.appendChild(iframe);
    }

    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);

    modalRoot.hidden = false;
    // Garante transição suave após remover hidden
    requestAnimationFrame(() => {
        if (modalRoot) modalRoot.classList.add('video-modal--aberto');
    });

    isOpen = true;
    window.dispatchEvent(new CustomEvent('portfolio:modalchange', { detail: { open: true, video } }));

    closeBtn.focus();
}

export function closeVideoModal() {
    if (!isOpen || !modalRoot) return;

    // Remove o iframe imediatamente para interromper qualquer reprodução
    if (stageEl) {
        stageEl.replaceChildren();
    }

    modalRoot.classList.remove('video-modal--aberto');
    modalRoot.hidden = true;

    setBackgroundInert(false);
    document.body.style.overflow = previousOverflow;

    isOpen = false;
    const closedVideo = activeVideo;
    activeVideo = null;

    window.dispatchEvent(new CustomEvent('portfolio:modalchange', { detail: { open: false, video: closedVideo } }));

    if (lastTriggerEl && document.contains(lastTriggerEl)) {
        lastTriggerEl.focus();
    }
    lastTriggerEl = null;
}

export function isVideoModalOpen() {
    return isOpen;
}
