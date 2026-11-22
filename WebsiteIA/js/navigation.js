/* =========================================
   NAVIGATION.JS — Header, Menu Mobile, Scroll Nav e Reveal
========================================= */

import { BREAKPOINTS, SECTION_SELECTORS } from './config.js';
import { t } from './i18n.js';

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getScrollBehavior() {
    return prefersReducedMotion() ? 'auto' : 'smooth';
}

function getHeaderHeight() {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;
}

export function initNavigation() {
    const cabecalho = document.getElementById('cabecalho');
    const scrollPrev = document.getElementById('scroll-prev');
    const scrollNext = document.getElementById('scroll-next');
    const btnTopoMobile = document.getElementById('btn-topo-mobile');

    const getCurrentSectionIndex = () => {
        const midpoint = window.scrollY + window.innerHeight / 2;
        let current = 0;
        SECTION_SELECTORS.forEach((selector, idx) => {
            const el = document.querySelector(selector);
            if (el && el.getBoundingClientRect().top + window.scrollY <= midpoint) {
                current = idx;
            }
        });
        return current;
    };

    const scrollToSection = (index) => {
        const clamped = Math.max(0, Math.min(SECTION_SELECTORS.length - 1, index));
        const target = document.querySelector(SECTION_SELECTORS[clamped]);
        if (!target) return;
        const y = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
        window.scrollTo({ top: y, behavior: getScrollBehavior() });
    };

    let scrollTicking = false;
    const syncScrollState = () => {
        scrollTicking = false;

        if (cabecalho) {
            cabecalho.classList.toggle('scrollado', window.scrollY > 20);
        }

        const idx = getCurrentSectionIndex();
        if (scrollPrev) {
            scrollPrev.classList.toggle('visivel', idx > 0);
        }
        if (scrollNext) {
            scrollNext.classList.toggle('visivel', idx < SECTION_SELECTORS.length - 1);
        }
    };

    const onScroll = () => {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(syncScrollState);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    syncScrollState();

    if (scrollPrev) {
        scrollPrev.addEventListener('click', () => scrollToSection(getCurrentSectionIndex() - 1));
    }
    if (scrollNext) {
        scrollNext.addEventListener('click', () => scrollToSection(getCurrentSectionIndex() + 1));
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
            if (!target) return;

            e.preventDefault();
            const y = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
            window.scrollTo({ top: y, behavior: getScrollBehavior() });
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

export function initReveal() {
    const elementsReveal = document.querySelectorAll('.reveal');
    if (!elementsReveal.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
        elementsReveal.forEach((el) => el.classList.add('visivel'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visivel');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px',
        }
    );

    elementsReveal.forEach((el) => observer.observe(el));
}
