/* =========================================
   SHORTS.JS — Carrossel infinito sob demanda (thumbnails + modal)
   Suporta re-renderização limpa (tempo real Firestore) sem vazamento de listeners
========================================= */

import { CAROUSEL_CONFIG } from './config.js';
import { t } from './i18n.js';
import { openVideoModal } from './player.js';
import { FALLBACK_THUMBNAIL_DATA_URI, getPublishedVideosByType } from './video-utils.js';

const DRAG_THRESHOLD_PX = 6;

let activeCleanups = [];
let primaryTriggers = new Map();
let controlsInitialized = false;
let globallyPaused = false;
let modalPaused = false;

function cleanupPreviousTracks() {
    activeCleanups.forEach((fn) => {
        try { fn(); } catch {}
    });
    activeCleanups = [];
    primaryTriggers = new Map();
}

function createPlayIconSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '6,4 20,12 6,20');
    svg.appendChild(polygon);
    return svg;
}

function buildShortAriaLabel(title) {
    return `${t('player.playShort')}: ${title}`;
}

function buildRowSequence(items, rowIndex) {
    if (!items.length) return [];
    if (rowIndex === 0) {
        const list = items.map((video) => ({ video, isAccessible: true }));
        // Completa para pelo menos 5 cards visuais na faixa, marcando preenchimento como decorativo
        if (list.length < 5) {
            const extra = items[2] || items[0];
            list.push({ video: extra, isAccessible: false });
        }
        return list;
    }

    const rotated = items.length > 1
        ? [items[items.length - 1], ...items.slice(0, items.length - 1)]
        : [...items];
    const list = rotated.map((video) => ({ video, isAccessible: false }));
    if (list.length < 5) {
        const extra = rotated[1] || rotated[0];
        list.push({ video: extra, isAccessible: false });
    }
    return list;
}

function createShortCard(video, { isAccessible }) {
    const card = document.createElement('article');
    card.className = 'short__card';
    if (video.featured) {
        card.classList.add('short__card--featured');
    }
    if (!isAccessible) {
        card.setAttribute('aria-hidden', 'true');
        card.dataset.carouselClone = 'true';
    }

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'short__trigger';
    trigger.dataset.videoId = video.id;
    trigger.dataset.videoTitle = video.title;

    if (isAccessible) {
        trigger.setAttribute('aria-label', buildShortAriaLabel(video.title));
        primaryTriggers.set(video.id, trigger);
    } else {
        trigger.tabIndex = -1;
        trigger.setAttribute('aria-hidden', 'true');
    }

    trigger.addEventListener('click', () => {
        const returnFocusTarget = isAccessible
            ? trigger
            : (primaryTriggers.get(video.id) || null);
        if (!isAccessible) {
            trigger.blur();
        }
        openVideoModal(video, returnFocusTarget);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'short__wrapper';

    const img = document.createElement('img');
    img.className = 'short__thumb';
    img.src = video.thumbnailUrl;
    img.alt = isAccessible ? (video.fullTitle || video.title) : '';
    img.width = 240;
    img.height = 427;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('error', () => {
        if (img.src !== FALLBACK_THUMBNAIL_DATA_URI) {
            img.src = FALLBACK_THUMBNAIL_DATA_URI;
        }
    });

    const overlay = document.createElement('span');
    overlay.className = 'short__thumb__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const playBadge = document.createElement('span');
    playBadge.className = 'short__play__badge';
    playBadge.appendChild(createPlayIconSvg());
    overlay.appendChild(playBadge);

    wrapper.append(img, overlay);

    const info = document.createElement('div');
    info.className = 'short__info';

    const tag = document.createElement('span');
    tag.className = 'short__tag';
    tag.textContent = video.badge;

    const heading = document.createElement('h3');
    heading.className = 'short__titulo';
    heading.textContent = video.title;

    info.append(tag, heading);
    trigger.append(wrapper, info);
    card.appendChild(trigger);

    return card;
}

function syncPauseButton() {
    const pauseBtn = document.getElementById('shorts-toggle-motion');
    if (!pauseBtn) return;
    pauseBtn.setAttribute('aria-pressed', String(globallyPaused));
    const labelEl = pauseBtn.querySelector('[data-shorts-pause-label]');
    if (labelEl) {
        labelEl.textContent = t(globallyPaused ? 'shorts.resume' : 'shorts.pause');
    }
}

function syncAccessibleLabels() {
    primaryTriggers.forEach((btn) => {
        btn.setAttribute('aria-label', buildShortAriaLabel(btn.dataset.videoTitle));
    });
}

function ensureGlobalControls() {
    if (controlsInitialized) return;
    controlsInitialized = true;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    globallyPaused = motionQuery.matches;

    const pauseBtn = document.getElementById('shorts-toggle-motion');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            globallyPaused = !globallyPaused;
            syncPauseButton();
        });
    }

    motionQuery.addEventListener('change', (e) => {
        globallyPaused = e.matches;
        syncPauseButton();
    });

    window.addEventListener('portfolio:modalchange', (e) => {
        modalPaused = Boolean(e.detail?.open);
    });

    window.addEventListener('portfolio:languagechange', () => {
        syncPauseButton();
        syncAccessibleLabels();
    });

    syncPauseButton();
}

