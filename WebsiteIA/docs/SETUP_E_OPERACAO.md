# Guia de Setup Externo, Segurança e Operação — Malaman Portfolio V2

Este guia descreve exatamente as ações externas necessárias para ativar o Firebase (autenticação + banco em tempo real), importar os vídeos iniciais e configurar recursos opcionais do site.

---

## 1. Configurar Firebase (Auth + Firestore)

### Passo 1 — Criar projeto e Web App
1. Acesse [Firebase Console](https://console.firebase.google.com/) e crie um projeto (ex.: `malaman-portfolio-prod`).
2. No painel do projeto, clique em **Adicionar app → Web (`</>`)** (não é obrigatório ativar Firebase Hosting).
3. Copie o objeto `firebaseConfig` público (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
4. Cole esses valores públicos em `WebsiteIA/js/firebase.config.js` dentro de `FIREBASE_CONFIG`.
   > **Importante:** essa configuração identifica o aplicativo cliente e **não é segredo administrativo**. Nunca coloque senhas, chaves privadas ou Service Account JSON no repositório.

### Passo 2 — Habilitar Authentication (E-mail/Senha) e criar o editor
1. No Firebase Console, vá em **Build → Authentication → Get started**.
2. Em **Sign-in method**, habilite apenas **Email/Password** (desabilite qualquer cadastro público).
3. Em **Users → Add user**, crie manualmente a conta de **Carlos Malaman** (e-mail e senha forte).
4. **Copie o `User UID`** gerado para essa conta.
5. Em **Authentication → Settings → Authorized domains**, garanta que constem `localhost`, `127.0.0.1` (para testes locais) e o domínio de produção (`carlos-malaman.vercel.app` e futuro domínio próprio).

### Passo 3 — Criar Firestore e publicar regras de segurança
1. Vá em **Build → Firestore Database → Create database** (modo **Production**).
2. Publique as regras versionadas na raiz do repositório (`firestore.rules`) e os índices (`firestore.indexes.json`):
   - **Via Firebase CLI (recomendado):**
     ```bash
     npm install -g firebase-tools
     firebase login
     firebase use --add   # selecione o projeto criado
     firebase deploy --only firestore:rules,firestore:indexes
     ```
   - **Ou manualmente no Console:** copie integralmente o conteúdo de `firestore.rules` para a aba **Firestore → Rules** e clique em **Publish**. Crie o índice composto na aba **Indexes** para a coleção `videos` (`published` Ascending + `sortOrder` Ascending).

### Passo 4 — Provisionar autorização do administrador (`admins/{UID}`)
1. Ainda em **Firestore Database → Data**, clique em **Start collection** com o ID `admins`.
2. Crie um documento cujo **Document ID** seja **exatamente o `User UID`** copiado no Passo 2.
3. Adicione um campo informativo simples, por exemplo:
   - `role` (`string`): `"editor"`
   - `active` (`boolean`): `true`
4. Salve. Como `firestore.rules` define `allow write: if false;` em `/admins/{uid}`, nenhum cliente consegue se autoautorizar.

### Passo 5 — Importar os 6 vídeos e 4 Shorts iniciais (1 clique, idempotente)
1. Abra `/admin` (localmente ou no Preview).
2. Faça login com o e-mail e a senha criados no Passo 2.
3. Clique em **"Import Initial Videos (6 + 4)"** (*Importar Vídeos Iniciais*).
   - A operação é **idempotente**: importa apenas vídeos ausentes usando IDs determinísticos e nunca duplica nem sobrescreve vídeos já cadastrados.
4. Abra `/` em outra aba e confirme que os vídeos publicados aparecem em tempo real.

---

## 2. Validar Segurança Real (obrigatório antes de produção)

Após publicar `firestore.rules` e provisionar `admins/{UID}`, execute os 4 testes abaixo:
1. **Visitante anônimo em `/`:** vê apenas vídeos com `published == true` (crie um vídeo como rascunho no `/admin` e confirme que ele não aparece em `/`).
2. **Usuário autenticado NÃO listado em `admins/{uid}`:** crie um usuário de teste secundário no Firebase Auth, faça login em `/admin` e confirme que a tela **Acesso Negado** aparece, nenhum rascunho é carregado e qualquer escrita é bloqueada com `permission-denied`. Depois remova o usuário de teste.
3. **Administrador autorizado:** cria, edita, reordena (↑/↓), marca destaque, oculta/publica e exclui vídeos; alterações refletem em `/` sem commit ou redeploy.
4. **Entrada maliciosa:** tentar salvar URL `javascript:alert(1)`, `http://...`, host fora da whitelist ou tag `<iframe>` deve ser recusado tanto pelo formulário quanto pelas regras do Firestore.

---

## 3. Ativar Recursos Opcionais (quando os materiais estiverem prontos)

### Showreel silencioso no Hero
1. Comprima o showreel em loop curto (idealmente 5–12s, sem faixa de áudio, ≤ 2–3 MB):
   - `WebsiteIA/assets/videos/showreel.webm`
   - `WebsiteIA/assets/videos/showreel.mp4`
   - `WebsiteIA/assets/images/showreel-poster.webp`
2. Em `WebsiteIA/js/config.js`, altere `SHOWREEL_CONFIG.enabled` para `true`.
   - O código respeita automaticamente `prefers-reduced-motion`, economia de dados (*Save-Data*) e conexões lentas, exibindo o pôster estático ou o fundo editorial como fallback.

### URL real do YTJobs
- Em `WebsiteIA/js/config.js`, preencha `EXTERNAL_LINKS.ytjobs = 'https://ytjobs.co/...'`.
- O botão secundário do Hero passa automaticamente de "Contact on Discord" para **"YTJobs Profile"**.

### Canais / Clientes Autorizados
- Em `WebsiteIA/js/config.js`, adicione objetos ao array `AUTHORIZED_CLIENTS` **somente com autorização expressa do cliente**:
  ```js
  export const AUTHORIZED_CLIENTS = Object.freeze([
      {
          name: 'Nome do Canal',
          role: 'YouTube Channel',
          url: 'https://www.youtube.com/@canal',
          logoUrl: 'assets/images/clients/canal.webp',
      },
  ]);
  ```
- Enquanto o array estiver vazio, a seção `#clientes` e seus links de navegação permanecem ocultos automaticamente.

### Convite do Discord
- Valide se `https://discord.com/invite/yGyrfG3A` é um link permanente (sem expiração). Caso expire, atualize em `WebsiteIA/js/config.js` e `WebsiteIA/index.html`.

---

## 4. Execução Local, Rotas e Deploy

### Rodar localmente (sem abrir via `file://`)
Na pasta `WebsiteIA/`, inicie um servidor estático com Node:
```bash
npx serve -s . -l 4173
```
Ou usando o script embutido sem instalar nada:
```bash
node tests/smoke-test.mjs --serve-only
```
Acesse:
- Site público: `http://127.0.0.1:4173/`
- Painel admin: `http://127.0.0.1:4173/admin` e `http://127.0.0.1:4173/admin/`

### Vercel e Hospedagem
- Mantenha o **Root Directory** na Vercel apontando para `WebsiteIA`.
- `WebsiteIA/vercel.json` garante que `/admin` e `/admin/` carreguem `/admin/index.html` com headers `X-Robots-Tag: noindex, nofollow` e `X-Frame-Options: DENY`.
- **Nota comercial:** o plano Hobby da Vercel restringe uso comercial; caso queira hospedagem gratuita com permissão comercial para site estático, avalie **Cloudflare Pages** apontando o diretório de saída para `WebsiteIA` (sem alterar o código).
- **Fluxo seguro de publicação:** revise a branch `feature/portfolio-v2-final` → abra Pull Request → valide na URL Preview → somente após aprovação faça merge na `main`.
