# MALAMAN PORTFOLIO — Especificação e Plano de Implementação

**Versão:** 1.0 — 22/11/2026  
**Status:** Arquitetura proposta; nenhuma alteração de código aprovada/executada  
**Referências:** `requisitos.txt`, `index(1).html`, `main(1).js`, `style.css` e respostas do responsável pelo projeto.  
**Ambiente atual informado:** https://carlos-malaman.vercel.app  
**Repositório identificado:** `jhenriquepro/portfolio-carlos-malaman` (branch `main`, público). Confirmar se o conteúdo do repositório corresponde aos arquivos anexados antes de alterar.

## 1. Visão e objetivos

Reformular o portfólio de Carlos Malaman para construir autoridade em edição de vídeos, Motion Design e Sound Design. Priorizar clientes internacionais (criadores, YouTubers, influenciadores e canais estabelecidos/em crescimento) e, secundariamente, clientes brasileiros de alto ticket. A proposta deve mostrar os trabalhos imediatamente, ressaltar storytelling e fluidez e facilitar o contato, sobretudo via Discord.

**Princípios:** HTML5 + CSS3 + JavaScript Vanilla (ES Modules); preservar recursos validados do site atual; evitar frameworks ou backend customizado sem necessidade; gestão de vídeos sem alterar código; segurança na camada de dados; versionamento GitHub; custos operacionais inicialmente mínimos.

## 2. Decisões confirmadas

| Tema | Decisão |
|---|---|
| Estratégia | Refatorar o projeto existente, sem reescrita integral imediata |
| Identidade | Dark, criativa e inspirada em cultura geek, evitando estética genérica de IA |
| Hero | Showreel único, em loop, sem som; CTA para portfólio e YTJobs |
| Portfólio | Começar com 6 vídeos, permitindo aumentar a quantidade |
| Shorts/Reels | Manter carrossel e vídeos verticais; sem separação por formato |
| Admin | `/admin` com login por e-mail/senha; um editor autorizado; editar somente vídeos |
| Contato | Discord prioritário e botão `mailto:` como alternativa; Twitter secundário |
| Credibilidade | Canais/clientes que possam ser citados com autorização |
| Idiomas | Inglês padrão, português secundário |
| Domínio | Ainda não adquirido |
| Publicação atual | Vercel (`carlos-malaman.vercel.app`); hospedagem definitiva sob avaliação |
| Linguagens | HTML, CSS e JavaScript puro; Firebase como serviço gerenciado |

**A decidir com materiais adicionais, sem bloquear a arquitetura:** URL real do YTJobs; showreel e imagem-pôster aprovados; canais/clientes e permissões de uso; links dos 6 vídeos iniciais, durações e ferramentas; 2–4 referências visuais; credenciais/UID do administrador (não registrar em documentação pública); provedor final de hospedagem.

## 3. Escopo funcional

### RF-01 a RF-11 — Site público

1. Home com identidade visual forte, imagem/área de apresentação do editor, frase curta e showreel de fundo em loop silencioso; ao bloquear autoplay ou reduzir movimento, mostrar pôster estático legível.
2. CTA primário Portfólio e segundo CTA YTJobs; se o URL do YTJobs não estiver definido, não publicar botão quebrado.
3. Preservar navegação por seções, botões de navegação anterior/próxima no desktop, menu mobile e troca de idioma.
4. Lista/grid de portfólio ordenado, inicialmente seis vídeos publicados; sem limite rígido no banco. Não agrupar projetos por categoria.
5. Cada cartão deve apresentar título, duração e ferramentas; permitir destaque visual de projetos. Sem descrições longas nem explicação do processo.
6. Mostrar uma capa leve por vídeo; incorporar/reproduzir somente após interação, em modal acessível ou interface ampliada. Se um vídeo não for incorporável, fornecer link externo seguro.
7. Shorts e Reels em carrossel responsivo e acessível, com vídeos verticais; permitir abrir ampliado. Preservar estética de carrossel/duas faixas se aprovado no redesenho.
8. Contato principal via Discord; e-mail através de `mailto:`; Twitter secundário. Remover formulário rico, anexos e dependência EmailJS no escopo atual.
9. Seção breve de credibilidade com canais/clientes autorizados; sem revelar contatos privados, métricas não verificadas ou materiais confidenciais.
10. Inglês como padrão, português selecionável e preferência preservada por sessão/localmente. Textos institucionais localizados; títulos originais de projetos podem permanecer no idioma do trabalho.
11. Metadados SEO básicos, links sociais de compartilhamento, ícones, sitemap/robots quando apropriado; não indexar `/admin`.

