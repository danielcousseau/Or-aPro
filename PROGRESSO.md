# Progresso do Desenvolvimento — OrçaPro

> Este arquivo é atualizado ao final de cada sessão de desenvolvimento com o Claude Code.
> Serve como histórico permanente do que foi feito e do que está pendente.

---

## Estado Atual do Projeto (2026-05-20)

- **Frontend:** React + Vite + PWA → Vercel
- **Backend:** Node.js + Express + Prisma → Render
- **Banco:** PostgreSQL → Neon.tech (multi-tenant / SaaS)
- **Status:** Funcional em produção

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
- [ ] **Registro aberto** — qualquer bot pode criar conta; considerar hCaptcha / Cloudflare Turnstile ou convite por e-mail
- [ ] **Testes** — zero testes; prioridade: Jest + Supertest nos endpoints de auth e isolamento cross-tenant

### Média prioridade
- [ ] **Índices no banco** — `Cliente.userId`, `Material.userId`, `Orcamento.userId`, `Orcamento.status`
- [ ] **Audit log** — tabela `AuditLog` (userId, ação, recurso, timestamp)

### Baixa prioridade
- [ ] **PDF download** — botão de download direto em `/imprimir/:id` (`html2pdf.js` ou puppeteer no backend)
- [ ] **CSP** — configurar `Content-Security-Policy` explícito no Helmet
- [ ] **Planos/billing** — freemium vs pago; Stripe ou Pagar.me
- [ ] **Onboarding guiado** — wizard de primeiros passos para novo usuário
- [ ] **Notificações push** — service worker existe mas sem push notifications
- [ ] **CI/CD** — GitHub Actions (lint + testes antes do merge)
- [ ] **TypeScript** — migração gradual, começar pelos controllers
