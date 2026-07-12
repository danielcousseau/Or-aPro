# OrcaPro — Guia para Claude Code

OrcaPro é um SaaS multi-tenant brasileiro de orçamentos para marcenarias.
**Dono: Victor** (iniciante em programação — sempre explique em linguagem simples antes de fazer qualquer coisa).
**Prioridades:** segurança > isolamento de dados > funcionalidade > velocidade.

---

## Stack

| Camada   | Tecnologia                                    | Hospedagem             |
| -------- | --------------------------------------------- | ---------------------- |
| Frontend | React 18 + Vite + TypeScript + PWA            | Vercel                 |
| App      | Capacitor 8 (mesmo frontend React empacotado) | Google Play (em breve) |
| Backend  | Node.js + Express 5 + Prisma ORM + TypeScript | Render                 |
| Banco    | PostgreSQL                                    | Neon.tech (serverless) |
| Auth     | JWT (httpOnly cookie + refresh tokens 7 dias) | —                      |

Detalhes completos: [docs/architecture.md](docs/architecture.md)

---

## REGRAS DE OURO (NUNCA quebrar sem aprovação explícita do Victor)

1. NUNCA rode `prisma db push`, `migrate reset` ou qualquer comando que altera o banco sem mostrar o diff e aguardar aprovação
2. NUNCA use `--accept-data-loss` sem listar exatamente o que será apagado
3. NUNCA crie query Prisma sem filtro de tenant (`userId`) — veja [docs/tenant-model.md](docs/tenant-model.md)
4. NUNCA escreva segredos, tokens ou senhas no código, logs ou commits
5. NUNCA desabilite Helmet, rate limit ou validação cross-tenant
6. NUNCA delete arquivos ou pastas sem listar o que será removido e aguardar OK
7. NUNCA faça refactor em múltiplos arquivos ao mesmo tempo — um por vez
8. SEMPRE valide entrada de usuário com Zod antes de tocar no banco
9. SEMPRE explique em linguagem simples ANTES de executar, mencionando o risco
10. SEMPRE mostre o que vai mudar antes de mudar (liste arquivos afetados)

---

## Comandos comuns

```bash
# Dentro de OrcaPro/backend/
npm run dev          # sobe o servidor local
npm test             # roda os testes
npx tsc --noEmit     # checa tipos TypeScript (sem compilar)
npx prisma studio    # abre interface visual do banco

# Dentro de OrcaPro/frontend/
npm run dev          # sobe o frontend local
npm run build        # gera versão de produção
npm run app:android  # build + sincroniza o app Android (Capacitor)
```

---

## Workflow padrão para mudanças

1. **Schema do banco** → mostrar diff → aguardar aprovação → `prisma db push`
2. **Novo endpoint** → verificar filtro de tenant → implementar → testar
3. **Feature nova** → criar spec em `specs/` → implementar → testar
4. **Antes de declarar concluído** → `npx tsc --noEmit` (zero erros) + `npm test` (todos passando)
5. **Após commit + push** → atualizar o Trello automaticamente (sem precisar ser pedido):
   - Se existia card relacionado no Backlog/Sprint → mover para ✅ Concluído e adicionar comentário com o que foi feito
   - Se não existia card → criar novo em ✅ Concluído com descrição da mudança, label correta (Back-end / Front-end / Full-Stack) e hash do commit

## Fluxo de PR (padrão desde jul/2026)

Features e mudanças relevantes passam por Pull Request em vez de commit direto na `main`:

1. Criar branch: `git checkout -b feat/nome-da-feature`
2. Commitar na branch e abrir PR: `gh pr create --fill` (usar o caminho completo do gh no Bash)
3. O GitHub roda automaticamente: **CI** (tipos + testes backend, tipos + build frontend) e **Claude Review** (revisão de IA focada em tenant, Zod, segredos e padrões)
4. Corrigir o que a revisão apontar → merge na `main` → deploy automático no Render
5. Hotfixes urgentes ainda podem ir direto na `main` (o CI roda mesmo assim)

### Workflows do GitHub (`.github/workflows/`)

- `ci.yml` — tipos + testes do backend (banco real via secrets) + tipos + build do frontend; deploy no Render após passar
- `claude-review.yml` — Claude revisa todo PR automaticamente
- `claude.yml` — mencionar `@claude` em issue/PR para o Claude analisar, responder ou implementar
- `deploy-apresentacao.yml` — publica os slides no GitHub Pages
- Os workflows de IA usam o secret `CLAUDE_CODE_OAUTH_TOKEN` (gerado com `claude setup-token`)

---

## Armadilhas conhecidas

