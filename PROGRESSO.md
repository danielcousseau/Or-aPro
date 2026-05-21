# Progresso do Desenvolvimento — OrçaPro

> Este arquivo é atualizado ao final de cada sessão de desenvolvimento com o Claude Code.
> Serve como histórico permanente do que foi feito e do que está pendente.

---

## Estado Atual do Projeto (2026-05-20) — atualizado sessão 9

- **Frontend:** React + Vite + PWA → Vercel
- **Backend:** Node.js + Express + Prisma → Render
- **Banco:** PostgreSQL → Neon.tech (multi-tenant / SaaS)
- **Status:** Funcional em produção

---

## Sessão 9 — 2026-05-20

### Infraestrutura
- **`prisma db push`** — aplicou índices (`@@index([userId])`, `@@index([status])`) e tabela `AuditLog` no banco via direct URL
- **`directUrl`** adicionado ao `schema.prisma` — resolve erro P1001 ao rodar migrations locais com pooler URL
- **CI/CD — GitHub Actions** (`.github/workflows/ci.yml`): roda `npm test` a cada push na main; Node.js 22 (LTS); secrets `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` configurados no GitHub
- **Fix helpers de teste** — `limparUsuarioTeste` agora deleta `AuditLog` antes do `User` (FK constraint)

### Segurança / Frontend
- **CSP no Vercel** (`vercel.json`): `Content-Security-Policy` + `X-Content-Type-Options` + `Referrer-Policy` + `Permissions-Policy`; iterações para liberar `unsafe-eval` (html2pdf), Google Fonts e `*.cloudflare.com` (Turnstile)
- **Cloudflare Turnstile** — chaves reais configuradas (`VITE_TURNSTILE_SITE_KEY` no Vercel, `TURNSTILE_SECRET_KEY` no Render); domínio corrigido para `orca-pro-seven.vercel.app`
- **Fix overflow valor proposta** — `fontSize: clamp(1.4rem, 6vw, 2.5rem)` em `Proposta.jsx` (Redmi 12C)
- **Fix PDF folha em branco** — `pagebreak: { mode: 'avoid-all' }`, `scrollY: 0` e remoção de `min-height: 29.7cm` em `ImprimirOrcamento.jsx`
- **Busca no Kanban** — campo de busca por título e cliente no Quadro de Produção

### Feature — Notificações Telegram (em progresso, não commitado)
- Bot criado via @BotFather
- `backend/src/services/telegram.js`: `enviarMensagem`, `notificarMudancaStatus`, `buscarPendentes`
- `telegramChatId String?` adicionado ao modelo `Cliente` no schema + `prisma db push`
- `OrcamentoController.atualizarStatus` dispara notificação automática ao mudar status
- `GET /api/telegram/pendentes` — endpoint para o marceneiro buscar chat_ids dos clientes
- `Clientes.jsx` — campo "Chat ID do Telegram" + indicador visual no card

---

## Sessão 8 — 2026-05-20

### Unidade de Medida — select + Outros (Materiais.jsx)
- Campo "Unidade de Medida" substituído de `<input>` + `<datalist>` por `<select>` com 10 opções padrão: Chapa, Unidade, Metro, Metro Linear, Metro Quadrado, Caixa, Par, Rolo, Litro, Kg
- Opção **"Outros..."** exibe campo de texto livre — mesmo padrão já usado na Categoria
- Edição detecta automaticamente unidade customizada e abre no modo Outros com valor preenchido

### Fix autenticação Safari/iOS — Bearer token
- **Causa raiz:** Safari bloqueia cookies cross-domain via ITP (Intelligent Tracking Prevention). Frontend em `vercel.app` + backend em `render.com` = domínios diferentes = cookies `SameSite=none` ignorados pelo Safari iOS. Resultado: usuário logava, cookies não eram salvos, primeira chamada à API retornava 401 e o sistema redirecionava para login
- **Solução:** access token armazenado em memória JS (variável de módulo em `api.js`) e enviado via header `Authorization: Bearer`. Refresh token armazenado no `localStorage` e enviado no body do `/refresh`
- `auth.js` (middleware): lê token do header `Authorization: Bearer` primeiro, fallback para cookie — retrocompatível com browsers que aceitam cookies cross-site
- `AuthController.login`: retorna `accessToken` e `refreshToken` também no body da resposta (além dos cookies)
- `AuthController.refresh`: aceita `refreshToken` do body além do cookie
- `api.js`: interceptor de request injeta o header; lógica de refresh atualizada para ler/salvar do `localStorage`
- `Login.jsx`: salva tokens após login bem-sucedido
- `App.jsx`: limpa `@OrcaPro:refreshToken` do localStorage no logout

