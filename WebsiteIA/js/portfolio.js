/* =========================================
   PORTFOLIO.JS — Renderização sob demanda dos cards horizontais
========================================= */

import { t } from './i18n.js';
import { openVideoModal } from './player.js';
import { FALLBACK_THUMBNAIL_DATA_URI, getPublishedVideosByType } from './video-utils.js';

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

    const info = document.createElement('div');
    info.className = 'video__info';

    const tag = document.createElement('span');
    tag.className = 'video__tag';
    tag.textContent = video.badge;

    const heading = document.createElement('h3');
    heading.className = 'video__titulo';
    heading.textContent = video.title;

    info.append(tag, heading);
    trigger.append(wrapper, info);
    card.appendChild(trigger);

    return card;
}

export function initPortfolio(videoRecords) {
    const grid = document.getElementById('portfolio-grade');
    if (!grid) return;

    const items = getPublishedVideosByType(videoRecords, 'portfolio');
    grid.replaceChildren();

    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'portfolio__empty';
        empty.setAttribute('data-i18n', 'portfolio.empty');
        empty.textContent = t('portfolio.empty');
        grid.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((video, index) => {
        fragment.appendChild(createPortfolioCard(video, index));
    });
    grid.appendChild(fragment);

    window.addEventListener('portfolio:languagechange', () => {
        grid.querySelectorAll('.video__trigger[data-video-title]').forEach((btn) => {
            btn.setAttribute('aria-label', buildPlayAriaLabel(btn.dataset.videoTitle));
        });
    });
}
