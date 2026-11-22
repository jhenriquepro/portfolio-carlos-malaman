/* =========================================
   SHORTS.JS — Carrossel infinito com pausa, drag e reduced-motion
========================================= */

import { CAROUSEL_CONFIG } from './config.js';
import { t } from './i18n.js';

export function initShortsCarousel() {
    const rows = document.querySelectorAll('.shorts__carrossel');
    if (!rows.length) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let globallyPaused = motionQuery.matches;

    const pauseBtn = document.getElementById('shorts-toggle-motion');
    const syncPauseButton = () => {
        if (!pauseBtn) return;
        pauseBtn.setAttribute('aria-pressed', String(globallyPaused));
        const labelEl = pauseBtn.querySelector('[data-shorts-pause-label]');
        if (labelEl) {
            labelEl.textContent = t(globallyPaused ? 'shorts.resume' : 'shorts.pause');
        }
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

    window.addEventListener('portfolio:languagechange', syncPauseButton);
    syncPauseButton();

    rows.forEach((row) => {
        const fita = row.querySelector('.shorts__fita');
        if (!fita) return;

        // direction: 'left' => desloca conteúdo para esquerda (offset cresce)
        //            'right' => desloca conteúdo para direita (offset decresce)
        const direction = row.dataset.direction === 'right' ? -1 : 1;

        const origCards = Array.from(fita.children);
        if (!origCards.length) return;

        origCards.forEach((card) => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            clone.querySelectorAll('iframe, a, button').forEach((focusable) => {
                focusable.setAttribute('tabindex', '-1');
            });
            clone.querySelectorAll('iframe').forEach((frame) => {
                frame.setAttribute('loading', 'lazy');
            });
            fita.appendChild(clone);
        });

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
        let isDragging = false;
        let dragStartX = 0;
        let dragStartOffset = 0;

        const loop = (ts) => {
            if (lastTime === null) lastTime = ts;
            const dt = Math.min((ts - lastTime) / 1000, CAROUSEL_CONFIG.maxDeltaSec);
            lastTime = ts;

            if (!globallyPaused && !hoverPaused && !isDragging && cachedSetW > 0) {
                offset += direction * CAROUSEL_CONFIG.speedPxPerSec * dt;
            }

            if (cachedSetW > 0) {
                offset = ((offset % cachedSetW) + cachedSetW) % cachedSetW;
                fita.style.transform = `translate3d(${-offset}px, 0, 0)`;
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);

        // Hover pause/resume
        row.addEventListener('mouseenter', () => {
            hoverPaused = true;
        });
        row.addEventListener('mouseleave', () => {
            if (!isDragging) hoverPaused = false;
        });

        // Mouse drag
        row.addEventListener('mousedown', (e) => {
            isDragging = true;
            hoverPaused = true;
            dragStartX = e.clientX;
            dragStartOffset = offset;
            row.classList.add('dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            offset = dragStartOffset + (dragStartX - e.clientX);
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            row.classList.remove('dragging');
            hoverPaused = false;
            lastTime = null;
        });

        // Touch drag
        row.addEventListener(
            'touchstart',
            (e) => {
                isDragging = true;
                hoverPaused = true;
                dragStartX = e.touches[0].clientX;
                dragStartOffset = offset;
            },
            { passive: true }
        );

        row.addEventListener(
            'touchmove',
            (e) => {
                if (!isDragging) return;
                offset = dragStartOffset + (dragStartX - e.touches[0].clientX);
            },
            { passive: true }
        );

        row.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            hoverPaused = false;
            lastTime = null;
        });
    });
}