### Audit Log — histórico de atividade
- **Tabela `AuditLog`** adicionada ao `schema.prisma` (userId, ação, recurso, recursoId, detalhe, criadoEm) com índices em `userId` e `criadoEm`
- **`isAdmin`** adicionado ao model `User` (`Boolean @default(false)`)
- **`services/audit.js`**: helper `registrar()` fire-and-forget — falha silenciosamente sem afetar a resposta
- **Eventos registrados:** login, criar/atualizar/excluir de Cliente, Material e Orçamento, atualizarStatus de Orçamento
- **`GET /api/audit-log`**: 100 últimos logs do próprio usuário (autenticado)
- **`GET /api/audit-log/admin`**: 500 logs de todos os usuários (requer `isAdmin = true`)
- **`middlewares/adminAuth.js`**: verifica flag `isAdmin` antes de liberar rotas admin
- **`Perfil.jsx`**: card "Histórico de Atividade" com badges coloridos por ação (verde = criou, azul = atualizou, roxo = status, vermelho = excluiu, amarelo = login)
- **`Admin.jsx`**: página `/admin` com filtro por usuário e por recurso, rota adicionada no `App.jsx`
- **Para virar admin:** `UPDATE "User" SET "isAdmin" = true WHERE usuario = 'seu_usuario';` direto no banco
- **Pendente migration:** `cd OrcaPro/backend && npx prisma migrate dev --name add_audit_log`

---

## Sessão 7 — 2026-05-20

### PDF Download
- Botão **"Baixar PDF"** adicionado em `ImprimirOrcamento.jsx` e `Proposta.jsx` usando `html2pdf.js` (gera o arquivo direto, sem dialog do browser)
- `html2pdf.js` adicionado ao `frontend/package.json` — **pendente `npm install` no PC de casa**

### Captcha — Cloudflare Turnstile
- Widget Turnstile adicionado em `Cadastro.jsx` (`@marsidev/react-turnstile`)
- Backend verifica token na API do Cloudflare em `AuthController.register`; em dev (sem `TURNSTILE_SECRET_KEY`) a verificação é pulada automaticamente
- `@marsidev/react-turnstile` adicionado ao `frontend/package.json` — **pendente `npm install` no PC de casa**
- **Pendente configuração de chaves:**
  - Vercel: `VITE_TURNSTILE_SITE_KEY=<chave_pública>` (criar site em dash.cloudflare.com → Turnstile → domínio orca-pro.vercel.app)
  - Render: `TURNSTILE_SECRET_KEY=<chave_secreta>`

### Testes — Jest + Supertest
- `backend/src/app.js` criado: Express app extraído do `server.js` para permitir import nos testes sem subir o servidor
- `server.js` simplificado: apenas carrega env e chama `app.listen()`
- Rate limiters desativados automaticamente quando `NODE_ENV=test`
- `backend/jest.config.js`, `__tests__/setup.js`, `__tests__/helpers.js` criados
- `__tests__/auth.test.js`: testa registro, login válido/inválido, /api/me com e sem cookie
- `__tests__/crossTenant.test.js`: testa que usuário B não lê/edita/exclui dados do usuário A (clientes e materiais)
- `jest` e `supertest` adicionados ao `backend/package.json` — **pendente `npm install` no PC de casa**
- Para rodar: `cd OrcaPro/backend && npm test`

### Índices no banco
- `@@index([userId])` adicionado em `Cliente`, `Material` e `Orcamento` no `schema.prisma`
- `@@index([status])` adicionado em `Orcamento`
- **Pendente migration:** `cd OrcaPro/backend && npx prisma migrate dev --name add_indexes`

### Fix materiais padrão (usuários existentes)
- `MaterialController.listar`: lazy init agora compara por nome em vez de checar `length === 0` — injeta só os padrões que faltam, sem sobrescrever materiais customizados

---

## Sessão 6 — 2026-05-20

### Dashboard
- **Gráfico de Ambiente** convertido para barras horizontais com altura dinâmica (48px/ambiente, mín. 200px), ordenado do mais ao menos frequente — escala melhor com muitos ambientes
- **Overflow corrigido** em `dashboard-grid-2`: adicionado `min-width: 0; overflow: hidden` nos filhos do grid
- **Status "analise" unificado com "Aguardando"** em todo o sistema: `Dashboard.jsx` (pendentes + gráfico de status) e `Historico.jsx` (badge) normalizam o valor legado
- `schema.prisma`: default do campo `status` alterado de `"analise"` para `"Aguardando"`
- Migration `20260520000000_fix_status_default`: altera o DEFAULT no banco e converte registros antigos via `UPDATE`

