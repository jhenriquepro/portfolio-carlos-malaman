# Checklist de Aceite Manual — Malaman Portfolio

Roteiro de validação incremental baseado em `docs/PLANO_IMPLEMENTACAO_MALAMAN.md`.

## Fase 1 — Estrutura, Correções de Bugs, Assets e Modularização

- [x] **F1-01 — HTML válido:** sem links `<a>` aninhados, `<section id="contatos">` dentro de `<main>`, `rel="noopener noreferrer"` em todos os `target="_blank"`.
- [x] **F1-02 — Links limpos:** nenhum placeholder (`wa.me/SEU_NUMERO_AQUI`) ou telefone pessoal exposto; Email (`mailto:`), Discord e Twitter/X funcionais.
- [x] **F1-03 — Assets otimizados:** `assets/` e `assets2/` consolidados em `assets/images/`; `frame-io.png` redimensionado (558 KB → 5 KB); foto de perfil renomeada (`carlos-malaman.png`); 0 requisições para `cdn.simpleicons.org`; 0 erros 404 na aba Network.
- [x] **F1-04 — CSS & Fontes:** `css/style.css` carregando sem `@import` duplicado; foco visível (`:focus-visible`) em botões e links; sem overflow horizontal em 375px e 1280px.
- [x] **F1-05 — Modularização JS (ES Modules):** site servido via HTTP local sem erros no Console; header scroll, botões prev/next desktop, menu mobile hambúrguer (incluindo `Escape` e overlay), reveal on scroll e smooth scroll funcionando normalmente.
- [x] **F1-06 — i18n nativo EN + persistência:** página abre em inglês nativo (sem flash PT→EN), alterna para PT e de volta para EN, preserva preferência em `localStorage` após reload (`F5`), preserva o link do desenvolvedor no rodapé e atualiza `aria-label`s e `#btn-topo-mobile`.
- [x] **F1-07 — Carrossel de Shorts:** duas faixas rolando suavemente sem erro `NaN`, sem travamento em resize, pausa no hover, suporte a drag (mouse/touch), botão de pausa acessível e pausa automática sob `prefers-reduced-motion: reduce`.
- [x] **F1-08 — Remoção de EmailJS:** nenhum script externo do EmailJS carregado; formulário antigo removido; contato direto funcional.

## Etapa 1C — Players Sob Demanda e Otimização de Carregamento

- [x] **F1C-01 — Zero players antecipados:** 0 `<iframe>` no DOM inicial e 0 requisições a players YouTube antes da interação do visitante.
- [x] **F1C-02 — Dados preservados e centralizados:** 6 vídeos horizontais e 4 Shorts originais preservados em `js/videos.data.js` (incluindo `start=199` em *Fiona & Cake* e `start=337` em *Roguelike*), no formato previsto para Firestore.
- [x] **F1C-03 — Validação segura de URLs:** `js/video-utils.js` rejeita protocolos não HTTPS, hosts fora da whitelist YouTube, IDs inválidos e HTML arbitrário.
- [x] **F1C-04 — Modal acessível sob demanda:** abre no clique/teclado em formato 16:9 (Portfólio) ou 9:16 (Shorts), trava foco (`Tab`/`Shift+Tab`), marca fundo como `inert`, fecha por botão/backdrop/`Escape`, remove o `<iframe>` imediatamente interrompendo reprodução e restaura foco ao gatilho de origem.
- [x] **F1C-05 — Carrossel sem duplicação de foco:** clones e repetições visuais com `aria-hidden="true"` e `tabindex="-1"` (apenas 4 controles acessíveis por teclado), preservando duas faixas, direções, arraste (sem abrir modal acidentalmente), pausa e `prefers-reduced-motion: reduce`.
- [x] **F1C-06 — Desempenho (antes × depois):** tempo de `load` reduzido de 5.388 ms para 356 ms (−93,4%), `iframeCount` de 26 para 0, `CLS = 0`, 0 erros no console e 0 erros 404 locais.

## Critérios Gerais do Projeto (CA-01 a CA-14 — Fases Futuras)

| ID | Critério | Fase Alvo | Status |
|---|---|---|---|
| CA-01 | Home legível em desktop e mobile, sem overflow horizontal | Fase 1 / 2 | Validado (F1/1C) |
| CA-02 | Carregamento rápido em rede lenta; sem iframes em massa | Fase 1C / 4 | Validado (F1C) |
| CA-03 | Autoplay bloqueado / `prefers-reduced-motion` com fallback | Fase 1 / 2 | Parcial (F1C; showreel na F2) |
| CA-04 | Portfólio com 6 vídeos migrados (título, duração, ferramentas) | Fase 1C / 3 | Parcial (6 vídeos migrados; metadados F2/F3) |
| CA-05 | Adicionar 7º vídeo via Admin sem alterar código | Fase 3 | Pendente |
| CA-06 | Publicar/ocultar e reordenar vídeos persistidos | Fase 3 | Pendente |
| CA-07 | Short vertical ampliado (mouse, teclado, Escape, foco) | Fase 1C | Validado (F1C) |
| CA-08 | Login inválido e usuário não autorizado bloqueados | Fase 3 | Pendente |
| CA-09 | Acesso anônimo ao Firestore restrito a `published == true` | Fase 3 | Pendente |
| CA-10 | Troca EN/PT consistente e persistida | Fase 1 | Validado (F1/1C) |
| CA-11 | Discord, e-mail e YTJobs válidos sem placeholders | Fase 1 / 2 | Parcial (F1; YTJobs na F2) |
| CA-12 | `/admin` funcional em acesso direto e refresh | Fase 3 / 5 | Pendente |
| CA-13 | Conteúdo de clientes somente com autorização | Fase 2 | Pendente |
| CA-14 | Isolamento entre Preview/Emulator e Produção | Fase 3 / 5 | Pendente |
