/* =========================================
   I18N.JS — Tradução EN (padrão) / PT com persistência
========================================= */

import { DEFAULT_LANG, STORAGE_KEYS, SUPPORTED_LANGS } from './config.js';

const TRANSLATIONS = {
    en: {
        'meta.title': 'Carlos Malaman — Video Editor',
        'nav.home': 'Home',
        'nav.clients': 'Clients',
        'nav.portfolio': 'Portfolio',
        'nav.shorts': 'Shorts',
        'nav.contact': 'Contact',
        'nav.ariaMain': 'Main navigation',
        'nav.ariaTimeline': 'Section timeline navigation',
        'nav.ariaOpenMenu': 'Open menu',
        'nav.ariaCloseMenu': 'Close menu',
        'nav.ariaLangSwitch': 'Switch language to Portuguese',
        'nav.ariaPrevSection': 'Previous section',
        'nav.ariaNextSection': 'Next section',
        'hero.eyebrow': 'Video Editor · Storytelling & Retention',
        'hero.headlineLine1': 'Cuts built for',
        'hero.headlineAccent': 'storytelling.',
        'hero.subtitle': 'Fluid pacing, sharp narrative rhythm, and clean motion for YouTube creators and growing channels.',
        'hero.ctaPortfolio': 'View Portfolio',
        'hero.ctaYtjobs': 'YTJobs Profile',
        'hero.ctaContact': 'Contact on Discord',
        'hero.serviceEditing': 'Video Editing',
        'hero.serviceMotion': 'Motion Design',
        'hero.serviceSound': 'Sound Design',
        'hero.stackLabel': 'Workflow Stack',
        'clients.tag': 'Trusted By',
        'clients.title': 'Selected Channels',
        'clients.subtitle': 'Creators and channels authorized for showcase.',
        'portfolio.tag': 'Selected Work',
        'portfolio.title': 'Portfolio',
        'portfolio.subtitle': 'Long-form edits focused on pacing, retention, and visual clarity.',
        'portfolio.featured': 'Featured',
        'portfolio.loading': 'Loading projects...',
        'portfolio.empty': 'No published videos yet.',
        'portfolio.error': 'Could not load videos right now.',
        'portfolio.retry': 'Try again',
        'shorts.tag': 'Vertical Formats',
        'shorts.title': 'Shorts & Reels',
        'shorts.subtitle': 'Fast hooks, dynamic cuts, and crisp rhythm built for vertical retention.',
        'shorts.pause': 'Pause motion',
        'shorts.resume': 'Resume motion',
        'shorts.loading': 'Loading shorts...',
        'shorts.empty': 'No vertical videos published yet.',
        'shorts.error': 'Could not load vertical videos.',
        'player.playVideo': 'Play video',
        'player.playShort': 'Play short',
        'player.close': 'Close video',
        'player.watchExternal': 'Watch on YouTube',
        'player.openExternal': 'Open original video',
        'player.externalNotice': 'This platform does not allow direct embedding here. Open the original video safely in a new tab.',
        'contact.tag': 'Start a Project',
        'contact.titleLine1': 'Ready to level up',
        'contact.titleLine2': 'your next edit?',
        'contact.description': 'Fast communication, reliable deadlines, and editing tailored to your channel identity.',
        'contact.briefTip': 'When reaching out, send a reference video link and a brief note on what you need.',
        'contact.cardEyebrow': 'Preferred Channel',
        'contact.cardTitle': 'Reach out on Discord',
        'contact.cardNote': 'Fastest response for creators, YouTubers, and ongoing channel work.',
        'contact.discordCta': 'Message on Discord',
        'contact.emailLabel': 'Email',
        'contact.emailDetail': 'Direct mailto',
        'contact.twitterLabel': 'X / Twitter',
        'contact.twitterDetail': '@MalamanOficial',
        'footer.backToTop': 'Back to top',
        'footer.role': 'Video Editor',
        'footer.developedBy': 'Developed by',
        'footer.adminLink': 'Admin',
    },
    pt: {
        'meta.title': 'Carlos Malaman — Editor de Vídeos',
        'nav.home': 'Início',
        'nav.clients': 'Canais',
        'nav.portfolio': 'Portfólio',
        'nav.shorts': 'Shorts',
        'nav.contact': 'Contato',
        'nav.ariaMain': 'Navegação principal',
        'nav.ariaTimeline': 'Linha do tempo de seções',
        'nav.ariaOpenMenu': 'Abrir menu',
        'nav.ariaCloseMenu': 'Fechar menu',
        'nav.ariaLangSwitch': 'Switch language to English',
        'nav.ariaPrevSection': 'Seção anterior',
        'nav.ariaNextSection': 'Próxima seção',
        'hero.eyebrow': 'Editor de Vídeos · Storytelling & Retenção',
        'hero.headlineLine1': 'Cortes feitos para',
        'hero.headlineAccent': 'storytelling.',
        'hero.subtitle': 'Ritmo fluido, narrativa envolvente e motion preciso para criadores do YouTube e canais em crescimento.',
        'hero.ctaPortfolio': 'Ver Portfólio',
        'hero.ctaYtjobs': 'Perfil YTJobs',
        'hero.ctaContact': 'Chamar no Discord',
        'hero.serviceEditing': 'Edição de Vídeo',
        'hero.serviceMotion': 'Motion Design',
        'hero.serviceSound': 'Sound Design',
        'hero.stackLabel': 'Ferramentas',
        'clients.tag': 'Autoridade',
        'clients.title': 'Canais Selecionados',
        'clients.subtitle': 'Criadores e canais com divulgação autorizada.',
        'portfolio.tag': 'Trabalhos Selecionados',
        'portfolio.title': 'Portfólio',
        'portfolio.subtitle': 'Edições horizontais com foco em ritmo, retenção e clareza visual.',
        'portfolio.featured': 'Destaque',
        'portfolio.loading': 'Carregando projetos...',
        'portfolio.empty': 'Nenhum vídeo publicado no momento.',
        'portfolio.error': 'Não foi possível carregar os vídeos agora.',
        'portfolio.retry': 'Tentar novamente',
        'shorts.tag': 'Formatos Verticais',
        'shorts.title': 'Shorts & Reels',
        'shorts.subtitle': 'Ganchos rápidos, cortes dinâmicos e ritmo pensado para retenção vertical.',
        'shorts.pause': 'Pausar movimento',
        'shorts.resume': 'Retomar movimento',
        'shorts.loading': 'Carregando shorts...',
        'shorts.empty': 'Nenhum vídeo vertical publicado no momento.',
        'shorts.error': 'Não foi possível carregar os vídeos verticais.',
        'player.playVideo': 'Reproduzir vídeo',
        'player.playShort': 'Reproduzir short',
        'player.close': 'Fechar vídeo',
        'player.watchExternal': 'Assistir no YouTube',
        'player.openExternal': 'Abrir vídeo original',
        'player.externalNotice': 'Esta plataforma não permite incorporação direta aqui. Abra o vídeo original com segurança em uma nova aba.',
        'contact.tag': 'Vamos Conversar',
        'contact.titleLine1': 'Pronto para elevar',
        'contact.titleLine2': 'sua próxima edição?',
        'contact.description': 'Comunicação rápida, responsabilidade com prazos e edição alinhada à identidade do seu canal.',
        'contact.briefTip': 'Ao entrar em contato, envie um vídeo de referência e uma breve descrição do que você gostaria.',
        'contact.cardEyebrow': 'Canal Preferencial',
        'contact.cardTitle': 'Fale comigo no Discord',
        'contact.cardNote': 'Resposta mais rápida para criadores, YouTubers e parcerias recorrentes.',
        'contact.discordCta': 'Chamar no Discord',
        'contact.emailLabel': 'E-mail',
        'contact.emailDetail': 'Abrir cliente de e-mail',
        'contact.twitterLabel': 'X / Twitter',
        'contact.twitterDetail': '@MalamanOficial',
        'footer.backToTop': 'Voltar ao topo',
        'footer.role': 'Editor de Vídeos',
        'footer.developedBy': 'Desenvolvido por',
        'footer.adminLink': 'Painel',
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
        // Ignora bloqueio de storage
    }
    return DEFAULT_LANG;
}

function saveLanguage(lang) {
    try {
        window.localStorage.setItem(STORAGE_KEYS.language, lang);
    } catch {
        // Ignora bloqueio de storage
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
        const codeEl = btnLang.querySelector('[data-lang-code]');
        if (flagPt && flagEn) {
            flagPt.style.display = normalized === 'pt' ? 'block' : 'none';
            flagEn.style.display = normalized === 'en' ? 'block' : 'none';
        }
        if (codeEl) {
            codeEl.textContent = normalized.toUpperCase();
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