### Campos padronizados (select + Outros)
- **Ambiente** (`DadosGerais.jsx`): substituído `<input type="text">` por `<select>` com 9 opções padrão (Cozinha, Quarto, Sala, Banheiro, Escritório, Lavanderia, Varanda, Área de Serviço, Garagem) + "Outros..." com campo de texto livre. Valores antigos fora da lista são detectados automaticamente e abrem no modo "Outros"
- **Forma de Pagamento** (`ResumoValores.jsx`): substituído `<input list="datalist">` por `<select>` com 5 opções padrão + opções extras do banco de dados (sem duplicatas) + "Outros..." com campo de texto
- **Categoria de Material** (`Materiais.jsx`): mesmo padrão, com categorias Chapas / Fixação / Ferragens / Acabamento + "Outros..."

### Precificação
- **Placeholder dinâmico**: campo de valor da Mão de Obra e do Lucro agora exibe sugestão contextual conforme o tipo selecionado (`Ex: 15 (%)`, `R$ 0,00`, `Ex: 1.5 (×)`, `R$ 0,00 / dia`, etc.)

### UX — Pequenos fixes
- **Hover do toggle de materiais** (`Historico.jsx`): botão recebia `transform + box-shadow + filter` do `button:hover` global. Adicionada classe `.btn-ghost` no CSS que neutraliza esses efeitos para botões sem estilo visual

### Materiais padrão de marcenaria
- **31 materiais** criados com categorias e preços de mercado: MDF 18mm (branco/cor/amadeirado), Fundo 6mm, 9 parafusos, 3 dobradiças, 8 corrediças (20–55cm), Sapata, 4 lâminas de borda e Cola
- `materiaisPadrao.js`: lista única exportada em `backend/src/constants/`, compartilhada entre seed e AuthController
- **Lazy init** em `MaterialController.listar`: na primeira chamada com lista vazia, cria os materiais padrão automaticamente para aquele usuário — sem overhead no startup, funciona para usuários existentes e novos
- **Novo registro** (`AuthController.register`): materiais padrão criados imediatamente ao criar conta

---

## Sessão 5 — 2026-05-20

### Bugs corrigidos

- **Avatar de outro usuário aparecendo em conta nova** (`Login.jsx`): ao fazer login, dispara o evento `avatarAtualizado` com o avatar do usuário recém-autenticado. Sem isso, o estado React do `LayoutSistema` ficava com o avatar da sessão anterior quando a troca de conta ocorria sem reload de página.

- **Avatar não carregava instantaneamente** (`App.jsx` + `Perfil.jsx`): `avatarUrl` passou a ser inicializado com lazy initializer lendo direto do `localStorage` (instantâneo), em vez de `null` + esperar `api.get('/me')`. `Perfil.jsx` atualizado para persistir o avatar no `localStorage` ao trocar ou remover a foto, mantendo a sincronia.

- **Quantidade de dias/horas resetava para 1 ao salvar** (`orcamentoSchema.js`): `maoDeObraQtde` e `lucroQtde` não estavam declarados no schema Zod. O `parseAsync` descartava esses campos (comportamento padrão do Zod com campos desconhecidos), fazendo o Prisma usar o `@default(1)` do banco em todo save/update. Ambos os campos adicionados ao schema.

### Melhoria — Histórico de Orçamentos (`Historico.jsx`)

- Materiais do orçamento agora exibidos via toggle "ver materiais" nos cards do histórico
- Chevron SVG com rotação suave (0.2s) indica aberto/fechado; sem artefatos de renderização
- Lista exibe: quantidade × nome — valor unitário de cada item
- Estado de abertura por `Set` de IDs: cada card expande/recolhe independentemente

---

## Sessão 3 — 2026-05-19

### Infraestrutura / Produção
- Env vars configuradas no Render: `NODE_ENV`, `FRONTEND_URL`, `VITE_API_URL`, `SMTP_*`, `EMAIL_FROM`, `BREVO_API_KEY`
- **SMTP → Brevo HTTP API:** Render bloqueia porta 587. `emailService.js` reescrito para usar `fetch` nativo na API REST do Brevo. Nodemailer removido.

### Features
- Campo de nome editável no `Perfil.jsx`
- Campo de e-mail no cadastro (`Cadastro.jsx` + `AuthController.register`)

