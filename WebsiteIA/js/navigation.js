/* =========================================
   NAVIGATION.JS — Header, Menu Mobile, Timeline Bar, Scroll Nav e Reveal
========================================= */

import { BREAKPOINTS } from './config.js';
import { t } from './i18n.js';

const ALL_SECTION_IDS = ['#apresentacao', '#clientes', '#portfolio', '#shorts', '#contatos'];

let revealObserver = null;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getScrollBehavior() {
    return prefersReducedMotion() ? 'auto' : 'smooth';
}

function getHeaderHeight() {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 68;
}

function getActiveSectionSelectors() {
    return ALL_SECTION_IDS.filter((sel) => {
        const el = document.querySelector(sel);
        return Boolean(el && !el.hidden);
    });
}

export function initNavigation() {
    const cabecalho = document.getElementById('cabecalho');
    const scrollPrev = document.getElementById('scroll-prev');
    const scrollNext = document.getElementById('scroll-next');
    const btnTopoMobile = document.getElementById('btn-topo-mobile');
    const timelinePlayhead = document.getElementById('timeline-playhead');
    const timelineLinks = Array.from(document.querySelectorAll('.timeline-nav__segment'));
    const headerLinks = Array.from(document.querySelectorAll('.cabecalho__menu__link'));

    const getCurrentSectionIndex = (selectors) => {
        const midpoint = window.scrollY + window.innerHeight * 0.45;
        let current = 0;
        selectors.forEach((selector, idx) => {
            const el = document.querySelector(selector);
            if (el && el.getBoundingClientRect().top + window.scrollY <= midpoint) {
                current = idx;
            }
        });
        return current;
    };

    const scrollToSection = (index) => {
        const selectors = getActiveSectionSelectors();
        if (!selectors.length) return;
        const clamped = Math.max(0, Math.min(selectors.length - 1, index));
        const target = document.querySelector(selectors[clamped]);
        if (!target) return;
        const y = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
        window.scrollTo({ top: Math.max(0, y), behavior: getScrollBehavior() });
    };

    let scrollTicking = false;
    const syncScrollState = () => {
        scrollTicking = false;

        if (cabecalho) {
            cabecalho.classList.toggle('scrollado', window.scrollY > 20);
        }

        const selectors = getActiveSectionSelectors();
        const idx = getCurrentSectionIndex(selectors);
        const activeSelector = selectors[idx] || '#apresentacao';

        if (scrollPrev) {
            scrollPrev.disabled = idx <= 0;
            scrollPrev.classList.toggle('visivel', idx > 0);
        }
        if (scrollNext) {
            scrollNext.disabled = idx >= selectors.length - 1;
            scrollNext.classList.toggle('visivel', idx < selectors.length - 1);
        }

        headerLinks.forEach((link) => {
            const isCurrent = link.getAttribute('href') === activeSelector;
            link.classList.toggle('ativo', isCurrent);
            if (isCurrent) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });

        timelineLinks.forEach((seg) => {
            const isCurrent = seg.getAttribute('href') === activeSelector;
            seg.classList.toggle('ativo', isCurrent);
            if (isCurrent) seg.setAttribute('aria-current', 'location');
            else seg.removeAttribute('aria-current');
        });

        if (timelinePlayhead) {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const pct = Math.max(0, Math.min(100, (window.scrollY / maxScroll) * 100));
            timelinePlayhead.style.left = `${pct}%`;
        }
    };

    const onScroll = () => {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(syncScrollState);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    syncScrollState();

    if (scrollPrev) {
        scrollPrev.addEventListener('click', () => {
            const selectors = getActiveSectionSelectors();
            scrollToSection(getCurrentSectionIndex(selectors) - 1);
        });
    }
    if (scrollNext) {
        scrollNext.addEventListener('click', () => {
            const selectors = getActiveSectionSelectors();
            scrollToSection(getCurrentSectionIndex(selectors) + 1);
        });
    }

    if (btnTopoMobile) {
        btnTopoMobile.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: getScrollBehavior() });
        });
    }

    // Smooth scroll controlado para âncoras internas
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target || target.hidden) return;

            e.preventDefault();
            const y = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
            window.scrollTo({ top: Math.max(0, y), behavior: getScrollBehavior() });
        });
    });

    // Menu mobile hambúrguer
    const hamburguer = document.getElementById('hamburguer');
    const menu = document.getElementById('menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (hamburguer && menu && menuOverlay) {
        const setMenuOpen = (open, { restoreFocus = false } = {}) => {
            hamburguer.classList.toggle('ativo', open);
            menu.classList.toggle('aberto', open);
            menuOverlay.classList.toggle('ativo', open);
            hamburguer.setAttribute('aria-expanded', String(open));
            hamburguer.setAttribute('aria-label', t(open ? 'nav.ariaCloseMenu' : 'nav.ariaOpenMenu'));
            document.body.style.overflow = open ? 'hidden' : '';

            if (!open && restoreFocus) {
                hamburguer.focus();
            }
        };

        hamburguer.addEventListener('click', () => {
            setMenuOpen(!menu.classList.contains('aberto'));
        });

        menuOverlay.addEventListener('click', () => setMenuOpen(false));

        menu.querySelectorAll('.cabecalho__menu__link').forEach((link) => {
            link.addEventListener('click', () => setMenuOpen(false));
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= BREAKPOINTS.desktopNav && menu.classList.contains('aberto')) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('aberto')) {
                setMenuOpen(false, { restoreFocus: true });
            }
        });

        window.addEventListener('portfolio:languagechange', () => {
            const isOpen = menu.classList.contains('aberto');
            hamburguer.setAttribute('aria-label', t(isOpen ? 'nav.ariaCloseMenu' : 'nav.ariaOpenMenu'));
        });
    }
}

export function observeReveals(root = document) {
    const targets = root.querySelectorAll('.reveal:not(.visivel)');
    if (!targets.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('visivel'));
        return;
    }

    if (!revealObserver) {
        revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visivel');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -30px 0px',
            }
        );
    }

    targets.forEach((el) => revealObserver.observe(el));
}

export function initReveal() {
    observeReveals(document);
}
