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

## Critérios Gerais do Projeto (CA-01 a CA-14 — Fases Futuras)

| ID | Critério | Fase Alvo | Status |
|---|---|---|---|
| CA-01 | Home legível em desktop e mobile, sem overflow horizontal | Fase 1 / 2 | Em validação |
| CA-02 | Carregamento rápido em rede lenta; sem iframes em massa | Fase 1C / 4 | Pendente |
| CA-03 | Autoplay bloqueado / `prefers-reduced-motion` com fallback | Fase 1 / 2 | Parcial (F1) |
| CA-04 | Portfólio com 6 vídeos migrados (título, duração, ferramentas) | Fase 1C / 3 | Pendente |
| CA-05 | Adicionar 7º vídeo via Admin sem alterar código | Fase 3 | Pendente |
| CA-06 | Publicar/ocultar e reordenar vídeos persistidos | Fase 3 | Pendente |
| CA-07 | Short vertical ampliado (mouse, teclado, Escape, foco) | Fase 1C | Pendente |
| CA-08 | Login inválido e usuário não autorizado bloqueados | Fase 3 | Pendente |
| CA-09 | Acesso anônimo ao Firestore restrito a `published == true` | Fase 3 | Pendente |
| CA-10 | Troca EN/PT consistente e persistida | Fase 1 | Em validação |
| CA-11 | Discord, e-mail e YTJobs válidos sem placeholders | Fase 1 / 2 | Parcial (F1) |
| CA-12 | `/admin` funcional em acesso direto e refresh | Fase 3 / 5 | Pendente |
| CA-13 | Conteúdo de clientes somente com autorização | Fase 2 | Pendente |
| CA-14 | Isolamento entre Preview/Emulator e Produção | Fase 3 / 5 | Pendente |
