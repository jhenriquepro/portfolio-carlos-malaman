# Carlos Malaman — Portfolio V2

Portfólio profissional de edição de vídeos, Motion Design e Sound Design construído em **HTML5, CSS3 e JavaScript Vanilla (ES Modules)** com integração modular ao **Firebase (Authentication + Cloud Firestore)** e painel administrativo em `/admin`.

## Estrutura do Repositório

```text
.
├── firebase.json                     # Configuração de deploy de regras e emuladores
├── firestore.rules                   # Regras restritivas por UID em admins/{uid}
├── firestore.indexes.json            # Índices compostos da coleção videos
├── README.md
└── WebsiteIA/                        # Root Directory do site estático (Vercel)
    ├── index.html                    # Site público V2 (EN padrão / PT selecionável)
    ├── vercel.json                   # Rewrites (/admin) e headers de segurança
    ├── robots.txt                    # Bloqueio de indexação de /admin
    ├── admin/
    │   └── index.html                # Painel administrativo (/admin)
    ├── css/
    │   ├── style.css                 # Identidade visual pública V2 (Dark/Violet/Amber)
    │   └── admin.css                 # Estilos do painel administrativo
    ├── js/
    │   ├── main.js                   # Orquestração da página pública
    │   ├── config.js                 # Links, showreel opcional e clientes autorizados
    │   ├── firebase.config.js        # Configuração pública do Firebase Web App
    │   ├── firebase.js               # Inicialização sob demanda do SDK modular
    │   ├── videos.repository.js      # Consultas em tempo real, CRUD e import idempotente
    │   ├── videos.data.js            # Fallback local somente leitura (6 vídeos + 4 Shorts)
    │   ├── video-utils.js            # Whitelist e normalização segura de URLs
    │   ├── player.js                 # Modal acessível 16:9 / 9:16 sob demanda
    │   ├── portfolio.js              # Renderização dos projetos horizontais
    │   ├── shorts.js                 # Carrossel vertical de duas faixas
    │   ├── clients.js                # Seção opcional de canais autorizados
    │   ├── showreel.js               # Camada opcional de vídeo silencioso no Hero
    │   ├── navigation.js             # Header, menu mobile, timeline bar e reveal
    │   ├── i18n.js                   # Tradução EN/PT com persistência em localStorage
    │   └── admin/
    │       ├── admin.js              # Orquestração do painel /admin
    │       ├── auth.js               # Firebase Auth + validação admins/{uid}
    │       └── video-form.js         # Formulário, validação e prévia estática
    ├── assets/images/                # Imagens otimizadas (profile, flags, tools)
    ├── docs/
    │   ├── SETUP_E_OPERACAO.md       # Passo a passo de Firebase, UID, showreel e deploy
    │   ├── manual-admin.md           # Guia de uso do /admin para o editor
    │   ├── PLANO_IMPLEMENTACAO_MALAMAN.md
    │   └── requisitos.txt
    └── tests/
        ├── smoke-test.mjs            # Smoke tests automatizados (Node 22 + Chrome CDP)
        └── manual-checklist.md       # Roteiro de aceite manual
```

## Como Rodar Localmente

> Não abra `index.html` via `file://` (ES Modules exigem HTTP).

```bash
cd WebsiteIA
node tests/smoke-test.mjs --serve-only
```
Acesse:
- Público: `http://127.0.0.1:4173/`
- Admin: `http://127.0.0.1:4173/admin`

## Executar Smoke Tests Automatizados

```bash
cd WebsiteIA
node tests/smoke-test.mjs
```

## Documentação Operacional
- Setup Firebase, regras, UID, showreel, YTJobs e deploy: [WebsiteIA/docs/SETUP_E_OPERACAO.md](WebsiteIA/docs/SETUP_E_OPERACAO.md)
- Manual do editor (`/admin`): [WebsiteIA/docs/manual-admin.md](WebsiteIA/docs/manual-admin.md)