### RF-12 a RF-19 — Administração

12. Área estática separada em `/admin`, acessível por URL, mas com conteúdo administrativo condicionado a autenticação e autorização; a existência da página de login não é segredo.
13. Login por Firebase Authentication (email/senha) e logout. Usuário administrador provisionado manualmente, sem interface pública de cadastro.
14. Somente o UID de administrador provisionado pode criar, editar, remover, publicar, ocultar ou reordenar vídeos. Verificação obrigatória nas Firestore Security Rules; não confiar apenas em botão oculto ou em verificação JavaScript.
15. Cadastro com URL validada, plataforma suportada, tipo horizontal/vertical, título, duração, ferramentas, ordem e destaque.
16. Visualização prévia antes de publicar, feedback de erros/sucesso, confirmação para ações destrutivas, estados de carregamento e vazio.
17. Publicação/despublicação imediata após persistência no banco; visitas futuras devem refletir o conteúdo publicado, sem novo commit/deploy.
18. Reordenação persistida; itens de portfólio e Shorts têm ordenação independente, mesmo em uma única coleção.
19. Exclusão com confirmação; opcionalmente preferir ocultação para desfazer retiradas acidentais.

### Fora do escopo da versão 1

- Upload e hospedagem de vídeos brutos, edição de conteúdo audiovisual ou transcodificação.
- CMS geral para editar textos, cores, layouts ou identidade da marca.
- Pagamentos, orçamento automatizado, contas de clientes, caixa de mensagens ou CRM.
- Formulário de e-mail com armazenamento de leads.
- Modelagem 3D como serviço já prestado (planejamento futuro apenas).
- Analytics com coleta de dados pessoais sem decisão explícita posterior.

## 4. Requisitos não funcionais e critérios

**Desempenho:** Priorizar carregamento rápido da primeira dobra, evitar iframes no HTML inicial, carregar thumbnails sob demanda, usar `loading=lazy`, `decoding=async`, tamanhos explícitos de imagens e orçamento de peso para showreel. Medir LCP, CLS e INP em desktop e mobile com conexão simulada lenta. A meta de “1 segundo” é aspiracional e não pode ser garantida para todas as redes e vídeos.

**Acessibilidade:** HTML semântico, contraste adequado, foco visível, navegação por teclado, `aria-label` em controles sem texto, Escape para fechar modal, bloqueio de foco fora do modal, retorno de foco ao gatilho, carrossel pausável e `prefers-reduced-motion` respeitado.

**Segurança:** Firestore Security Rules com autorização por UID/claim de administrador, permissões mínimas, limites de tamanho/formato para campos, whitelist de plataformas/hosts, sem HTML arbitrário de embed, sem segredos privados no GitHub, cabeçalhos de segurança e verificação dos domínios autorizados no Firebase Auth. Não armazenar dados de contato de clientes; não expor canais ainda não publicados.

**Confiabilidade:** Mostrar estado de erro quando Firestore/YouTube estiver indisponível, manter layout utilizável com imagens estáticas e instrução para abrir vídeo externamente. Considerar fallback de dados publicados estáticos somente se houver processo seguro para mantê-lo coerente; não duplicar fontes de verdade na primeira versão.

**SEO:** Página inicial em inglês com título/description, Open Graph, URL canônica quando domínio final existir, imagens e textos rastreáveis. No MVP, seletor PT via JS satisfaz UX, mas **não cria automaticamente uma URL portuguesa indexável**. Se SEO bilíngue for prioritário, evoluir para URL `/pt/` com HTML próprio, conteúdos equivalentes e `hreflang` recíproco.

## 5. Arquitetura escolhida

