/* =========================================
   MAIN.JS — Ponto de entrada do site público (ES Module)
========================================= */

import { initClientsSection } from './clients.js';
import { EXTERNAL_LINKS } from './config.js';
import { isFirebaseConfigured } from './firebase.js';
import { initI18n } from './i18n.js';
import { initNavigation, initReveal } from './navigation.js';
import { initPlayerModal } from './player.js';
import { initPortfolio, renderPortfolioError, renderPortfolioLoading } from './portfolio.js';
import { initShortsCarousel, renderShortsError, renderShortsLoading } from './shorts.js';
import { initHeroShowreel } from './showreel.js';
import { isSafeHttpsUrl } from './video-utils.js';
import { subscribePublishedVideos } from './videos.repository.js';

let unsubscribeVideos = null;

function configureOptionalHeroCtas() {
    const ytjobsBtn = document.getElementById('cta-ytjobs');
    const fallbackContactBtn = document.getElementById('cta-hero-contact');
    if (!ytjobsBtn || !fallbackContactBtn) return;

    if (isSafeHttpsUrl(EXTERNAL_LINKS.ytjobs)) {
        ytjobsBtn.href = EXTERNAL_LINKS.ytjobs;
        ytjobsBtn.hidden = false;
        fallbackContactBtn.hidden = true;
    } else {
        ytjobsBtn.hidden = true;
        fallbackContactBtn.hidden = false;
    }
}

async function connectVideosStream() {
    if (typeof unsubscribeVideos === 'function') {
        unsubscribeVideos();
        unsubscribeVideos = null;
    }

    if (isFirebaseConfigured()) {
        renderPortfolioLoading();
        renderShortsLoading();
    }

    unsubscribeVideos = await subscribePublishedVideos({
        onData: ({ videos }) => {
            initPortfolio(videos);
            initShortsCarousel(videos);
        },
        onError: () => {
            renderPortfolioError(() => connectVideosStream());
            renderShortsError(() => connectVideosStream());
        },
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    configureOptionalHeroCtas();
    initHeroShowreel();
    initClientsSection();
    initPlayerModal();
    initNavigation();
    initReveal();
    connectVideosStream();
});

window.addEventListener('beforeunload', () => {
    if (typeof unsubscribeVideos === 'function') {
        unsubscribeVideos();
        unsubscribeVideos = null;
    }
});
