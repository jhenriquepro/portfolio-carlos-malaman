/* =========================================
   CONFIG.JS — Constantes públicas e recursos opcionais
   (Sem segredos ou credenciais privadas)
========================================= */

export const STORAGE_KEYS = Object.freeze({
    language: 'malaman_portfolio_lang',
});

export const DEFAULT_LANG = 'en';
export const SUPPORTED_LANGS = Object.freeze(['en', 'pt']);

export const CAROUSEL_CONFIG = Object.freeze({
    speedPxPerSec: 54,
    maxDeltaSec: 0.05,
});

export const BREAKPOINTS = Object.freeze({
    desktopNav: 900,
    timelineBar: 1024,
});

/**
 * Links externos oficiais.
 * Preencha `ytjobs` com a URL https:// validada quando disponível para ativar o CTA no Hero.
 */
export const EXTERNAL_LINKS = Object.freeze({
    discord: 'https://discord.com/invite/yGyrfG3A',
    email: 'malamancontato@gmail.com',
    twitter: 'https://x.com/MalamanOficial',
    ytjobs: null,
});

/**
 * Configuração do showreel silencioso de fundo no Hero.
 * Mantenha `enabled: false` até adicionar os arquivos otimizados em `assets/videos/`.
 */
export const SHOWREEL_CONFIG = Object.freeze({
    enabled: false,
    webmSrc: 'assets/videos/showreel.webm',
    mp4Src: 'assets/videos/showreel.mp4',
    posterSrc: 'assets/images/showreel-poster.webp',
});

/**
 * Canais/clientes com autorização expressa de divulgação.
 * Deixe vazio (`[]`) enquanto não houver permissões formais; a seção permanece oculta.
 * Formato de cada item autorizado:
 * {
 *   name: 'Nome do Canal',
 *   role: 'YouTube Channel',        // opcional
 *   url: 'https://youtube.com/...', // opcional (somente https://)
 *   logoUrl: 'assets/images/clients/canal.webp' // opcional
 * }
 */
export const AUTHORIZED_CLIENTS = Object.freeze([]);

/**
 * Ferramentas sugeridas para o cadastro de vídeos no /admin.
 */
export const SUGGESTED_TOOLS = Object.freeze([
    'Premiere Pro',
    'After Effects',
    'Photoshop',
    'Frame.io',
    'Sound Design',
    'DaVinci Resolve',
]);
