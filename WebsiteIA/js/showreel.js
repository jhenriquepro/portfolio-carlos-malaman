/* =========================================
   SHOWREEL.JS — Vídeo silencioso opcional no Hero com fallback seguro
========================================= */

import { SHOWREEL_CONFIG } from './config.js';

function shouldSkipAutoplayVideo() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const slowConnection = ['slow-2g', '2g'].includes(navigator.connection?.effectiveType);
    return reducedMotion || saveData || slowConnection;
}

export function initHeroShowreel() {
    const host = document.getElementById('hero-showreel-host');
    if (!host || !SHOWREEL_CONFIG.enabled) return;

    host.replaceChildren();

    // Se movimento reduzido ou economia de dados estiver ativo, mostra apenas o pôster estático (se houver)
    if (shouldSkipAutoplayVideo()) {
        if (SHOWREEL_CONFIG.posterSrc) {
            const poster = document.createElement('img');
            poster.className = 'hero__showreel__poster';
            poster.src = SHOWREEL_CONFIG.posterSrc;
            poster.alt = '';
            poster.setAttribute('aria-hidden', 'true');
            poster.decoding = 'async';
            poster.addEventListener('error', () => poster.remove());
            host.appendChild(poster);
        }
        return;
    }

    const video = document.createElement('video');
    video.className = 'hero__showreel__video';
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-hidden', 'true');
    if (SHOWREEL_CONFIG.posterSrc) {
        video.poster = SHOWREEL_CONFIG.posterSrc;
    }

    if (SHOWREEL_CONFIG.webmSrc) {
        const sWebm = document.createElement('source');
        sWebm.src = SHOWREEL_CONFIG.webmSrc;
        sWebm.type = 'video/webm';
        video.appendChild(sWebm);
    }
    if (SHOWREEL_CONFIG.mp4Src) {
        const sMp4 = document.createElement('source');
        sMp4.src = SHOWREEL_CONFIG.mp4Src;
        sMp4.type = 'video/mp4';
        video.appendChild(sMp4);
    }

    // Fallback elegante se o arquivo não existir ou falhar
    video.addEventListener('error', () => {
        video.remove();
    });

    host.appendChild(video);

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
            // Autoplay bloqueado pelo navegador — mantém pôster ou fundo CSS legível
            video.controls = false;
        });
    }
}
