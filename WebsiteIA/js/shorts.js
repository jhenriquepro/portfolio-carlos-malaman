/* =========================================
   SHORTS.JS — Carrossel infinito sob demanda (thumbnails + modal)
========================================= */

import { CAROUSEL_CONFIG } from './config.js';
import { t } from './i18n.js';
import { openVideoModal } from './player.js';
import { FALLBACK_THUMBNAIL_DATA_URI, getPublishedVideosByType } from './video-utils.js';

const DRAG_THRESHOLD_PX = 6;

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
        // Preserva a sequência original da faixa superior (4 únicos + 1 repetição visual)
        const extra = items[2] || items[0];
        return [
            ...items.map((video) => ({ video, isAccessible: true })),
            { video: extra, isAccessible: false },
        ];
    }

    // Preserva a sequência deslocada da faixa inferior (visual complementar; sem duplicar tab stops)
    const rotated = items.length > 1
        ? [items[items.length - 1], ...items.slice(0, items.length - 1)]
        : [...items];
    const extra = rotated[1] || rotated[0];
    return [
        ...rotated.map((video) => ({ video, isAccessible: false })),
        { video: extra, isAccessible: false },
    ];
}

function createShortCard(video, { isAccessible, primaryTriggers }) {
    const card = document.createElement('article');
    card.className = 'short__card';
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
        // Para clones/repetições visuais, devolve o foco ao gatilho acessível correspondente
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

export function initShortsCarousel(videoRecords) {
    const rows = document.querySelectorAll('.shorts__carrossel');
    if (!rows.length) return;

    const shortItems = getPublishedVideosByType(videoRecords, 'short');
    const primaryTriggers = new Map();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let globallyPaused = motionQuery.matches;
    let modalPaused = false;

    const pauseBtn = document.getElementById('shorts-toggle-motion');
    const syncPauseButton = () => {
        if (!pauseBtn) return;
        pauseBtn.setAttribute('aria-pressed', String(globallyPaused));
        const labelEl = pauseBtn.querySelector('[data-shorts-pause-label]');
        if (labelEl) {
            labelEl.textContent = t(globallyPaused ? 'shorts.resume' : 'shorts.pause');
        }
    };

    const syncAccessibleLabels = () => {
        primaryTriggers.forEach((btn) => {
            btn.setAttribute('aria-label', buildShortAriaLabel(btn.dataset.videoTitle));
        });
    };

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

    if (!shortItems.length) return;

    rows.forEach((row, rowIndex) => {
        const fita = row.querySelector('.shorts__fita');
        if (!fita) return;

        fita.replaceChildren();

        const sequence = buildRowSequence(shortItems, rowIndex);
        const origCards = sequence.map(({ video, isAccessible }) =>
            createShortCard(video, { isAccessible, primaryTriggers })
        );

        // Adiciona os cards originais da faixa
        origCards.forEach((card) => fita.appendChild(card));

        // Adiciona clones para loop contínuo (invisíveis à árvore de acessibilidade e fora da ordem de Tab)
        sequence.forEach(({ video }) => {
            const cloneCard = createShortCard(video, { isAccessible: false, primaryTriggers });
            fita.appendChild(cloneCard);
        });

        // direction: 'left' => desloca conteúdo para esquerda (offset cresce)
        //            'right' => desloca conteúdo para direita (offset decresce)
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

        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(measureSetWidth);
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

        const loop = (ts) => {
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

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);

        // Impede que arrastar o carrossel dispare clique acidental no card
        row.addEventListener(
            'click',
            (e) => {
                if (suppressNextClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    suppressNextClick = false;
                }
            },
            true
        );

        // Hover pause/resume
        row.addEventListener('mouseenter', () => {
            hoverPaused = true;
        });
        row.addEventListener('mouseleave', () => {
            if (!pointerDown) hoverPaused = false;
        });

        // Mouse drag
        row.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            pointerDown = true;
            isDragging = false;
            suppressNextClick = false;
            dragStartX = e.clientX;
            dragStartOffset = offset;
        });

        window.addEventListener('mousemove', (e) => {
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
        });

        window.addEventListener('mouseup', () => {
            if (!pointerDown) return;
            pointerDown = false;
            if (isDragging) {
                isDragging = false;
                suppressNextClick = true;
                row.classList.remove('dragging');
                setTimeout(() => {
                    suppressNextClick = false;
                }, 0);
            }
            hoverPaused = false;
            lastTime = null;
        });

        // Touch drag
        row.addEventListener(
            'touchstart',
            (e) => {
                pointerDown = true;
                isDragging = false;
                suppressNextClick = false;
                hoverPaused = true;
                dragStartX = e.touches[0].clientX;
                dragStartOffset = offset;
            },
            { passive: true }
        );

        row.addEventListener(
            'touchmove',
            (e) => {
                if (!pointerDown) return;
                const dx = dragStartX - e.touches[0].clientX;
                if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
                    isDragging = true;
                }
                if (isDragging) {
                    offset = dragStartOffset + dx;
                }
            },
            { passive: true }
        );

        row.addEventListener('touchend', () => {
            if (!pointerDown) return;
            pointerDown = false;
            if (isDragging) {
                isDragging = false;
                suppressNextClick = true;
                setTimeout(() => {
                    suppressNextClick = false;
                }, 50);
            }
            hoverPaused = false;
            lastTime = null;
        });
    });
}
