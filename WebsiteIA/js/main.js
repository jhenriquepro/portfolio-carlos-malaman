/* =========================================
   MAIN.JS — Ponto de entrada (ES Module)
========================================= */

import { initI18n } from './i18n.js';
import { initNavigation, initReveal } from './navigation.js';
import { initPlayerModal } from './player.js';
import { initPortfolio } from './portfolio.js';
import { initShortsCarousel } from './shorts.js';
import { INITIAL_VIDEOS } from './videos.data.js';

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    initPlayerModal();
    initPortfolio(INITIAL_VIDEOS);
    initShortsCarousel(INITIAL_VIDEOS);
    initNavigation();
    initReveal();
});