```text
GitHub (código, assets, documentação, regras)
  └── Deploy estático (Cloudflare Pages preferencial / Vercel Pro alternativa)
       ├── /         Site público — HTML/CSS/JavaScript ES Modules
       │    ├── Carrega vídeos publicados do Firestore
       │    └── Mostra capas; player embutido somente sob demanda
       └── /admin    HTML/CSS/JavaScript ES Modules
            ├── Firebase Authentication — e-mail e senha
            └── Firestore — alterações protegidas por regras de segurança

YouTube (principal) e outras plataformas permitidas
  └── Hospedagem e reprodução do conteúdo audiovisual
```

**Hospedagem:** Embora a implantação atual esteja na Vercel, não presumir que o plano Hobby permita uso comercial: a própria Vercel restringe Hobby a projetos não comerciais. Avaliar Cloudflare Pages para hospedagem gratuita comercial de site estático; se desejar manter Vercel, comparar o custo Pro vigente. A mudança de hospedagem **não exige alterar as linguagens**.

**Showreel:** Como wallpaper silencioso, preferir arquivo de vídeo curto, comprimido, otimizado e com pôster local/estático, desde que haja autorização e que seu tamanho seja adequado. Não usar um conjunto de iframes pesados para simular vídeo de fundo. O showreel e seus arquivos são parte do design e **não entram inicialmente na edição pelo `/admin`**. Se futuramente o editor exigir trocar showreel sem deploy, ampliar o escopo e avaliar armazenamento externo com custos/quotas.

**Plataformas:** Aceitar YouTube como integração principal de lançamento. Registrar arquitetura extensível para Instagram/TikTok, implementando adaptadores específicos, casos em que embeds são limitados e fallback para link externo. Não aceitar tags `iframe` arbitrárias fornecidas pelo administrador.

## 6. Estrutura exata de pastas proposta

```text
portfolio-carlos-malaman/
├── index.html                 # Página pública; sem conteúdo de vídeo fixo
├── admin/
│   └── index.html             # Tela de login e painel admin no mesmo endpoint
├── css/
│   ├── style.css              # Base atual refatorada: tokens, layout e componentes públicos
│   └── admin.css              # Estilos próprios da área administrativa
├── js/
│   ├── main.js                # Inicialização da experiência pública
│   ├── firebase.js            # Inicialização única dos SDKs Firebase utilizados
│   ├── config.js              # Constantes não sensíveis e plataformas aceitas
│   ├── i18n.js                # Textos EN/PT e persistência do idioma
│   ├── navigation.js          # Cabeçalho, menu mobile e navegação por seções
│   ├── videos.repository.js   # Consultas e operações Firestore (camada de dados)
│   ├── video-utils.js        # Normalização de URLs, IDs, duração e validações
│   ├── player.js              # Criação/remoção de players e modal acessível
│   ├── portfolio.js           # Renderização dos cartões horizontais
│   ├── shorts.js              # Renderização do carrossel vertical
│   └── admin/
│       ├── admin.js           # Orquestração de tela e estados do painel
│       ├── auth.js            # Login, logout e verificação de sessão/autorização
│       └── video-form.js      # Cadastro/edição/preview/publicação de vídeos
├── assets/
│   ├── images/                # Fotos, logos, bandeiras, ícones e pôsteres
│   └── videos/                # Showreel otimizado (caso caiba no orçamento de peso)
├── docs/
│   ├── requirements.md        # Requisitos consolidados, com versionamento
│   ├── architecture.md        # Arquitetura, decisões e fluxos de dados
│   └── manual-admin.md        # Instruções para Carlos usar o painel
├── tests/
│   └── manual-checklist.md    # Roteiro de aceite, segurança e responsividade
├── firestore.rules           # Regras de leitura e escrita, versionadas
├── firebase.json             # Configuração de deploy das regras, sem hosting obrigatório
├── .gitignore                # Arquivos locais, ambientes e segredos
├── README.md                 # Setup, deploy e estrutura do projeto
└── _redirects OU vercel.json  # Apenas o arquivo correspondente ao provedor escolhido
```

**Importante:** A estrutura é proposta, não deve ser aplicada antes de inspecionar a árvore real do repositório, caminhos de `assets`, scripts e ajustes da plataforma atual. Evitar multiplicar arquivos adicionais sem responsabilidade definida. Manter `style.css`, `main.js` e `index.html` como pontos de entrada reconhecíveis.

