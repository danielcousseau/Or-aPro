# OrcaPro — Guia para Claude Code

OrcaPro é um SaaS multi-tenant brasileiro de orçamentos para marcenarias.
**Dono: Victor** (iniciante em programação — sempre explique em linguagem simples antes de fazer qualquer coisa).
**Prioridades:** segurança > isolamento de dados > funcionalidade > velocidade.

---

## Stack

| Camada   | Tecnologia                                    | Hospedagem             |
| -------- | --------------------------------------------- | ---------------------- |
| Frontend | React 18 + Vite + TypeScript + PWA            | Vercel                 |
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

---

## Armadilhas conhecidas

- **Express 5 + req.params**: usar `req.params.token as string` (não destruturar) — evita tipo `string | string[]`
- **Zod v4**: não importar `ZodSchema` ou `ZodIssue` — usar `z.ZodTypeAny` e inferência automática
- **Render deploy**: leva 3–7 min; "Cannot GET /rota" logo após push não é bug de código
- **Banco local**: renomear `prisma.config.ts` temporariamente ao rodar `prisma db push` localmente
- **Email**: Render bloqueia porta 587 (SMTP) — usar Brevo HTTP API via `fetch` nativo
- **PDF**: sempre usar `html2pdf.js` via `DocumentoOrcamento.tsx` no frontend
- **Safari/iOS**: access token em memória JS + refreshToken no localStorage (cookies cross-domain bloqueados pelo Safari ITP)

---

## Estado atual (o que está funcionando em produção)

### Segurança implementada

- JWT httpOnly cookie + refresh tokens (15min / 7 dias)
- Rate limit: 10 tentativas / 15 min por IP em `/login` e `/registrar`
- Validação cross-tenant no `OrcamentoController`
- Helmet.js, CSP no `vercel.json`, Cloudflare Turnstile no cadastro
- Recuperação de senha via Brevo HTTP API

### Features implementadas

- Clientes, Orçamentos (materiais + mão de obra + markup), Histórico
- Kanban com drag-and-drop + notificações Telegram
- Proposta ao cliente (PDF + WhatsApp) com logo da marcenaria
- Contrato automático ao aprovar — cliente assina online via link único
- Dashboard com gráficos (Chart.js) + Bento Grid + Glassmorphism
- Estoque de materiais com alertas de nível baixo
- Financeiro: contas a receber + rentabilidade por projeto
- Ordem de Produção no Dashboard + página imprimível
- PWA, Audit Log, TypeScript completo (front + back)

---

## Backlog

**Trello completo:** https://trello.com/b/3IwYopQt/projeto-orcapro

### Próximas prioridades

- [ ] Ordem de produção em 1 clique (criação automática ao aprovar + botão no Kanban)
- [ ] Métricas do funil de vendas (conversão, valor médio, perdidos no mês)
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

**Testes:** conectam no banco real do Neon.tech (não mockado); `helpers.ts` deleta `AuditLog` antes do `User`

---

## Documentação detalhada

- Arquitetura completa: [docs/architecture.md](docs/architecture.md)
- Modelo multi-tenant: [docs/tenant-model.md](docs/tenant-model.md)
- Regras de segurança: [docs/security-rules.md](docs/security-rules.md)
- Deploy e infraestrutura: [docs/deploy.md](docs/deploy.md)
- Glossário para iniciantes: [docs/iniciante.md](docs/iniciante.md)
