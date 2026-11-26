/* =========================================
   CLIENTS.JS — Seção opcional de canais/clientes autorizados
   Permanece oculta se não houver itens reais autorizados em config.js
========================================= */

import { AUTHORIZED_CLIENTS } from './config.js';
import { isSafeHttpsUrl } from './video-utils.js';

function sanitizeClient(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : '';
    if (!name) return null;

    const role = typeof raw.role === 'string' ? raw.role.trim().slice(0, 80) : '';
    const url = isSafeHttpsUrl(raw.url) ? raw.url.trim() : null;
    const logoUrl = typeof raw.logoUrl === 'string' && /^(assets\/|https:\/\/)/.test(raw.logoUrl.trim())
        ? raw.logoUrl.trim()
        : null;

    return { name, role, url, logoUrl };
}

function createInitialsAvatar(name) {
    const avatar = document.createElement('span');
    avatar.className = 'cliente__monograma';
    avatar.setAttribute('aria-hidden', 'true');
    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');
    avatar.textContent = initials || '•';
    return avatar;
}

export function initClientsSection() {
    const section = document.getElementById('clientes');
    const grid = document.getElementById('clientes-grade');
    const navLinks = document.querySelectorAll('[data-clients-nav]');

    if (!section || !grid) return false;

    const validClients = Array.isArray(AUTHORIZED_CLIENTS)
        ? AUTHORIZED_CLIENTS.map(sanitizeClient).filter(Boolean)
        : [];

    if (!validClients.length) {
        section.hidden = true;
        navLinks.forEach((el) => { el.hidden = true; });
        return false;
    }

    section.hidden = false;
    navLinks.forEach((el) => { el.hidden = false; });
    grid.replaceChildren();

    const fragment = document.createDocumentFragment();

    validClients.forEach((client) => {
        const tag = client.url ? 'a' : 'div';
        const card = document.createElement(tag);
        card.className = 'cliente__card reveal';
        if (client.url) {
            card.href = client.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }

        if (client.logoUrl) {
            const img = document.createElement('img');
            img.className = 'cliente__logo';
            img.src = client.logoUrl;
            img.alt = client.name;
            img.width = 48;
            img.height = 48;
            img.loading = 'lazy';
            img.decoding = 'async';
            card.appendChild(img);
        } else {
            card.appendChild(createInitialsAvatar(client.name));
        }

        const meta = document.createElement('div');
        meta.className = 'cliente__meta';

        const title = document.createElement('span');
        title.className = 'cliente__nome';
        title.textContent = client.name;
        meta.appendChild(title);

        if (client.role) {
            const role = document.createElement('span');
            role.className = 'cliente__papel';
            role.textContent = client.role;
            meta.appendChild(role);
        }

        card.appendChild(meta);
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    return true;
}
