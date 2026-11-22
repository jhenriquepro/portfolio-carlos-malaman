/* =========================================
   CONFIG.JS — Constantes não sensíveis
========================================= */

export const STORAGE_KEYS = Object.freeze({
    language: 'malaman_portfolio_lang',
});

export const DEFAULT_LANG = 'en';
export const SUPPORTED_LANGS = Object.freeze(['en', 'pt']);

export const SECTION_SELECTORS = Object.freeze([
    '#apresentacao',
    '#portfolio',
    '#shorts',
    '#contatos',
]);

export const CAROUSEL_CONFIG = Object.freeze({
    speedPxPerSec: 60,
    maxDeltaSec: 0.05,
});

export const BREAKPOINTS = Object.freeze({
    desktopNav: 900,
});
