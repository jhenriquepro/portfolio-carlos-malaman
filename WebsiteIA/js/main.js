/* =========================================
   MAIN.JS — Carlos Malaman Portfolio
========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------
       1. HEADER — scroll effect
    ---------------------------------------- */
    const cabecalho = document.getElementById('cabecalho');

    const onScroll = () => {
        if (window.scrollY > 20) {
            cabecalho.classList.add('scrollado');
        } else {
            cabecalho.classList.remove('scrollado');
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();


    /* ----------------------------------------
       1b. SCROLL NAV — dois botões prev/next (desktop)
    ---------------------------------------- */
    const secoes = ['#apresentacao', '#portfolio', '#shorts', '#contatos'];
    const scrollPrev = document.getElementById('scroll-prev');
    const scrollNext = document.getElementById('scroll-next');

    const getHeaderH = () =>
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;

    const getSecaoAtual = () => {
        const meio = window.scrollY + window.innerHeight / 2;
        let atual = 0;
        secoes.forEach((sel, i) => {
            const el = document.querySelector(sel);
            if (el && el.getBoundingClientRect().top + window.scrollY <= meio) atual = i;
        });
        return atual;
    };

    const scrollParaSecao = (idx) => {
        const alvo = document.querySelector(secoes[Math.max(0, Math.min(secoes.length - 1, idx))]);
        if (alvo) {
            const RESPIRO = 0; // scroll-margin-top nas seções já cuida do offset
            const y = alvo.getBoundingClientRect().top + window.scrollY - getHeaderH() - RESPIRO;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const atualizarScrollNav = () => {
        const idx = getSecaoAtual();
        if (scrollPrev) {
            idx > 0 ? scrollPrev.classList.add('visivel') : scrollPrev.classList.remove('visivel');
        }
        if (scrollNext) {
            idx < secoes.length - 1 ? scrollNext.classList.add('visivel') : scrollNext.classList.remove('visivel');
        }
    };

    if (scrollPrev) scrollPrev.addEventListener('click', () => scrollParaSecao(getSecaoAtual() - 1));
    if (scrollNext) scrollNext.addEventListener('click', () => scrollParaSecao(getSecaoAtual() + 1));

    // Mobile back-to-top button
    const btnTopoMobile = document.getElementById('btn-topo-mobile');
    if (btnTopoMobile) {
        btnTopoMobile.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    window.addEventListener('scroll', atualizarScrollNav, { passive: true });
    atualizarScrollNav();


    /* ----------------------------------------
       2. MENU HAMBÚRGUER (mobile)
    ---------------------------------------- */
    const hamburguer    = document.getElementById('hamburguer');
    const menu          = document.getElementById('menu');
    const menuOverlay   = document.getElementById('menu-overlay');

    const fecharMenu = () => {
        hamburguer.classList.remove('ativo');
        menu.classList.remove('aberto');
        menuOverlay.classList.remove('ativo');
        hamburguer.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    const abrirMenu = () => {
        hamburguer.classList.add('ativo');
        menu.classList.add('aberto');
        menuOverlay.classList.add('ativo');
        hamburguer.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    };

    hamburguer.addEventListener('click', () => {
        const estaAberto = menu.classList.contains('aberto');
        estaAberto ? fecharMenu() : abrirMenu();
    });

    menuOverlay.addEventListener('click', fecharMenu);

    // Fecha ao clicar em um link do menu
    menu.querySelectorAll('.cabecalho__menu__link').forEach(link => {
        link.addEventListener('click', fecharMenu);
    });

    // Fecha ao redimensionar para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 900) fecharMenu();
    });

    // Fecha ao apertar Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharMenu();
    });


    /* ----------------------------------------
       3. REVEAL ON SCROLL — Intersection Observer
    ---------------------------------------- */
    const elementsReveal = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visivel');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        elementsReveal.forEach(el => observer.observe(el));
    } else {
        // Fallback para browsers sem suporte
        elementsReveal.forEach(el => el.classList.add('visivel'));
    }


    /* ----------------------------------------
       4. VIDEO PLAYERS — play/pause com overlay
    ---------------------------------------- */
    const videoCards = document.querySelectorAll('.video__card, .short__card');

    videoCards.forEach(card => {
        const isShort  = card.classList.contains('short__card');
        const wrapper  = card.querySelector(isShort ? '.short__wrapper'  : '.video__wrapper');
        const video    = card.querySelector(isShort ? '.short__player'   : '.video__player');
        const playBtn  = card.querySelector(isShort ? '.short__play'     : '.video__play');

        if (!wrapper || !video || !playBtn) return;

        const pararTodos = () => {
            document.querySelectorAll('.video__player, .short__player').forEach(v => {
                if (v !== video) {
                    v.pause();
                    // Funciona em ambos os tipos sem usar seletor composto no closest
                    const pw = v.closest('.video__wrapper') || v.closest('.short__wrapper');
                    if (pw) pw.classList.remove('tocando');
                }
            });
        };

        const toggleVideo = () => {
            if (video.paused) {
                pararTodos();
                video.play().catch(() => {});
                wrapper.classList.add('tocando');
            } else {
                video.pause();
                wrapper.classList.remove('tocando');
            }
        };

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleVideo();
        });

        wrapper.addEventListener('click', (e) => {
            if (e.target !== playBtn && !playBtn.contains(e.target)) {
                toggleVideo();
            }
        });

        video.addEventListener('ended', () => wrapper.classList.remove('tocando'));
        video.addEventListener('pause',  () => wrapper.classList.remove('tocando'));
    });


    /* ----------------------------------------
       5. RICH EDITOR — toolbar + formatação
    ---------------------------------------- */
    const editorBody    = document.getElementById('editor-body');
    const editorWrapper = document.getElementById('editor-wrapper');
    const toolbar       = document.getElementById('editor-toolbar');
    const anexoInput    = document.getElementById('anexo-input');
    const anexosLista   = document.getElementById('anexos-lista');

    let arquivosAnexados = [];

    // Aplicar comando de formatação
    if (toolbar) {
        toolbar.addEventListener('mousedown', (e) => {
            const btn = e.target.closest('[data-cmd]');
            if (!btn) return;
            e.preventDefault(); // evita perder o foco do editor
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
            atualizarToolbar();
            editorBody.focus();
        });
    }

    // Atualizar botões ativos conforme seleção
    const atualizarToolbar = () => {
        if (!toolbar) return;
        toolbar.querySelectorAll('[data-cmd]').forEach(btn => {
            try {
                if (document.queryCommandState(btn.dataset.cmd)) {
                    btn.classList.add('ativo');
                } else {
                    btn.classList.remove('ativo');
                }
            } catch (_) {}
        });
    };

    if (editorBody) {
        editorBody.addEventListener('keyup',    atualizarToolbar);
        editorBody.addEventListener('mouseup',  atualizarToolbar);
        editorBody.addEventListener('selectionchange', atualizarToolbar);
    }

    // Gestão de anexos
    if (anexoInput) {
        anexoInput.addEventListener('change', () => {
            Array.from(anexoInput.files).forEach(file => {
                if (!arquivosAnexados.find(f => f.name === file.name)) {
                    arquivosAnexados.push(file);
                    renderChip(file);
                }
            });
            // Limpa o input para permitir re-seleção do mesmo arquivo
            anexoInput.value = '';
        });
    }

    const renderChip = (file) => {
        const chip = document.createElement('span');
        chip.className = 'editor__anexo__chip';
        chip.title = file.name;

        const nome = document.createElement('span');
        nome.textContent = file.name;
        nome.style.overflow = 'hidden';
        nome.style.textOverflow = 'ellipsis';
        nome.style.whiteSpace = 'nowrap';
        nome.style.maxWidth = '100px';

        const remover = document.createElement('button');
        remover.type = 'button';
        remover.textContent = '×';
        remover.setAttribute('aria-label', `Remover ${file.name}`);
        remover.addEventListener('click', () => {
            arquivosAnexados = arquivosAnexados.filter(f => f !== file);
            chip.remove();
        });

        chip.appendChild(nome);
        chip.appendChild(remover);
        if (anexosLista) anexosLista.appendChild(chip);
    };


    /* ----------------------------------------
       6. FORMULÁRIO — validação + envio EmailJS
    ---------------------------------------- */

    /*
     * CONFIGURAÇÃO EMAILJS
     * ─────────────────────────────────────────
     * 1. Crie uma conta em https://www.emailjs.com (plano gratuito)
     * 2. Adicione um Email Service (Gmail, por exemplo) → copie o SERVICE_ID
     * 3. Crie um Email Template com as variáveis abaixo → copie o TEMPLATE_ID
     *    Variáveis usadas no template:
     *      {{from_email}}   → e-mail do remetente
     *      {{subject}}      → assunto
     *      {{message_html}} → corpo HTML da mensagem
     * 4. Copie sua Public Key (Account > API Keys)
     * 5. Substitua os valores abaixo:
     */
    const EMAILJS_PUBLIC_KEY  = 'lyd4UqRoUvkZ8YZdX';
    const EMAILJS_SERVICE_ID  = 'service_tyf7b3i';
    const EMAILJS_TEMPLATE_ID = 'template_b2i7xhl';
    const DESTINO_EMAIL       = 'malamancontato@gmail.com';

    // Inicializa EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    const form      = document.getElementById('envio__email');
    const btnEnviar = document.getElementById('btn-enviar');

    if (!form) return;

    const camposSimples = {
        email:   { el: document.getElementById('email-usuario'),   erro: document.getElementById('erro-email') },
        assunto: { el: document.getElementById('assunto-usuario'), erro: document.getElementById('erro-assunto') },
    };

    const mensagensErro = {
        email:   { vazio: 'Informe seu e-mail.', invalido: 'E-mail inválido.' },
        assunto: { vazio: 'Informe o assunto.',  invalido: '' },
    };

    const validarCampo = (nome) => {
        const { el, erro } = camposSimples[nome];
        const valor = el.value.trim();
        if (!valor) {
            el.classList.add('erro');
            erro.textContent = mensagensErro[nome].vazio;
            return false;
        }
        if (nome === 'email') {
            const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!reEmail.test(valor)) {
                el.classList.add('erro');
                erro.textContent = mensagensErro.email.invalido;
                return false;
            }
        }
        el.classList.remove('erro');
        erro.textContent = '';
        return true;
    };

    const validarMensagem = () => {
        const erroTexto = document.getElementById('erro-texto');
        const texto = editorBody ? editorBody.innerText.trim() : '';
        if (!texto) {
            if (editorWrapper) editorWrapper.classList.add('erro');
            if (erroTexto) erroTexto.textContent = 'Escreva sua mensagem.';
            return false;
        }
        if (editorWrapper) editorWrapper.classList.remove('erro');
        if (erroTexto) erroTexto.textContent = '';
        return true;
    };

    // Limpa erros ao digitar
    Object.entries(camposSimples).forEach(([nome, { el }]) => {
        el.addEventListener('input', () => {
            if (el.classList.contains('erro')) validarCampo(nome);
        });
    });

    if (editorBody) {
        editorBody.addEventListener('input', () => {
            if (editorWrapper && editorWrapper.classList.contains('erro')) validarMensagem();
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailValido   = validarCampo('email');
        const assuntoValido = validarCampo('assunto');
        const msgValida     = validarMensagem();

        if (!emailValido || !assuntoValido || !msgValida) return;

        btnEnviar.classList.add('enviando');

        const agora = new Date();
        const horaFormatada = agora.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const templateParams = {
            to_email: DESTINO_EMAIL,
            name:     camposSimples.email.el.value.trim(),
            email:    camposSimples.email.el.value.trim(),
            title:    camposSimples.assunto.el.value.trim(),
            message:  editorBody ? editorBody.innerText : '',
            time:     horaFormatada,
        };

        try {
            if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'SUA_PUBLIC_KEY_AQUI') {
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            } else {
                // Fallback: abre cliente de e-mail nativo com mailto
                const assunto = encodeURIComponent(templateParams.title);
                const corpo   = encodeURIComponent(
                    `De: ${templateParams.email}\n\n${templateParams.message}`
                );
                window.location.href = `mailto:${DESTINO_EMAIL}?subject=${assunto}&body=${corpo}`;
            }

            // Sucesso
            btnEnviar.classList.remove('enviando');
            btnEnviar.classList.add('enviado');

            setTimeout(() => {
                form.reset();
                if (editorBody) editorBody.innerHTML = '';
                arquivosAnexados = [];
                if (anexosLista) anexosLista.innerHTML = '';
                btnEnviar.classList.remove('enviado');
            }, 4000);

        } catch (err) {
            console.error('Erro ao enviar e-mail:', err);
            btnEnviar.classList.remove('enviando');
            btnEnviar.textContent = '⚠ Erro. Tente novamente.';
            setTimeout(() => {
                btnEnviar.innerHTML = '<span class="btn__texto">Enviar Mensagem</span><span class="btn__check" aria-hidden="true">✓ Enviado!</span>';
            }, 3000);
        }
    });


    /* ----------------------------------------
       7. SMOOTH SCROLL para links âncora
    ---------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const alvo = document.querySelector(this.getAttribute('href'));
            if (alvo) {
                e.preventDefault();
                const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;
                const y = alvo.getBoundingClientRect().top + window.scrollY - headerH;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

/* ----------------------------------------
       8. SISTEMA DE TRADUÇÃO (EN / PT)
    ---------------------------------------- */
    const dictionary = {
        en: {
            "a[href='#apresentacao'].cabecalho__menu__link": "Home",
            "a[href='#portfolio'].cabecalho__menu__link": "Portfolio",
            "a[href='#shorts'].cabecalho__menu__link": "Shorts",
            "a[href='#contatos'].cabecalho__menu__link": "Contact",
            ".hero__tag": "✦ Video Editor",
            ".hero__titulo": "Hi, I'm<br><span class=\"destaque\">Carlos Malaman</span>",
            ".hero__subtitulo": "Bringing your videos to life.",
            ".hero__acoes a[href='#portfolio']": "View Portfolio",
            ".hero__acoes a[href='#shorts']": "View Shorts",
            ".hero__acoes a[href='#contatos']": "Contact Me",
            ".stats__item:nth-child(1) .stats__label": "Delivered projects",
            ".stats__item:nth-child(3) .stats__label": "Years of experience",
            ".stats__item:nth-child(5) .stats__label": "Satisfied clients",
            ".portfolio__header .section__tag": "✦ My Work",
            ".portfolio__header .section__titulo": "Portfolio",
            ".portfolio__header .section__subtitulo": "A selection of my best editing projects.",
            ".shorts__header .section__tag": "✦ Shorts & Reels",
            ".shorts__header .section__titulo": "View Shorts",
            ".shorts__header .section__subtitulo": "Fast edits, dynamic cuts, and great pacing.",
            ".contatos__esquerda .section__tag": "✦ Let's Talk",
            ".contatos__esquerda .section__titulo": "Get in<br>Touch",
            ".contatos__descricao": "Ready to take your content to the next level? Send me a message and let's create something amazing together.",
            "label[for='email-usuario']": "Your E-mail",
            "label[for='assunto-usuario']": "Subject",
            ".form__grupo:nth-child(3) .form__label": "Message",
            "#btn-enviar .btn__texto": "Send Message",
            "#btn-enviar .btn__check": "✓ Sent!",
            ".editor__anexo__btn": `<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Attach file`,
            ".rodape__texto": "<span class=\"rodape__marca\">Carlos Malaman</span> — Video Editor",
            ".rodape__dev": "Developed by JHENRIQUEDEV"
        },
        pt: {
            "a[href='#apresentacao'].cabecalho__menu__link": "Início",
            "a[href='#portfolio'].cabecalho__menu__link": "Portfólio",
            "a[href='#shorts'].cabecalho__menu__link": "Shorts",
            "a[href='#contatos'].cabecalho__menu__link": "Contatos",
            ".hero__tag": "✦ Editor de Vídeos",
            ".hero__titulo": "Olá, eu sou<br><span class=\"destaque\">Carlos Malaman</span>",
            ".hero__subtitulo": "Dando vida aos seus vídeos.",
            ".hero__acoes a[href='#portfolio']": "Ver Portfólio",
            ".hero__acoes a[href='#shorts']": "Ver Shorts",
            ".hero__acoes a[href='#contatos']": "Fale Comigo",
            ".stats__item:nth-child(1) .stats__label": "Projetos entregues",
            ".stats__item:nth-child(3) .stats__label": "Anos de experiência",
            ".stats__item:nth-child(5) .stats__label": "Clientes satisfeitos",
            ".portfolio__header .section__tag": "✦ Meus Trabalhos",
            ".portfolio__header .section__titulo": "Portfólio",
            ".portfolio__header .section__subtitulo": "Uma seleção dos meus melhores projetos de edição.",
            ".shorts__header .section__tag": "✦ Shorts & Reels",
            ".shorts__header .section__titulo": "Ver Shorts",
            ".shorts__header .section__subtitulo": "Edições rápidas, cortes dinâmicos e muito ritmo.",
            ".contatos__esquerda .section__tag": "✦ Vamos Conversar",
            ".contatos__esquerda .section__titulo": "Entre em<br>Contato",
            ".contatos__descricao": "Pronto para levar seu conteúdo ao próximo nível? Me envie uma mensagem e vamos criar algo incrível juntos.",
            "label[for='email-usuario']": "Seu E-mail",
            "label[for='assunto-usuario']": "Assunto",
            ".form__grupo:nth-child(3) .form__label": "Mensagem",
            "#btn-enviar .btn__texto": "Enviar Mensagem",
            "#btn-enviar .btn__check": "✓ Enviado!",
            ".editor__anexo__btn": `<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Anexar arquivo`,
            ".rodape__texto": "<span class=\"rodape__marca\">Carlos Malaman</span> — Editor de Vídeos",
            ".rodape__dev": "Desenvolvido por JHENRIQUEDEV"
        }
    };

    const placeholders = {
        en: {
            "#email-usuario": "example@gmail.com",
            "#assunto-usuario": "I want to hire your services.",
            "#editor-body": "Hello Carlos, I would like to..."
        },
        pt: {
            "#email-usuario": "exemplo@gmail.com",
            "#assunto-usuario": "Quero contratar seus serviços.",
            "#editor-body": "Olá Carlos, gostaria de..."
        }
    };

    let currentLang = 'en'; // Inglês como padrão

    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang === 'en' ? 'en' : 'pt-br';
        document.title = lang === 'en' ? 'Carlos Malaman — Video Editor' : 'Carlos Malaman — Editor de Vídeos';

        // Atualiza textos
        for (const selector in dictionary[lang]) {
            const el = document.querySelector(selector);
            if (el) el.innerHTML = dictionary[lang][selector];
        }

        // Atualiza placeholders
        for (const selector in placeholders[lang]) {
            const el = document.querySelector(selector);
            if (el) {
                if (el.tagName === 'INPUT') {
                    el.placeholder = placeholders[lang][selector];
                } else {
                    el.setAttribute('data-placeholder', placeholders[lang][selector]);
                }
            }
        }

        // Atualiza botão de idioma — troca a bandeira visível
        const btn = document.getElementById('btn-lang');
        if (btn) {
            const flagPt = btn.querySelector('.btn__lang__flag--pt');
            const flagEn = btn.querySelector('.btn__lang__flag--en');
            if (flagPt && flagEn) {
                // Mostra a bandeira do idioma ATUAL (indicativo do idioma em uso)
                flagPt.style.display = lang === 'pt' ? 'block' : 'none';
                flagEn.style.display = lang === 'en' ? 'block' : 'none';
            }
            btn.title = lang === 'en' ? 'Mudar para Português' : 'Switch to English';
        }
        
        // Atualiza mensagens de erro do formulário (que já existiam no seu código original)
        if(typeof mensagensErro !== 'undefined') {
            mensagensErro.email.vazio = lang === 'en' ? 'Enter your e-mail.' : 'Informe seu e-mail.';
            mensagensErro.email.invalido = lang === 'en' ? 'Invalid e-mail.' : 'E-mail inválido.';
            mensagensErro.assunto.vazio = lang === 'en' ? 'Enter a subject.' : 'Informe o assunto.';
        }
    }



    /* ----------------------------------------
       9. SHORTS CARROSSEL — loop infinito + drag/touch
    ---------------------------------------- */
    (function initCarrosseis() {
        const rows = document.querySelectorAll('.shorts__carrossel');

        rows.forEach(row => {
            const fita = row.querySelector('.shorts__fita');
            if (!fita) return;

            const direction = row.dataset.direction === 'right' ? 1 : -1;
            // px/segundo de velocidade base
            const SPEED = 60;

            // Clona os cards para loop infinito
            const origCards = Array.from(fita.children);
            origCards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                // Garante lazy loading nos iframes clonados
                clone.querySelectorAll('iframe').forEach(f => f.setAttribute('loading', 'lazy'));
                fita.appendChild(clone);
            });

            // Calcula largura total de um set original
            const getSetW = () => {
                let w = 0;
                origCards.forEach(c => {
                    const style = getComputedStyle(c);
                    w += c.offsetWidth + parseFloat(style.marginRight || 0) + parseFloat(style.marginLeft || 0);
                });
                // também soma o gap (pegamos via fita)
                const gap = parseFloat(getComputedStyle(fita).gap) || 16;
                w += gap * origCards.length;
                return w;
            };

            // Para direção esquerda, iniciamos no começo do set original (offset 0).
            // Para direção direita, também offset 0 — ambas funcionam corretamente
            // porque o wrap infinito acontece nos dois sentidos.
            let offset = 0;
            let lastTime = null;
            let paused = false;
            let isDragging = false;
            let dragStartX = 0;
            let dragStartOffset = 0;
            let returnRAF = null;

            const loop = (ts) => {
                if (lastTime === null) lastTime = ts;
                const dt = (ts - lastTime) / 1000; // segundos
                lastTime = ts;

                if (!paused && !isDragging) {
                    offset += direction * SPEED * dt;
                }

                const setW = getSetW();
                // Wrap infinito — mantém offset dentro de [-setW, setW]
                if (offset > setW)  offset -= setW;
                if (offset < -setW) offset += setW;

                fita.style.transform = `translateX(${-offset}px)`;
                requestAnimationFrame(loop);
            };

            // Para a linha que vai para a esquerda (direction=-1), offset começa em 0
            // mas a fita se move para valores negativos, trazendo os clones do final
            // para a viewport — para evitar espaço vazio no início, começamos
            // o offset negativo pela metade do set clonado (posição neutra visível).
            if (direction === -1) {
                // Aguarda layout ser calculado antes de definir o offset inicial
                requestAnimationFrame(() => {
                    const setW = getSetW();
                    offset = -setW; // começa exibindo os clones (que são cópias dos originais)
                    requestAnimationFrame(loop);
                });
            } else {
                requestAnimationFrame(loop);
            }

            // ── HOVER pause/resume ──
            row.addEventListener('mouseenter', () => { paused = true; });
            row.addEventListener('mouseleave', () => {
                if (!isDragging) paused = false;
            });

            // ── MOUSE drag ──
            row.addEventListener('mousedown', (e) => {
                isDragging = true;
                paused = true;
                dragStartX = e.clientX;
                dragStartOffset = offset;
                row.classList.add('dragging');
                if (returnRAF) { cancelAnimationFrame(returnRAF); returnRAF = null; }
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = dragStartX - e.clientX; // positivo = arrastou esquerda
                offset = dragStartOffset + dx;
            });

            window.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                row.classList.remove('dragging');
                // Retorna ao eixo natural suavemente (volta a andar)
                paused = false;
                lastTime = null; // reseta dt para evitar salto
            });

            // ── TOUCH drag ──
            row.addEventListener('touchstart', (e) => {
                isDragging = true;
                paused = true;
                dragStartX = e.touches[0].clientX;
                dragStartOffset = offset;
                if (returnRAF) { cancelAnimationFrame(returnRAF); returnRAF = null; }
            }, { passive: true });

            row.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const dx = dragStartX - e.touches[0].clientX;
                offset = dragStartOffset + dx;
            }, { passive: true });

            row.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                paused = false;
                lastTime = null;
            });
        });
    })();



    // Aplica inglês imediatamente ao carregar a página
    setLanguage('en');

    // Evento de clique para alternar
    const btnLangToggle = document.getElementById('btn-lang');
    if (btnLangToggle) {
        btnLangToggle.addEventListener('click', () => {
            setLanguage(currentLang === 'en' ? 'pt' : 'en');
        });
    }

});