### Design — Overhaul Mobile + Geral
- `Menu.jsx` reestruturado: `.menu-logo` (logo fixa) + `.menu-links` (scroll horizontal no mobile)
- CSS: adicionados `.page-header`, `.tabs`/`.tab-btn`/`.tab-btn.ativo`, `.search-bar`, `.form-section-title`, `.kanban-board`/`.kanban-col`/`.kanban-card`
- `Clientes.jsx`: form reorganizado em 3 grupos com grids
- `Kanban.jsx`: reescrito com design system, cores por coluna

### Pequenos fixes
- Emojis removidos de `App.jsx` e `Perfil.jsx`

---

## Sessão 4 — 2026-05-19/20

### Design — Telas restantes
- `Materiais.jsx`: substituídos inline styles por `.page-header`, `.tabs`, `.tab-btn.ativo`, `.search-bar`, `.highlight-primary`
- `Historico.jsx`: mesma padronização + emojis removidos dos botões
- `NovoOrcamento.jsx`: removido `<style>` inline redundante (já coberto pelo CSS global)

### PWA — Ícones
- Gerados 3 arquivos de ícone quadrado em `public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
- `vite.config.js`: manifest corrigido com 3 entradas separadas (192 any, 512 any, 512 maskable)
- `index.html`: favicon e apple-touch-icon atualizados para `icon-192.png` / `icon-512.png`

### Menu
- Logo do menu trocada de `logo-orcapro.png` (horizontal, ruim em 36px) para `icon-192.png` + texto "OrçaPro"
- Nota: `logo-orcapro.png` ainda é usado em `Proposta.jsx` e `ImprimirOrcamento.jsx` (cabeçalho dos documentos)

### Dashboard
- Gráficos consertados: removidos `display: flex` e `max-height` no canvas que quebravam o Chart.js
- Containers dos gráficos com `position: relative; height: 280px`

### Fix crítico — Service Worker (Vercel)
- **Problema:** Deploy novo deixava desktop sem carregar (MIME type error — SW antigo servia `index.html` antigo com hash de JS expirado)
- **Fix:** `workbox: { skipWaiting: true, clientsClaim: true }` em `vite.config.js`
- **Fix imediato para usuários afetados:** DevTools → Application → Service Workers → Unregister → Ctrl+Shift+R

---

## Sessão 2 — anteriores a 2026-05-19

### Segurança (Fix 1–8)
1. Removido fallback inseguro `|| 'segredo_super_seguro'` no JWT; validação de envs obrigatórias com `process.exit(1)`
2. Rate limiter específico para `/api/login` e `/api/registrar`: 10 tentativas/15min por IP
3. `OrcamentoController`: verifica que `clienteId` pertence ao `req.userId` (fix cross-tenant)
4. `PrismaClient` singleton em `backend/src/lib/prisma.js`
5. Middleware de erro global `errorHandler.js` com tratamento de erros Prisma/Zod
6. **httpOnly cookies:** login emite cookie `httpOnly; Secure; SameSite=none`; token saiu do localStorage
7. **Refresh tokens:** access token 15min + refresh token 7d; interceptor no `api.js` com fila de requisições
8. **Recuperação de senha:** endpoints `forgot-password` + `reset-password`; páginas `EsqueciSenha.jsx` e `RedefinirSenha.jsx`; token JWT com segredo derivado da senha atual (trocar senha invalida o link)

---

## Backlog (O que falta)

### Alta prioridade
- [x] **Registro aberto** — Cloudflare Turnstile ativo em produção (sessão 9)
- [x] **Testes** — Jest + Supertest rodando no CI (sessão 9)
- [x] **CI/CD** — GitHub Actions configurado (sessão 9)
- [x] **CSP** — Content-Security-Policy configurado no Vercel (sessão 9)

### Média prioridade
- [x] **Índices no banco** — aplicados via `prisma db push` (sessão 9)
- [x] **Audit log** — implementado e aplicado no banco (sessão 9)
- [ ] **Notificações Telegram** — implementado localmente (sessão 9); pendente commit + `TELEGRAM_BOT_TOKEN` no Render
- [ ] **Spec-driven development** — estrutura de specs criada (sessão 9); specs das próximas features devem ser escritas antes da implementação

### Baixa prioridade
- [x] **PDF download** — funcionando em produção (sessão 9)
- [ ] **Planos/billing** — freemium vs pago; Stripe ou Pagar.me
- [ ] **Onboarding guiado** — wizard de primeiros passos para novo usuário
- [ ] **Notificações push PWA** — service worker existe mas sem push notifications
- [ ] **TypeScript** — migração gradual, começar pelos controllers
