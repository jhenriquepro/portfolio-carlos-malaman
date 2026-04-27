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
       1b. SCROLL NAV — sobe/desce flutuante
    ---------------------------------------- */
    const scrollNav = document.getElementById('scroll-nav');

    // Seções na ordem da página para navegação sequencial
    const secoes = ['#apresentacao', '#portfolio', '#shorts', '#contatos'];

    const getSecaoAtual = () => {
        const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;
        const meio = window.scrollY + window.innerHeight / 2;
        let atual = 0;
        secoes.forEach((sel, i) => {
            const el = document.querySelector(sel);
            if (el && el.getBoundingClientRect().top + window.scrollY <= meio) {
                atual = i;
            }
        });
        return atual;
    };

    const atualizarScrollNav = () => {
        if (!scrollNav) return;
        const idx = getSecaoAtual();
        const naInicial = window.scrollY < 80;
        // Esconde se estiver na última seção E próximo ao fundo
        const noFundo = (window.scrollY + window.innerHeight) >= document.body.scrollHeight - 80;

        if (noFundo && idx === secoes.length - 1) {
            scrollNav.style.opacity = '0';
            scrollNav.style.pointerEvents = 'none';
        } else {
            scrollNav.style.opacity = '';
            scrollNav.style.pointerEvents = '';
        }

        // Modo: na inicial → só desce. Em qualquer outro ponto → sobe.
        if (naInicial) {
            scrollNav.classList.remove('up');
        } else {
            scrollNav.classList.add('up');
        }
    };

    if (scrollNav) {
        scrollNav.addEventListener('click', () => {
            const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;
            const idx = getSecaoAtual();
            const naInicial = window.scrollY < 80;

            let alvoSel;
            if (naInicial) {
                // Desce para a próxima seção
                alvoSel = secoes[Math.min(idx + 1, secoes.length - 1)];
            } else {
                // Sobe para o topo
                alvoSel = secoes[0];
            }

            const alvo = document.querySelector(alvoSel);
            if (alvo) {
                const y = alvo.getBoundingClientRect().top + window.scrollY - headerH;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });

        window.addEventListener('scroll', atualizarScrollNav, { passive: true });
        atualizarScrollNav();
    }


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

});
