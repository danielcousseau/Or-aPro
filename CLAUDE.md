# CLAUDE.md — Guia de Trabalho do Projeto OrcaPro

> Leia este arquivo no início de TODA sessão. Ao terminar, atualize as seções "Estado Atual" e "Backlog".

---

## 1. VISÃO GERAL DO PROJETO

**OrcaPro** é um sistema web SaaS (Software as a Service) de gestão de orçamentos para marcenarias. Multi-tenant: cada marceneiro tem conta própria e vê apenas seus dados.

### Funcionalidades principais
- Cadastro de clientes
- Criação de orçamentos com materiais, mão de obra e markup
- Geração de proposta para envio ao cliente (PDF + WhatsApp)
- Quadro Kanban de produção (Aguardando → Aprovado → Produção → Instalação → Entregue)
- Notificações automáticas via Telegram quando o status muda
- Dashboard gerencial com gráficos

### Stack completa
| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | React + Vite + PWA | Vercel |
| Backend (API) | Node.js + Express + Prisma ORM | Render |
| Banco de dados | PostgreSQL | Neon.tech (serverless) |

### Estrutura de pastas
```
OrcaPro/
├── OrcaPro/
│   ├── backend/
│   │   ├── prisma/           # schema.prisma + migrations (não usar migrate dev — ver seção 7)
│   │   ├── src/
│   │   │   ├── controllers/  # lógica de negócio
│   │   │   ├── middlewares/  # auth, validate, errorHandler, adminAuth
│   │   │   ├── routes/       # rotas Express
│   │   │   ├── services/     # telegram.js, audit.js, email
│   │   │   ├── lib/          # prisma.js (singleton)
│   │   │   ├── constants/    # materiaisPadrao.js
│   │   │   └── app.js        # Express app (separado do server.js para testes)
│   │   └── __tests__/        # Jest + Supertest
│   └── frontend/
│       ├── src/
│       │   ├── pages/        # uma pasta por tela (Login, Clientes, NovoOrcamento, etc.)
│       │   ├── components/   # componentes reutilizáveis
│       │   └── services/     # api.js (Axios com interceptor de refresh token)
│       └── public/           # ícones PWA, logo
├── specs/                    # specs de features (escrever antes de implementar)
├── .github/workflows/        # CI/CD GitHub Actions
├── CLAUDE.md                 # este arquivo
└── README.md                 # documentação pública
```

### URLs de produção
- **Frontend:** https://orca-pro-seven.vercel.app
- **Backend:** hospedado no Render (URL configurada como `VITE_API_URL` no Vercel)
- **Banco:** Neon.tech projeto `neondb`, schema `public`

---

## 2. REGRAS DE OURO — NUNCA FAÇA SEM APROVAÇÃO EXPLÍCITA

Estas regras existem porque erros aqui causam perda de dados em produção ou quebram o sistema para usuários reais.

### ❌ PROIBIDO sem aprovação explícita

- **Nunca** rodar `prisma db push` em produção sem antes explicar o que vai mudar no banco e aguardar confirmação
- **Nunca** usar a flag `--accept-data-loss` sem listar exatamente quais tabelas/dados serão apagados e aguardar aprovação — esta flag ignora o aviso de segurança do Prisma
- **Nunca** commitar e dar push de mudanças que afetam o banco (schema, migrations) sem mostrar o diff primeiro
- **Nunca** deletar arquivos sem listar o que será removido e justificar por quê
- **Nunca** alterar variáveis de ambiente de produção (Render, Vercel, GitHub Secrets) sem confirmação
- **Nunca** fazer refactor grande em múltiplos arquivos de uma vez — um arquivo por vez, aguardando confirmação

### ✅ SEMPRE fazer

- Perguntar antes de qualquer ação irreversível (deletar dados, alterar banco, força push)
- Mostrar o que vai mudar **antes** de mudar — descrever em linguagem simples
- Fazer uma coisa por vez e aguardar confirmação para continuar
- Explicar o risco de cada ação: "o que pode dar errado se isso falhar?"

---

## 3. ESTADO ATUAL DO PROJETO

Tudo que já foi implementado e está funcionando em produção (salvo indicação contrária).