**Dependências:** JavaScript ES Modules sem bundler obrigatório; Firebase SDK web modular; fontes atuais Raleway e Roboto. Para desenvolvimento local, usar servidor estático (não abrir via `file://`). Opcional: linters e formatadores instalados só como ferramentas de desenvolvimento, sem linguagem adicional no código do site.

## 7. Contrato de dados do Firestore (conceitual; sem código)

Coleção única `videos`, com um documento por vídeo:

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | Document ID | Gerado pelo Firestore |
| `type` | enum | `portfolio` ou `short` |
| `platform` | enum | `youtube` no MVP; adaptar para `instagram`/`tiktok` posteriormente |
| `sourceUrl` | string | URL original validada; sem HTML livre |
| `externalId` | string | ID validado do YouTube, se aplicável |
| `title` | string | Título do projeto; opcionalmente `titleEn` e `titlePt` |
| `durationSeconds` | integer/null | Pode ser informada manualmente; não depender da YouTube API |
| `tools` | string[] | Ferramentas utilizadas (lista pequena e validada) |
| `featured` | boolean | Destaque visual |
| `sortOrder` | integer | Ordem estável por seção |
| `published` | boolean | Visível no site público apenas se `true` |
| `startSeconds` | integer | Opcional; preserva links com `start=` atuais |
| `updatedAt` | timestamp | Controle interno administrativo |

**Consultas:** site público consulta somente `published == true`, classificando por `type` e ordem definida (índices se necessários). Admin autenticado lê todos os documentos. Não usar `published=false` como simples filtro de interface quando o dado não deve ser lido publicamente.

**Autorização:** regras Firestore devem verificar um UID de administrador controlado fora do navegador (ou custom claim provisionada por operador confiável) e validar tipos, limites e campos de cada escrita. Configuração Firebase Web (projectId, apiKey de cliente) não é credencial administrativa; nunca publicar chave privada, service account, tokens ou senhas. No frontend, sessão apenas controla a UI; as regras são a defesa obrigatória.

**Bootstrap seguro:** criar a conta do editor manualmente no Firebase Authentication; registrar o UID autorizado nas regras; realizar deploy das regras com permissões estritas; testar escrita legítima e tentativas de escrita anônima/com outro usuário antes de publicar o painel. Não disponibilizar cadastro público. Considerar recuperação de senha e proteção contra abusos de autenticação.

## 8. Fluxos de dados e navegação

### Visitante
1. GET `/` entrega HTML/CSS/JS e pôster leve do showreel.
2. `main.js` inicia menu/idioma; `videos.repository.js` consulta somente registros publicados.
3. `portfolio.js` monta cartões do tipo horizontal e `shorts.js` monta o carrossel de verticais.
4. Clique em cartão chama `player.js`, que monta player permitido; Escape/fechar remove player e devolve o foco.
5. Clique em Discord ou e-mail abre serviço externo, sem salvar dados pessoais no site.

### Administrador
1. GET `/admin` resolve página estática do painel/login.
2. `auth.js` observa estado autenticado e verifica autorização definida na arquitetura.
3. Sem sessão: apresenta login. Com sessão autorizada: `admin.js` solicita todos os vídeos.
4. Cadastro/edição: `video-form.js` valida a URL e metadados, apresenta prévia e solicita gravação ao repositório.
5. Firestore aplica suas regras; UI apresenta erro/sucesso. Publicação aparece para visitantes mediante nova consulta/atualização.
6. Logout encerra sessão e remove os dados administrativos da interface.

## 9. Estratégia de refatoração sem interromper o site

**Etapa 0 — Inventário e preservação**
- Confirmar conteúdo/branch do GitHub versus anexos e implantação Vercel. Verificar onde os arquivos reais estão (`estilos/style.css`, `js/main.js`, `assets/`, `assets2/`).
- Criar `backup/pre-refactor` como branch ou tag do último estado funcional; não alterar `main` diretamente.
- Registrar lista de vídeos existentes, links, parâmetros `start=`, conteúdo traduzido e recursos.
- Levantar prints desktop/mobile e erros de console antes de começar.
- Validar que nenhum token privado está no repositório ou histórico Git; caso exista, revogar/rotacionar.

