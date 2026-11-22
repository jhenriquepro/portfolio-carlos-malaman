/* =========================================
   MAIN.JS — Ponto de entrada (ES Module)
========================================= */

import { initI18n } from './i18n.js';
import { initNavigation, initReveal } from './navigation.js';
import { initShortsCarousel } from './shorts.js';

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    initNavigation();
    initReveal();
    initShortsCarousel();
});
