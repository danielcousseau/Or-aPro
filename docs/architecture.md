# Arquitetura do OrcaPro

## Stack completa

| Camada | Tecnologia | Versão | Hospedagem |
|---|---|---|---|
| Frontend | React + Vite + TypeScript + PWA | React 18 | Vercel |
| Backend | Node.js + Express + Prisma ORM + TypeScript | Express 5, Node 22 | Render |
| Banco de dados | PostgreSQL | — | Neon.tech (serverless) |
| Auth | JWT httpOnly cookie + refresh tokens | — | — |
| Email | Brevo HTTP API | — | — |
| Notificações | Telegram Bot API | — | — |
| Captcha | Cloudflare Turnstile | — | Frontend |
| CI/CD | GitHub Actions | — | GitHub |

## Estrutura de pastas

```
OrcaPro/
├── OrcaPro/
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma        # modelo do banco (NUNCA usar migrate dev)
│   │   ├── src/
│   │   │   ├── controllers/         # lógica de negócio (.ts)
│   │   │   ├── middlewares/         # auth.ts, validate.ts, errorHandler.ts, adminAuth.ts
│   │   │   ├── routes/              # rotas Express (.ts)
│   │   │   ├── services/            # telegram.ts, audit.ts, email.ts
│   │   │   ├── lib/
│   │   │   │   └── prisma.ts        # singleton do PrismaClient
│   │   │   ├── constants/
│   │   │   │   └── materiaisPadrao.ts
│   │   │   └── app.ts               # Express app (separado do server.ts para testes)
│   │   ├── dist/                    # compilado pelo tsc — NÃO commitar
│   │   ├── tsconfig.json            # strict: true, output em dist/
│   │   └── __tests__/               # Jest + Supertest
│   └── frontend/
│       ├── src/
│       │   ├── pages/               # uma tela por arquivo (.tsx)
│       │   ├── components/          # componentes reutilizáveis (.tsx)
│       │   ├── constants/
│       │   │   └── status.ts        # CORES_STATUS compartilhado
│       │   ├── services/
│       │   │   └── api.ts           # Axios com interceptor de refresh token
│       │   ├── utils/               # format.ts, masks.ts, validators.ts
│       │   ├── types.ts             # todas as interfaces compartilhadas
│       │   └── types/
│       │       └── html2pdf.d.ts    # declaração de tipos para html2pdf.js
│       ├── public/                  # ícones PWA, logo
│       └── tsconfig.json            # noEmit: true (Vite compila, TS só checa tipos)
├── docs/                            # documentação detalhada (este arquivo)
├── specs/                           # specs de features (escrever antes de implementar)
├── .claude/                         # configurações do Claude Code
├── .github/workflows/               # CI/CD GitHub Actions
├── _backup_arquitetura_v1/          # backup do CLAUDE.md original
├── CLAUDE.md                        # guia principal para o Claude
└── README.md                        # documentação pública
```

## URLs de produção

- **Frontend:** https://orca-pro-seven.vercel.app
- **Backend:** hospedado no Render (URL em `VITE_API_URL` no Vercel)
- **Banco:** Neon.tech projeto `neondb`, schema `public`
- **Trello:** https://trello.com/b/3IwYopQt/projeto-orcapro

## Decisões de arquitetura

### Banco de dados
- Usar `prisma db push` (não `prisma migrate dev`) — o projeto não tem histórico de migrations
- Novas colunas: editar schema → mostrar diff para Victor → aguardar aprovação → `prisma db push`
- `directUrl` no `schema.prisma` é obrigatório para o Neon.tech — DDL precisa de URL direta (não o pooler)
- Para rodar `db push` localmente: renomear `prisma.config.ts` temporariamente

### Zod v4
- O projeto usa `"zod": "^4.4.3"`
- **Não importar** `ZodSchema` ou `ZodIssue` — não existem no Zod v4
- Usar `z.ZodTypeAny` e deixar TypeScript inferir tipos de issues automaticamente

### Express 5 + req.params
- O projeto usa Express 5 (`^5.2.1`) com `@types/express` v5
- Desestruturar `const { token } = req.params` resulta em tipo `string | string[]`
- **Sempre** usar `const token = req.params.token as string` ao passar para campos do Prisma
- `Number(id)` não precisa do cast porque `Number()` aceita qualquer tipo

### Email
- Render bloqueia porta 587 (SMTP) — Nodemailer não funciona
- Solução: Brevo HTTP API via `fetch` nativo do Node.js

### PDF
- Sempre usar `html2pdf.js` no frontend via componente `DocumentoOrcamento.tsx`
- O backend tem rota `GET /api/orcamentos/:id/pdf` com pdfkit mas não é usada pelo frontend

### Contrato token
- UUID gerado com `randomUUID()` do Node.js `crypto` (built-in, sem dependência extra)
- Salvo como `contratoToken String? @unique` no banco
- É permanente (diferente do `propostaToken` JWT que tem validade)
- Gerado apenas uma vez — não sobrescreve se o orçamento voltar para Aprovado

### Logo da marcenaria
- Armazenada como base64 no campo `logoMarcenaria` da tabela `User`
- Limite HTTP aumentado para 600kb no `app.ts`
- Compressão no frontend: 600×200px, JPEG 85%

### Autenticação Safari/iOS
- Cookies `httpOnly` cross-domain são bloqueados pelo Safari ITP
- Solução: access token em memória JS + refreshToken no `localStorage`

### Estilos de impressão
- Centralizados no `index.css` em `@media print`
- **Nunca** colocar `.no-print` em `<style>` inline de componente — não funciona no mobile

### Testes
- Conectam no banco real do Neon.tech (não mockado)
- `helpers.ts` deve deletar `AuditLog` antes do `User` (FK constraint)

### Debugar build do Render localmente
- TypeScript não está instalado globalmente na máquina do Victor
- Rodar `npm install` na pasta `backend/` e depois `npx tsc --noEmit`

### CSS / Design System
- Variáveis CSS próprias: `var(--primary)`, `var(--danger)`, etc.
- Sem inline styles (exceto valores dinâmicos calculados em JS)
- Glassmorphism: `backdrop-filter: blur(20px)` na sidebar e modais
- Micro-interações: `scale(1.02)` hover, `scale(0.97)` clique nos botões

### localStorage no Perfil
- Sempre inicializar previews (logo, avatar) com lazy initializer do `useState` lendo do localStorage
- Garante exibição imediata antes da chamada à API completar