**Etapa 1 — Organização e diagnóstico**
- Corrigir HTML estruturalmente inválido (incluindo links aninhados de redes sociais).
- Consolidar pastas/caminhos de assets e remover links incompletos, especialmente WhatsApp placeholder.
- Separar JS em módulos e CSS público/admin sem alterar primeiro o comportamento visual.
- Remover código morto de players HTML5 que não corresponde aos iframes YouTube atuais e trechos do formulário antigo.
- Fazer commit pequeno e testável.

**Etapa 2 — Design do site público**
- Elaborar wireframes desktop/mobile e aprovar referências de dark/geek/criativo.
- Preservar Raleway/Roboto; adaptar a paleta atual ou redefinir tokens com aprovação.
- Hero com showreel comprimido e pôster; CTAs Portfólio e YTJobs (URL validada).
- Portfolio com imagem de capa e reprodução sob demanda; Shorts acessível, pausa/arraste/teclado.
- Seção de clientes/canais autorizados; contato Discord + mailto + Twitter secundário.

**Etapa 3 — Firebase e painel administrativo**
- Criar/selecionar projeto Firebase para produção; habilitar e-mail/senha e Firestore.
- Provisionar manualmente a identidade única do editor; configurar e testar regras antes do deploy público.
- Implementar módulos de dados, validação de URLs e renderização dinâmica.
- Montar `/admin` responsivo com login, listagem, cadastro, edição, exclusão com confirmação, ordenação, destaque, publicação/ocultação e prévia.
- Migrar os seis vídeos existentes para `videos`, respeitando ordem, títulos e tempos iniciais.
- Validar que um segundo usuário ou anônimo não consegue ler rascunhos nem escrever dados.

**Etapa 4 — Qualidade, SEO e segurança**
- Testar desktop/mobile em tamanhos diferentes, keyboard-only, leitores de tela, abas, modais e `prefers-reduced-motion`.
- Testar Firestore offline/indisponível; URL maliciosa, ID inválido, embed bloqueado, dados ausentes e links externos.
- Lighthouse/DevTools em conexões limitadas; evitar autoload de múltiplos players e clones pesados.
- Verificar texto de todas as seções em EN/PT e persistência da escolha.
- Configurar SEO inicial e `noindex` na página administrativa; bloquear indexação não equivale a autenticação.
- Revisar conteúdo publicado, direitos de exibição dos clientes e privacidade.

**Etapa 5 — Deploy e entrega**
- Escolher Cloudflare Pages gratuito (preferência, sujeito à confirmação de condições do provedor) ou Vercel Pro.
- Conectar GitHub: PR de feature → URL Preview → validação → merge em `main` → produção.
- Separar banco/configuração de preview e produção ou usar emulador, para não editar dados reais durante testes.
- Validar rota `/admin` em acesso direto e refresh. Configurar `vercel.json` ou `_redirects` apenas quando necessário.
- Registrar procedimentos de rollback (reverter merge/deploy) e recuperação de conta administradora.
- Produzir `manual-admin.md` para Carlos com instruções passo a passo.

## 10. Versionamento GitHub e critérios de aprovação

- Repositório principal: `jhenriquepro/portfolio-carlos-malaman`; confirmar se a árvore atual corresponde aos arquivos da conversa. O repositório encontrado está público: nunca incluir secrets.
- Branch `main`: código de produção. Criar branches `feature/...`, `refactor/...`, `fix/...` para alterações; branch `develop` é opcional, não essencial neste escopo.
- Fluxo: abrir issue/tarefa → branch → commits pequenos → Pull Request com descrição e checklist → preview → revisão → merge.
- Não fazer commits diretos na `main`; cada etapa deve manter site acessível. Não executar operações de GitHub sem revisão e autorização explícita.
- Antes de mudanças maiores, salvar tag de referência, por exemplo `v0-antes-refatoracao`; depois da aprovação, `v1.0.0`.
- Artefatos documentais versionados em `/docs` e `/tests`.

## 11. Critérios de aceite / testes mínimos