### Segurança
- [x] JWT sem fallback inseguro; envs obrigatórias validadas no boot com `process.exit(1)`
- [x] Rate limiter no `/api/login` e `/api/registrar` — 10 tentativas por 15 minutos por IP
- [x] Validação cross-tenant no `OrcamentoController` (verifica que `clienteId` pertence ao `req.userId`)
- [x] `PrismaClient` singleton em `backend/src/lib/prisma.js`
- [x] Middleware de erro global `errorHandler.js`
- [x] `httpOnly cookies` + `refresh tokens` (access token: 15min, refresh token: 7 dias)
- [x] Recuperação de senha via e-mail (Brevo HTTP API) — `EsqueciSenha.jsx`, `RedefinirSenha.jsx`
- [x] Helmet.js ativo no backend
- [x] Cloudflare Turnstile no cadastro (chaves reais configuradas para `orca-pro-seven.vercel.app`)
- [x] CSP (Content-Security-Policy) configurado no `vercel.json`
- [x] Fix Safari/iOS: access token em memória JS + refreshToken no `localStorage` (cookies cross-domain bloqueados pelo Safari ITP)

### Infraestrutura
- [x] `directUrl` no `schema.prisma` — necessário para o Neon.tech (usa pooler por padrão; DDL precisa de URL direta)
- [x] CI/CD: `.github/workflows/ci.yml` — roda `npm test` a cada push na main (Node.js 22)
- [x] Secrets configurados no GitHub: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`
- [x] `postinstall: npx prisma generate` no `package.json` do backend

### Features
- [x] Cadastro de clientes com busca de CEP (ViaCEP com fallback automático para BrasilAPI)
- [x] Orçamentos com materiais, mão de obra (fixo/hora/diária/percentual), markup/lucro
- [x] Histórico de orçamentos com toggle de materiais por card
- [x] Dashboard gerencial com gráficos (Chart.js) — status, ambientes, receita
- [x] Quadro Kanban com busca por título e cliente
- [x] Proposta para cliente (HTML imprimível + PDF via html2pdf.js)
- [x] Geração de link WhatsApp com mensagem pré-formatada (nome da marcenaria incluso)
- [x] PDF download via `html2pdf.js` — `ImprimirOrcamento.jsx` e `Proposta.jsx`
- [x] Nome da Marcenaria (`nomeMarcenaria`) editável no Perfil — aparece no PDF e no WhatsApp
- [x] Materiais padrão de marcenaria (31 itens) — lazy init na primeira listagem do usuário
- [x] Campos select + "Outro (digitar manualmente)": Ambiente, Forma de Pagamento, Categoria, Unidade
- [x] Opções customizadas fixas (`OpcaoCustomizada`) — checkbox "Salvar como opção fixa"
- [x] Notificações Telegram automáticas ao mudar status no Kanban
- [x] Audit Log de ações (criar/editar/excluir/login) — card no Perfil + painel Admin
- [x] PWA: ícones, manifest, service worker com `skipWaiting: true`
- [x] Testes automatizados: `__tests__/auth.test.js` + `__tests__/crossTenant.test.js`

### Decisões de arquitetura importantes
- **Banco:** usar `prisma db push` (não `migrate dev`) — o projeto não tem histórico de migrations. Novas colunas exigem `db push` explícito com aprovação do Victor.
- **Email:** Brevo HTTP API via `fetch` nativo — o Render bloqueia a porta 587 (SMTP), então Nodemailer não funciona.
- **PDF:** sempre usar `html2pdf.js` no frontend. O backend tem uma rota `GET /api/orcamentos/:id/pdf` com `pdfkit`, mas não é usada pelo frontend (layout diferente, mantida por precaução).
- **Estilos de impressão:** centralizados no `index.css` em `@media print`. Nunca colocar `.no-print` apenas em `<style>` inline de componente — não funciona no mobile.
- **Testes:** conectam no banco real do Neon.tech (não mockado). O `helpers.js` deve deletar `AuditLog` antes do `User` na limpeza (FK constraint).

---

## 4. BACKLOG PRIORIZADO

### 🔴 Bugs abertos

- [ ] **Telegram chatId não salva pelo formulário** — frontend envia o campo corretamente, mas o Render usa cache do `node_modules` entre deploys, e o Prisma Client gerado no build não chega ao container. Workaround ativo: setar via SQL direto no Neon. Solução definitiva: investigar opção de desativar cache do `node_modules` no Render.
- [ ] **Botão "Adicionar Material" — cor azul não aparece no Vercel** — Service Worker do PWA cacheia o bundle antigo. Fix para o usuário: DevTools → Application → Service Workers → Unregister → recarregar.

### 🟡 Média prioridade

- [ ] **Interface para gerenciar opções fixas salvas** — tela para o marceneiro ver e excluir as opções customizadas que salvou (ex: apagar "Área Gourmet" que não usa mais)
- [ ] **Onboarding guiado** — wizard de 3 passos para novo usuário: criar primeiro cliente → criar primeiro orçamento → enviar primeira proposta
- [ ] **WhatsApp API** — substituir Telegram por Z-API ou Evolution API (usa o próprio número de WhatsApp do marceneiro, mais prático que bot Telegram)

### 🟢 Baixa prioridade / SaaS futuro

- [ ] **Notificações push PWA** — service worker existe mas não tem push notifications implementado
- [ ] **Planos e billing** — freemium vs pago; Stripe ou Pagar.me
- [ ] **TypeScript** — migração gradual, começar pelos controllers
- [ ] **Spec 003** — próxima feature a definir com Victor antes de implementar

---

## 5. CONVENÇÕES DO PROJETO

### Idioma do código
- **Português:** variáveis de domínio do negócio — `orcamento`, `cliente`, `marcenaria`, `nomeMarcenaria`, `tipoMaoDeObra`
- **Inglês:** padrões técnicos — `handleSubmit`, `isLoading`, `useEffect`, `useState`, `errorHandler`

### CSS
- Design System próprio com variáveis CSS (ex: `var(--primary)`, `var(--danger)`)
- Não usar inline styles — exceção apenas para valores dinâmicos calculados em JS
- Estilos de impressão sempre em `index.css` no bloco `@media print`, nunca em `<style>` inline de componente

### API REST
- Sempre retornar `{ data, error, message }` padronizado
- Erros sempre passam pelo `errorHandler.js` global — nunca `catch` vazio ou `console.log` sem tratamento
- Autenticação via middleware `auth.js` — lê Bearer token do header `Authorization` (fallback para cookie)

### Banco de dados
- Schema em `backend/prisma/schema.prisma`
- Para adicionar coluna: editar o schema → mostrar o diff para Victor → aguardar aprovação → `prisma db push` (nunca com `--accept-data-loss` sem aprovação explícita)

### Commits
- Mensagens em português, com prefixo descritivo
- Exemplos: `feat: adiciona validação cross-tenant`, `fix: corrige overflow no mobile`, `docs: atualiza CLAUDE.md`
- Nunca commitar arquivos `.env` ou credenciais

### Testes
- Arquivos em `backend/__tests__/`
- Helpers compartilhados em `__tests__/helpers.js`
- Conectam no banco real do Neon.tech (não mockado) — os dados de teste são limpos no `afterAll`

---

## 6. SOBRE O DONO DO PROJETO

**O Victor é iniciante em programação.** Estas regras de comunicação são obrigatórias em toda sessão:

- **Antes de fazer QUALQUER coisa**, explique o que vai fazer em linguagem simples — como se estivesse explicando para alguém que nunca programou
- **Explique o risco** de cada ação: o que pode dar errado se algo falhar? Quais dados podem ser afetados?
- **Nunca assuma** que ele conhece um termo técnico — sempre explique entre parênteses na primeira vez que usar
- **Mostre o que vai mudar** antes de mudar — liste os arquivos que serão alterados e por quê
- **Uma coisa por vez** — não tente resolver tudo junto; faça, mostre o resultado, aguarde aprovação para continuar

**Exemplos de como comunicar:**

✅ Bom: "Vou adicionar um índice no banco (pensa num índice como o sumário de um livro — ajuda o banco a encontrar registros muito mais rápido, sem precisar ler tudo). O risco é zero, porque só estamos adicionando — não removemos nem alteramos nenhum dado existente."

❌ Ruim: "Vou criar um B-tree index na coluna `userId` para melhorar a performance das queries com filtro por tenant."

---

## 7. COMO TRABALHAR NESTE PROJETO

### No início de cada sessão
1. Leia este `CLAUDE.md` completamente
2. Pergunte ao Victor qual é o objetivo da sessão
3. Confirme o que vai ser feito antes de começar

### Durante a sessão
- Foque em **um item do backlog por vez** — nunca tente resolver tudo de uma vez
- Após cada mudança, descreva o que foi feito em linguagem simples
- Se encontrar um bug novo ou decisão arquitetural importante, mencione antes de tentar corrigir sozinho

### No final de cada sessão
- Atualize a seção "Estado Atual" com o que foi implementado
- Atualize o Backlog (marque o que foi concluído, adicione bugs novos)
- Faça commit e push de tudo que ficou pendente

### Regras críticas para banco de dados
O projeto usa `prisma db push` (não `prisma migrate dev`) porque o banco foi criado sem histórico de migrations. Isso significa:
- Toda alteração de schema precisa de aprovação explícita do Victor antes de rodar
- `prisma db push` modifica o banco de produção real — não existe "ambiente de teste separado"
- **Nunca** usar `--accept-data-loss` sem mostrar ao Victor exatamente o que será apagado

### Se o contexto da sessão estiver acabando
- Pare, atualize este `CLAUDE.md` com o estado atual
- Avise o Victor: "Contexto próximo do limite — atualizei o CLAUDE.md. Recomendo continuar numa nova sessão."