function setShortsStateMessage(key, { isError = false, onRetry = null } = {}) {
    const stateHost = document.getElementById('shorts-state');
    const viewport = document.querySelector('.shorts__carrossel__viewport');
    const controls = document.querySelector('.shorts__controles');

    if (!stateHost) return;
    stateHost.replaceChildren();

    if (!key) {
        stateHost.hidden = true;
        if (viewport) viewport.hidden = false;
        if (controls) controls.hidden = false;
        return;
    }

    stateHost.hidden = false;
    if (viewport) viewport.hidden = true;
    if (controls) controls.hidden = true;

    const box = document.createElement('div');
    box.className = isError ? 'section__state section__state--error' : 'section__state';
    box.setAttribute('role', 'status');

    const msg = document.createElement('p');
    msg.setAttribute('data-i18n', key);
    msg.textContent = t(key);
    box.appendChild(msg);

    if (typeof onRetry === 'function') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn--secundario';
        btn.setAttribute('data-i18n', 'portfolio.retry');
        btn.textContent = t('portfolio.retry');
        btn.addEventListener('click', onRetry);
        box.appendChild(btn);
    }

    stateHost.appendChild(box);
}

export function renderShortsLoading() {
    cleanupPreviousTracks();
    setShortsStateMessage('shorts.loading');
}

export function renderShortsError(onRetry) {
    cleanupPreviousTracks();
    setShortsStateMessage('shorts.error', { isError: true, onRetry });
}

