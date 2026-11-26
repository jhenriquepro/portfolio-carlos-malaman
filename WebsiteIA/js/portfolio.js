/* =========================================
   PORTFOLIO.JS — Renderização sob demanda dos projetos horizontais
========================================= */

import { t } from './i18n.js';
import { observeReveals } from './navigation.js';
import { openVideoModal } from './player.js';
import { FALLBACK_THUMBNAIL_DATA_URI, formatDuration, getPublishedVideosByType } from './video-utils.js';

let languageListenerBound = false;

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

function buildPlayAriaLabel(title) {
    return `${t('player.playVideo')}: ${title}`;
}

function createPortfolioCard(video, index) {
    const card = document.createElement('article');
    card.className = 'video__card reveal';
    if (video.featured) {
        card.classList.add('video__card--featured');
    }
    const delayMod = index % 3;
    if (delayMod === 1) card.classList.add('reveal--delay-1');
    if (delayMod === 2) card.classList.add('reveal--delay-2');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'video__trigger';
    trigger.dataset.videoTitle = video.title;
    trigger.setAttribute('aria-label', buildPlayAriaLabel(video.title));
    trigger.addEventListener('click', () => openVideoModal(video, trigger));

    const wrapper = document.createElement('div');
    wrapper.className = 'video__wrapper';

    const img = document.createElement('img');
    img.className = 'video__thumb';
    img.src = video.thumbnailUrl;
    img.alt = video.fullTitle || video.title;
    img.width = 480;
    img.height = 270;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => {
        if (img.src !== FALLBACK_THUMBNAIL_DATA_URI) {
            img.src = FALLBACK_THUMBNAIL_DATA_URI;
        }
    });

    const overlay = document.createElement('span');
    overlay.className = 'video__thumb__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const playBadge = document.createElement('span');
    playBadge.className = 'video__play__badge';
    playBadge.appendChild(createPlayIconSvg());
    overlay.appendChild(playBadge);

    wrapper.append(img, overlay);

    // Duração no canto inferior direito quando cadastrada
    const formattedDuration = formatDuration(video.durationSeconds);
    if (formattedDuration) {
        const durEl = document.createElement('span');
        durEl.className = 'video__duration';
        durEl.textContent = formattedDuration;
        wrapper.appendChild(durEl);
    }

    // Badge de destaque controlado quando featured === true
    if (video.featured) {
        const featEl = document.createElement('span');
        featEl.className = 'video__featured__badge';
        featEl.setAttribute('data-i18n', 'portfolio.featured');
        featEl.textContent = t('portfolio.featured');
        wrapper.appendChild(featEl);
    }

    const info = document.createElement('div');
    info.className = 'video__info';

    const rowTop = document.createElement('div');
    rowTop.className = 'video__info__top';

    const tag = document.createElement('span');
    tag.className = 'video__tag';
    tag.textContent = video.badge;

    const heading = document.createElement('h3');
    heading.className = 'video__titulo';
    heading.textContent = video.title;

    rowTop.append(tag, heading);
    info.appendChild(rowTop);

    // Ferramentas utilizadas quando cadastradas
    if (video.tools.length > 0) {
        const toolsList = document.createElement('div');
        toolsList.className = 'video__tools';
        video.tools.forEach((toolName) => {
            const pill = document.createElement('span');
            pill.className = 'video__tool__pill';
            pill.textContent = toolName;
            toolsList.appendChild(pill);
        });
        info.appendChild(toolsList);
    }

    trigger.append(wrapper, info);
    card.appendChild(trigger);

    return card;
}

function bindLanguageSync() {
    if (languageListenerBound) return;
    languageListenerBound = true;
    window.addEventListener('portfolio:languagechange', () => {
        const grid = document.getElementById('portfolio-grade');
        if (!grid) return;
        grid.querySelectorAll('.video__trigger[data-video-title]').forEach((btn) => {
            btn.setAttribute('aria-label', buildPlayAriaLabel(btn.dataset.videoTitle));
        });
    });
}

export function renderPortfolioLoading() {
    const grid = document.getElementById('portfolio-grade');
    if (!grid) return;
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'true');

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 6; i++) {
        const skel = document.createElement('div');
        skel.className = 'video__skeleton';
        skel.setAttribute('aria-hidden', 'true');
        fragment.appendChild(skel);
    }
    grid.appendChild(fragment);
}

export function renderPortfolioError(onRetry) {
    const grid = document.getElementById('portfolio-grade');
    if (!grid) return;
    grid.replaceChildren();
    grid.removeAttribute('aria-busy');

    const box = document.createElement('div');
    box.className = 'section__state section__state--error';
    box.setAttribute('role', 'status');

    const msg = document.createElement('p');
    msg.setAttribute('data-i18n', 'portfolio.error');
    msg.textContent = t('portfolio.error');
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

    grid.appendChild(box);
}

export function initPortfolio(videoRecords) {
    const grid = document.getElementById('portfolio-grade');
    if (!grid) return;

    bindLanguageSync();
    grid.removeAttribute('aria-busy');

    const items = getPublishedVideosByType(videoRecords, 'portfolio');
    grid.replaceChildren();

    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'section__state';
        const p = document.createElement('p');
        p.setAttribute('data-i18n', 'portfolio.empty');
        p.textContent = t('portfolio.empty');
        empty.appendChild(p);
        grid.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((video, index) => {
        fragment.appendChild(createPortfolioCard(video, index));
    });
    grid.appendChild(fragment);
    observeReveals(grid);
}
