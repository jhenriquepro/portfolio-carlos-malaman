/* =========================================
   I18N.JS — Tradução EN (padrão) / PT com persistência
========================================= */

import { DEFAULT_LANG, STORAGE_KEYS, SUPPORTED_LANGS } from './config.js';

const TRANSLATIONS = {
    en: {
        'meta.title': 'Carlos Malaman — Video Editor',
        'nav.home': 'Home',
        'nav.portfolio': 'Portfolio',
        'nav.shorts': 'Shorts',
        'nav.contact': 'Contact',
        'nav.ariaMain': 'Main navigation',
        'nav.ariaOpenMenu': 'Open menu',
        'nav.ariaCloseMenu': 'Close menu',
        'nav.ariaLangSwitch': 'Switch language to Portuguese',
        'nav.ariaPrevSection': 'Previous section',
        'nav.ariaNextSection': 'Next section',
        'hero.tag': '✦ Video Editor',
        'hero.greeting': "Hi, I'm",
        'hero.subtitle': 'Bringing your videos to life.',
        'hero.ctaPortfolio': 'View Portfolio',
        'hero.ctaShorts': 'View Shorts',
        'hero.ctaContact': 'Contact Me',
        'hero.stackLabel': 'Stack',
        'portfolio.tag': '✦ My Work',
        'portfolio.title': 'Portfolio',
        'portfolio.subtitle': 'A selection of my best editing projects.',
        'shorts.tag': '✦ Shorts & Reels',
        'shorts.title': 'View Shorts',
        'shorts.subtitle': 'Fast edits, dynamic cuts, and great pacing.',
        'shorts.pause': 'Pause carousel',
        'shorts.resume': 'Resume carousel',
        'contact.tag': "✦ Let's Talk",
        'contact.titleLine1': 'Get in',
        'contact.titleLine2': 'Touch',
        'contact.description': "Ready to take your content to the next level? Reach out directly and let's create something awesome together.",
        'contact.cardTitle': 'Direct Contact',
        'contact.cardNote': 'Preferred channel: Discord. When reaching out, please share a reference video and a brief description of what you are looking for.',
        'contact.discordCta': 'Message on Discord (Preferred)',
        'contact.emailLabel': 'Email',
        'contact.emailDetail': 'Direct mailto',
        'contact.twitterLabel': 'X / Twitter',
        'contact.twitterDetail': 'Secondary channel',
        'footer.backToTop': 'Back to top',
        'footer.role': 'Video Editor',
        'footer.developedBy': 'Developed by',
    },
    pt: {
        'meta.title': 'Carlos Malaman — Editor de Vídeos',
        'nav.home': 'Início',
        'nav.portfolio': 'Portfólio',
        'nav.shorts': 'Shorts',
        'nav.contact': 'Contatos',
        'nav.ariaMain': 'Navegação principal',
        'nav.ariaOpenMenu': 'Abrir menu',
        'nav.ariaCloseMenu': 'Fechar menu',
        'nav.ariaLangSwitch': 'Switch language to English',
        'nav.ariaPrevSection': 'Seção anterior',
        'nav.ariaNextSection': 'Próxima seção',
        'hero.tag': '✦ Editor de Vídeos',
        'hero.greeting': 'Olá, eu sou',
        'hero.subtitle': 'Dando vida aos seus vídeos.',
        'hero.ctaPortfolio': 'Ver Portfólio',
        'hero.ctaShorts': 'Ver Shorts',
        'hero.ctaContact': 'Fale Comigo',
        'hero.stackLabel': 'Stack',
        'portfolio.tag': '✦ Meus Trabalhos',
        'portfolio.title': 'Portfólio',
        'portfolio.subtitle': 'Uma seleção dos meus melhores projetos de edição.',
        'shorts.tag': '✦ Shorts & Reels',
        'shorts.title': 'Ver Shorts',
        'shorts.subtitle': 'Edições rápidas, cortes dinâmicos e muito ritmo.',
        'shorts.pause': 'Pausar carrossel',
        'shorts.resume': 'Retomar carrossel',
        'contact.tag': '✦ Vamos Conversar',
        'contact.titleLine1': 'Entre em',
        'contact.titleLine2': 'Contato',
        'contact.description': 'Pronto para levar seu conteúdo ao próximo nível? Fale comigo diretamente e vamos criar algo incrível juntos.',
        'contact.cardTitle': 'Contato Direto',
        'contact.cardNote': 'Canal preferencial: Discord. Ao enviar mensagem, compartilhe um vídeo de referência e uma breve descrição do que você precisa.',
        'contact.discordCta': 'Chamar no Discord (Preferencial)',
        'contact.emailLabel': 'E-mail',
        'contact.emailDetail': 'Abrir cliente de e-mail',
        'contact.twitterLabel': 'X / Twitter',
        'contact.twitterDetail': 'Canal secundário',
        'footer.backToTop': 'Voltar ao topo',
        'footer.role': 'Editor de Vídeos',
        'footer.developedBy': 'Desenvolvido por',
    },
};

let currentLang = DEFAULT_LANG;

function readSavedLanguage() {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEYS.language);
        if (saved && SUPPORTED_LANGS.includes(saved)) {
            return saved;
        }
    } catch {
        // Ignora bloqueio de storage em navegação privada restrita
    }
    return DEFAULT_LANG;
}

function saveLanguage(lang) {
    try {
        window.localStorage.setItem(STORAGE_KEYS.language, lang);
    } catch {
        // Ignora indisponibilidade de storage
    }
}

export function getCurrentLanguage() {
    return currentLang;
}

export function t(key, lang = currentLang) {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANG]?.[key] ?? '';
}

export function applyLanguage(lang, { persist = true } = {}) {
    const normalized = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    currentLang = normalized;

    if (persist) {
        saveLanguage(normalized);
    }

    document.documentElement.lang = normalized === 'pt' ? 'pt-BR' : 'en';
    document.title = t('meta.title', normalized);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const value = t(key, normalized);
        if (value) {
            el.textContent = value;
        }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria');
        const value = t(key, normalized);
        if (value) {
            el.setAttribute('aria-label', value);
        }
    });

    const btnLang = document.getElementById('btn-lang');
    if (btnLang) {
        const flagPt = btnLang.querySelector('.btn__lang__flag--pt');
        const flagEn = btnLang.querySelector('.btn__lang__flag--en');
        if (flagPt && flagEn) {
            flagPt.style.display = normalized === 'pt' ? 'block' : 'none';
            flagEn.style.display = normalized === 'en' ? 'block' : 'none';
        }
        const switchLabel = t('nav.ariaLangSwitch', normalized);
        btnLang.title = switchLabel;
        btnLang.setAttribute('aria-label', switchLabel);
    }

    window.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { lang: normalized } }));
}

export function initI18n() {
    const initialLang = readSavedLanguage();
    applyLanguage(initialLang, { persist: false });

    const btnLang = document.getElementById('btn-lang');
    if (btnLang) {
        btnLang.addEventListener('click', () => {
            applyLanguage(currentLang === 'en' ? 'pt' : 'en');
        });
    }
}