- **Express 5 + req.params**: usar `req.params.token as string` (não destruturar) — evita tipo `string | string[]`
- **Zod v4**: não importar `ZodSchema` ou `ZodIssue` — usar `z.ZodTypeAny` e inferência automática
- **Render deploy**: leva 3–7 min; "Cannot GET /rota" logo após push não é bug de código
- **Banco local**: renomear `prisma.config.ts` temporariamente ao rodar `prisma db push` localmente
- **Email**: Render bloqueia porta 587 (SMTP) — usar Brevo HTTP API via `fetch` nativo
- **PDF**: sempre usar `html2pdf.js` via `DocumentoOrcamento.tsx` no frontend
- **html2pdf.js 0.14+**: os tipos que o pacote distribui são incompletos (sem `pagebreak`) — o `tsconfig.json` do frontend aponta `html2pdf.js` para `src/types/html2pdf.d.ts` via `paths`; manter esse shim ao atualizar o pacote
- **Safari/iOS**: access token em memória JS + refreshToken no localStorage (cookies cross-domain bloqueados pelo Safari ITP)
- **Telegram + Markdown**: todo texto vindo do usuário (nome, título) interpolado em mensagem do bot precisa passar por `escaparMarkdown()` (`telegram.ts`) — um `_`, `*`, `` ` `` ou `[` sem par faz o Telegram rejeitar a mensagem inteira
- **claude-review.yml**: a action só executa se o arquivo do workflow no PR for idêntico ao da `main` (proteção contra roubo de token) — mudanças no workflow de review precisam entrar pela `main` antes de valerem nos PRs

---

## Estado atual (o que está funcionando em produção)

### Segurança implementada

- JWT httpOnly cookie + refresh tokens (15min / 7 dias)
- Rate limit: 10 tentativas / 15 min por IP em `/login`, `/registrar`, `/forgot-password` e `/reset-password`
- Validação cross-tenant no `OrcamentoController`
- Helmet.js, CSP no `vercel.json` (sem `unsafe-eval`; `connect-src` restrito ao domínio da API), Cloudflare Turnstile no cadastro
- Recuperação de senha via Brevo HTTP API
- Validação Zod nas rotas de auth (`authSchema.ts`) — senha mínima de 6 caracteres no cadastro
- Rotas públicas (`/proposta/:token`, `/contrato/:token`) com `select` restrito: não expõem lucro, mão de obra, `contratoToken` nem cadastro completo do cliente

### Features implementadas

- Clientes, Orçamentos (materiais + mão de obra + markup), Histórico
- Kanban com drag-and-drop + notificações Telegram
- Proposta ao cliente (PDF + WhatsApp) com logo da marcenaria
- Envio do PDF do orçamento pelo Telegram: botão na tela do orçamento manda o arquivo real + link da proposta no chat do cliente (`POST /orcamentos/:id/enviar-telegram`, com escape de Markdown e registro no Audit Log — veja [specs/004-envio-pdf-telegram.md](specs/004-envio-pdf-telegram.md))
- Contrato automático ao aprovar — cliente assina online via link único
- Dashboard com gráficos (Chart.js) + Bento Grid + Glassmorphism
- Estoque de materiais com alertas de nível baixo
- Financeiro: contas a receber + rentabilidade por projeto
- Ordem de Produção no Dashboard + página imprimível
- Plano de Corte: motor de nesting, otimização de chapas, fita de borda, configuração da marcenaria e relatório de peças imprimível
- PWA, Audit Log, TypeScript completo (front + back)
- App Android nativo (Capacitor) com ícone e splash da marca — testado no emulador contra a API de produção; falta assinar e publicar na Play Store (veja [docs/app-android.md](docs/app-android.md))

---

## Backlog

**Trello completo:** https://trello.com/b/3IwYopQt/projeto-orcapro

### Próximas prioridades

- [ ] Fluxo de caixa (projeção 30/60/90 dias)
- [ ] WhatsApp via EvolutionAPI (substituir Telegram)
- [ ] Assinatura digital do contrato (ClickSign ou DocuSign)

### Bugs abertos

Nenhum.

---

## Convenções do código

**Idioma:** variáveis de negócio em português (`orcamento`, `cliente`, `marcenaria`), padrões técnicos em inglês (`handleSubmit`, `isLoading`, `useEffect`)

**CSS:** variáveis `var(--primary)`, sem inline styles (exceto valores dinâmicos de JS); estilos de impressão sempre em `index.css` no bloco `@media print`

**API:** sempre retornar `{ data, error, message }`; erros sempre pelo `errorHandler` global

**Commits:** em português com prefixo — `feat:`, `fix:`, `docs:`, `refactor:`

**Testes:** conectam no banco real do Neon.tech (não mockado); `helpers.ts` deleta `AuditLog` antes do `User`. Exceções que rodam sem banco: `authValidation.test.js` e `motorMarcenaria.test.js`

---

## Documentação detalhada

- Arquitetura completa: [docs/architecture.md](docs/architecture.md)
- Modelo multi-tenant: [docs/tenant-model.md](docs/tenant-model.md)
- Regras de segurança: [docs/security-rules.md](docs/security-rules.md)
- Deploy e infraestrutura: [docs/deploy.md](docs/deploy.md)
- App Android (Capacitor): [docs/app-android.md](docs/app-android.md)
- Glossário para iniciantes: [docs/iniciante.md](docs/iniciante.md)