export function initShortsCarousel(videoRecords) {
    ensureGlobalControls();
    cleanupPreviousTracks();

    const rows = document.querySelectorAll('.shorts__carrossel');
    if (!rows.length) return;

    const shortItems = getPublishedVideosByType(videoRecords, 'short');
    if (!shortItems.length) {
        setShortsStateMessage('shorts.empty');
        return;
    }

    setShortsStateMessage(null);

    rows.forEach((row, rowIndex) => {
        const fita = row.querySelector('.shorts__fita');
        if (!fita) return;

        fita.replaceChildren();

        const sequence = buildRowSequence(shortItems, rowIndex);
        const origCards = sequence.map(({ video, isAccessible }) =>
            createShortCard(video, { isAccessible })
        );

        origCards.forEach((card) => fita.appendChild(card));

        // Clones para loop contínuo (ocultos para leitores de tela e fora do foco por teclado)
        sequence.forEach(({ video }) => {
            const cloneCard = createShortCard(video, { isAccessible: false });
            fita.appendChild(cloneCard);
        });

        const direction = row.dataset.direction === 'right' ? -1 : 1;

        let cachedSetW = 0;
        const measureSetWidth = () => {
            const gap = parseFloat(getComputedStyle(fita).gap) || 16;
            let total = 0;
            origCards.forEach((card) => {
                total += card.offsetWidth;
            });
            total += gap * origCards.length;
            cachedSetW = total;
        };

        measureSetWidth();

        let ro = null;
        if ('ResizeObserver' in window) {
            ro = new ResizeObserver(measureSetWidth);
            ro.observe(fita);
        } else {
            window.addEventListener('resize', measureSetWidth);
        }

        let offset = 0;
        let lastTime = null;
        let hoverPaused = false;
        let pointerDown = false;
        let isDragging = false;
        let suppressNextClick = false;
        let dragStartX = 0;
        let dragStartOffset = 0;
        let rafId = 0;
        let disposed = false;

        const loop = (ts) => {
            if (disposed) return;
            if (lastTime === null) lastTime = ts;
            const dt = Math.min((ts - lastTime) / 1000, CAROUSEL_CONFIG.maxDeltaSec);
            lastTime = ts;

            if (!globallyPaused && !modalPaused && !hoverPaused && !isDragging && cachedSetW > 0) {
                offset += direction * CAROUSEL_CONFIG.speedPxPerSec * dt;
            }

            if (cachedSetW > 0) {
                offset = ((offset % cachedSetW) + cachedSetW) % cachedSetW;
                fita.style.transform = `translate3d(${-offset}px, 0, 0)`;
            }

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);

        const onClickCapture = (e) => {
            if (suppressNextClick) {
                e.preventDefault();
                e.stopPropagation();
                suppressNextClick = false;
            }
        };
        const onMouseEnter = () => { hoverPaused = true; };
        const onMouseLeave = () => { if (!pointerDown) hoverPaused = false; };
        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            pointerDown = true;
            isDragging = false;
            suppressNextClick = false;
            dragStartX = e.clientX;
            dragStartOffset = offset;
        };
        const onMouseMove = (e) => {
            if (!pointerDown) return;
            const dx = dragStartX - e.clientX;
            if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
                isDragging = true;
                hoverPaused = true;
                row.classList.add('dragging');
            }
            if (isDragging) {
                offset = dragStartOffset + dx;
            }
        };
        const onMouseUp = () => {
            if (!pointerDown) return;
            pointerDown = false;
            if (isDragging) {
                isDragging = false;
                suppressNextClick = true;
                row.classList.remove('dragging');
                setTimeout(() => { suppressNextClick = false; }, 0);
            }
            hoverPaused = false;
            lastTime = null;
        };
        const onTouchStart = (e) => {
            pointerDown = true;
            isDragging = false;
            suppressNextClick = false;
            hoverPaused = true;
            dragStartX = e.touches[0].clientX;
            dragStartOffset = offset;
        };
        const onTouchMove = (e) => {
            if (!pointerDown) return;
            const dx = dragStartX - e.touches[0].clientX;
            if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
                isDragging = true;
            }
            if (isDragging) {
                offset = dragStartOffset + dx;
            }
        };
        const onTouchEnd = () => {
            if (!pointerDown) return;
            pointerDown = false;
            if (isDragging) {
                isDragging = false;
                suppressNextClick = true;
                setTimeout(() => { suppressNextClick = false; }, 50);
            }
            hoverPaused = false;
            lastTime = null;
        };

        row.addEventListener('click', onClickCapture, true);
        row.addEventListener('mouseenter', onMouseEnter);
        row.addEventListener('mouseleave', onMouseLeave);
        row.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        row.addEventListener('touchstart', onTouchStart, { passive: true });
        row.addEventListener('touchmove', onTouchMove, { passive: true });
        row.addEventListener('touchend', onTouchEnd);

        activeCleanups.push(() => {
            disposed = true;
            cancelAnimationFrame(rafId);
            if (ro) ro.disconnect();
            else window.removeEventListener('resize', measureSetWidth);
            row.removeEventListener('click', onClickCapture, true);
            row.removeEventListener('mouseenter', onMouseEnter);
            row.removeEventListener('mouseleave', onMouseLeave);
            row.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            row.removeEventListener('touchstart', onTouchStart);
            row.removeEventListener('touchmove', onTouchMove);
            row.removeEventListener('touchend', onTouchEnd);
        });
    });
}
