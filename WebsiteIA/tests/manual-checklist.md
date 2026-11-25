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

## Entrega V2 — Redesign Visual, Firebase, `/admin`, Rotas e QA

- [x] **V2-01 — Identidade visual Dark/Violeta/Âmbar:** Hero editorial sem estética de IA, serviços (Edição de Vídeo, Motion Design, Sound Design), sem 3D, sem clientes ou depoimentos inventados, timeline segmentada desktop com controles prev/next integrados.
- [x] **V2-02 — Fallbacks limpos:** Showreel opcional (`SHOWREEL_CONFIG.enabled = false`), YTJobs oculto (`display: none`) enquanto `ytjobs == null`, seção `#clientes` oculta enquanto `AUTHORIZED_CLIENTS` vazio.
- [x] **V2-03 — Desempenho preservado na V2:** `load = 588 ms`, `FCP = 564 ms`, `LCP = 564 ms`, `CLS = 0.0004`, `0` iframes iniciais, `0` requisições a player YouTube no load inicial, `0` erros 404 e `0` erros no console.
- [x] **V2-04 — Responsividade multi-viewport:** sem overflow horizontal em `1440×900`, `1280×800`, `768×1024`, `390×844` e `375×812`.
- [x] **V2-05 — Painel `/admin` e rotas:** `/admin` e `/admin/` acessíveis com `noindex, nofollow`, estado `Setup Required` funcional sem login simulado, troca EN/PT funcional e bug de especificidade `[hidden]` corrigido e revalidado visualmente.
- [x] **V2-06 — Smoke tests reproduzíveis:** `node tests/smoke-test.mjs` executando verificações unitárias, segurança de URLs e navegador real Chrome CDP.
- [ ] **V2-07 — Validação em Firebase real (pendente credenciais externas):** testar login real, negação de UID não autorizado em `admins/{uid}`, publicação/ocultação/reordenação em tempo real, importação idempotente (6+4) e bloqueio de escrita anônima contra o Firestore real após configurar `js/firebase.config.js` e publicar `firestore.rules`.

## Critérios Gerais do Projeto (CA-01 a CA-14)

| ID | Critério | Fase Alvo | Status |
|---|---|---|---|
| CA-01 | Home legível em desktop e mobile, sem overflow horizontal | V2 | Validado (1440/1280/768/390/375px) |
| CA-02 | Carregamento rápido; sem iframes em massa | V2 | Validado (`0` iframes, `load 588ms`) |
| CA-03 | Autoplay bloqueado / `prefers-reduced-motion` com fallback | V2 | Validado (carrossel + código showreel) |
| CA-04 | Portfólio com 6 vídeos migrados (suporte a duração/ferramentas/destaque) | V2 | Validado em fallback; migração Firestore pronta |
| CA-05 | Adicionar 7º vídeo via Admin sem alterar código | Firebase Real | Implementado; pendente projeto Firebase |
| CA-06 | Publicar/ocultar e reordenar vídeos persistidos | Firebase Real | Implementado; pendente projeto Firebase |
| CA-07 | Short vertical ampliado (mouse, teclado, Escape, foco) | V2 | Validado |
| CA-08 | Login inválido e usuário não autorizado bloqueados | Firebase Real | Implementado (`admins/{uid}`); pendente teste real |
| CA-09 | Acesso anônimo ao Firestore restrito a `published == true` | Firebase Real | Regras criadas (`firestore.rules`); pendente teste real |
| CA-10 | Troca EN/PT consistente e persistida | V2 | Validado (`/` e `/admin`) |
| CA-11 | Discord, e-mail e YTJobs válidos sem placeholders | V2 | Validado (YTJobs condicional oculto) |
| CA-12 | `/admin` funcional em acesso direto e refresh | V2 | Validado local + `vercel.json` pronto |
| CA-13 | Conteúdo de clientes somente com autorização | V2 | Validado (seção oculta até autorização) |
| CA-14 | Isolamento entre Preview/Emulator e Produção | Deploy | Suporte Emulator pronto; `main` preservada |
