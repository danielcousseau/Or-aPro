# Regras de Segurança do OrcaPro

## O que já está implementado

### Autenticação e sessão

- **JWT sem fallback inseguro** — `JWT_SECRET` obrigatório; o servidor para (`process.exit(1)`) se a variável não estiver configurada
- **Access token de curta duração** — expira em 15 minutos; força o frontend a renovar com frequência
- **Refresh token de longa duração** — expira em 7 dias; armazenado no `localStorage` (necessário por causa do Safari ITP que bloqueia cookies cross-domain)
- **Safari/iOS fix** — access token fica apenas na memória JavaScript (não em cookie nem localStorage); só o refresh token vai para o localStorage. Se o usuário fechar a aba, precisa fazer login novamente (isso é intencional — mais seguro)

### Proteção de endpoints

- **Rate limit** — 10 tentativas por IP a cada 15 minutos em `/api/login` e `/api/registrar`. Evita ataques de força bruta (tentativas automatizadas de adivinhar senha)
- **Helmet.js** — adiciona cabeçalhos HTTP de segurança automaticamente (X-Frame-Options, X-Content-Type-Options, etc.)
- **CSP (Content-Security-Policy)** — configurado no `vercel.json`; controla de quais origens o browser pode carregar recursos
- **Cloudflare Turnstile** — captcha invisível no cadastro; bloqueia bots que tentam criar contas automaticamente

### Isolamento de dados (multi-tenant)

- **Validação cross-tenant no `OrcamentoController`** — verifica que o `clienteId` informado pertence ao marceneiro logado (evita IDOR — acessar dados de outro usuário por ID)
- Ver [tenant-model.md](tenant-model.md) para o modelo completo

### Tratamento de erros

- **Middleware de erro global `errorHandler.ts`** — captura todos os erros não tratados; retorna mensagem padronizada sem vazar stack trace para o cliente
- **PrismaClient singleton** — evita múltiplas conexões ao banco

### Recuperação de senha

- **Link de redefinição via e-mail** — token único enviado pelo Brevo; expira após uso
- **Páginas:** `EsqueciSenha.tsx`, `RedefinirSenha.tsx`

### Validação de entrada

- **Zod** em todos os endpoints que recebem dados do usuário — rejeita dados malformados antes de chegar ao banco
- Usando `z.ZodTypeAny` (não `ZodSchema` — não existe no Zod v4)

## O que NÃO pode ser desabilitado ou contornado

Estas proteções existem por razões sérias. Nunca remover sem discussão explícita:

| Proteção               | Onde fica                 | Por que não pode remover                       |
| ---------------------- | ------------------------- | ---------------------------------------------- |
| Helmet.js              | `app.ts`                  | Remove headers de segurança do browser         |
| Rate limit             | `routes/auth.ts`          | Expõe login a ataques de força bruta           |
| Validação cross-tenant | `OrcamentoController.ts`  | Marceneiros poderiam ver dados uns dos outros  |
| JWT_SECRET obrigatório | `server.ts`               | Token assinado com secret fraco seria forjável |
| Zod nos endpoints      | `middlewares/validate.ts` | Dados não validados chegam ao banco            |

## Variáveis de ambiente obrigatórias

O backend valida no boot que essas variáveis existem. Se alguma estiver faltando, o servidor **não sobe** (para explicitamente):

```
DATABASE_URL         # URL de conexão com o banco (Neon.tech pooler)
DIRECT_URL           # URL direta do banco (Neon.tech — para DDL/migrations)
JWT_SECRET           # Chave secreta para assinar tokens JWT
```

**Nunca** colocar essas variáveis no código. Ficam:

- Localmente: arquivo `.env` (nunca commitar)
- Produção: painel do Render (Environment Variables)
- CI/CD: GitHub Secrets

## Segredos no CI/CD (GitHub Secrets)

| Secret               | Para que serve                                        |
| -------------------- | ----------------------------------------------------- |
| `DATABASE_URL`       | Testes automatizados conectam ao banco real           |
| `DIRECT_URL`         | Idem, para operações DDL                              |
| `JWT_SECRET`         | Testes de autenticação                                |
| `RENDER_DEPLOY_HOOK` | URL que dispara deploy no Render após testes passarem |

A `RENDER_DEPLOY_HOOK` é especialmente sensível — qualquer pessoa com essa URL pode disparar um deploy. Nunca expor no código.

## Auditoria de ações

Toda ação importante fica registrada na tabela `AuditLog`:

- Login / logout
- Criação, edição e exclusão de orçamentos
- Mudança de status no Kanban

O marceneiro pode ver seu próprio log no card "Auditoria" da página Perfil. O admin pode ver todos os logs no painel Admin.

## Checklist de segurança para novos endpoints

Antes de criar qualquer endpoint novo, verificar:

- [ ] Rota está protegida pelo middleware `auth.ts`?
- [ ] Query Prisma filtra por `userId: req.userId`?
- [ ] Referências cruzadas (ex: clienteId em orçamento) são validadas com cross-tenant check?
- [ ] Entrada do usuário passa por validação Zod?
- [ ] Erros são lançados para o `errorHandler` (não `console.log` ou `catch` vazio)?
- [ ] Nenhum dado sensível (senha, token) é retornado na resposta?