| ID | Teste de aceitação | Resultado necessário |
|---|---|---|
| CA-01 | Abrir Home em desktop e smartphone | Conteúdo legível, sem overflow horizontal |
| CA-02 | Primeiro carregamento com rede lenta | Pôster aparece e layout permanece utilizável; iframes não carregam em massa |
| CA-03 | Autoplay desabilitado/reduced motion | Sem vídeo obrigatório; pôster de fallback |
| CA-04 | Portfólio com seis vídeos de migração | Ordem, títulos, duração e ferramentas corretos |
| CA-05 | Adicionar 7º vídeo no Admin | Publicação sem alterar código/deploy |
| CA-06 | Publicar/ocultar e reordenar vídeos | Visitante vê somente itens publicados na ordem definida |
| CA-07 | Short vertical ampliado | Player abre/fecha com mouse, teclado e Escape |
| CA-08 | Login incorreto e usuário não autorizado | Nenhuma leitura de rascunhos nem escrita permitida |
| CA-09 | Acesso anônimo direto ao Firestore | Escrita negada; leitura restrita a vídeos públicos |
| CA-10 | Troca EN/PT e retorno ao site | Conteúdo consistente e preferência preservada |
| CA-11 | Discord, e-mail e YTJobs | Links corretos, sem placeholders ou quebrados |
| CA-12 | Acessar `/admin` diretamente e atualizar navegador | Rota funcional, sessão tratada corretamente |
| CA-13 | Conteúdo de cliente | Publicar somente nomes/marcas com autorização |
| CA-14 | Deploy em Preview e Produção | Dados de teste não afetam conteúdo real |

## 12. Custos e expansão

**Inicialmente gratuitos, sujeitos a cotas e políticas:** GitHub, Firebase Authentication e Cloud Firestore em uso pequeno; Cloudflare Pages para site estático; YouTube hospedando os vídeos. Não solicitar compra de domínio para iniciar o desenvolvimento.

**Possíveis gastos posteriores:** domínio próprio e renovação anual; e-mail profissional (caso a marca queira endereços no domínio); Vercel Pro se permanecer na plataforma atual; hospedagem de vídeo especializada ou CDN caso o showreel exija; analytics/monitoramento pagos se o tráfego justificar. Não contratar essas soluções antecipadamente.

**Nota Vercel:** o plano Hobby limita o uso a projetos pessoais/não comerciais; considerar o portfólio de captação de clientes como potencial uso comercial e validar termos com o provedor.

## 13. Questões residuais a solucionar na execução

1. Receber o endereço validado do perfil YTJobs.
2. Receber 6 vídeos escolhidos com duração, ferramentas e prioridades, mais Shorts definitivos.
3. Receber o showreel otimizado ou material a converter para papel de parede.
4. Identificar canais/clientes que autorizam citação e eventual uso de marcas/logos.
5. Receber referências visuais e aprovar wireframes antes do redesenho.
6. Confirmar estado do repositório GitHub e vinculação ao projeto Vercel, além de quem administra contas Firebase e hospedagem.
7. Selecionar provedor final; definir se a tradução portuguesa precisa de SEO indexável desde a primeira versão.

## 14. Instrução de trabalho para agente executor

**Você é o agente implementador. Não reescreva tudo de uma vez e não introduza frameworks sem aprovação.**

1. Leia `docs/requirements.md`, `docs/architecture.md`, `tests/manual-checklist.md` e o código atual.
2. Compare o estado real do repositório com o inventário; reporte divergências antes de alterar.
3. Execute a Etapa 0 e apresente plano/PR da Etapa 1, com arquivos impactados e critérios de aceite.
4. Mantenha o site publicado operante. Trabalhe em branch de tarefa; não altere `main` diretamente.
5. Faça entregas incrementais e valide comportamento existente antes de implementar novas funcionalidades.
6. Configure e teste regras de segurança Firestore **antes** de expor operações administrativas.
7. Não inclua senhas, contas de serviço ou tokens privados no GitHub. Não copie dados privados de clientes.
8. Ao final de cada etapa, informe alterações, testes, riscos e próximos passos; aguarde aprovação para promover à produção.

---

**Referências oficiais consultadas em 22/11/2026:**
- Vercel, Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel, Git deployments e Preview: https://vercel.com/docs/git
- Firebase, Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase, Pricing: https://firebase.google.com/pricing
- Google Search Central, páginas localizadas: https://developers.google.com/search/docs/specialty/international/localized-versions
