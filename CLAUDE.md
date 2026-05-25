# CLAUDE.md — Guia de Trabalho do Projeto OrcaPro

> Leia este arquivo no início de TODA sessão. Ao terminar, atualize as seções "Estado Atual" e "Backlog".º

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
| Frontend | React + Vite + TypeScript + PWA | Vercel |
| Backend (API) | Node.js + Express + Prisma ORM + TypeScript | Render |
| Banco de dados | PostgreSQL | Neon.tech (serverless) |

### Estrutura de pastas
```
OrcaPro/
├── OrcaPro/
│   ├── backend/
│   │   ├── prisma/           # schema.prisma + migrations (não usar migrate dev — ver seção 7)
│   │   ├── src/
│   │   │   ├── controllers/  # lógica de negócio (.ts)
│   │   │   ├── middlewares/  # auth, validate, errorHandler, adminAuth (.ts)
│   │   │   ├── routes/       # rotas Express (.ts)
│   │   │   ├── services/     # telegram.ts, audit.ts, email (.ts)
│   │   │   ├── lib/          # prisma.ts (singleton)
│   │   │   ├── constants/    # materiaisPadrao.ts
│   │   │   └── app.ts        # Express app (separado do server.ts para testes)
│   │   ├── dist/             # output compilado pelo tsc (gerado no build, não commitar)
│   │   ├── tsconfig.json     # TypeScript backend (strict: true, output em dist/)
│   │   └── __tests__/        # Jest + Supertest
│   └── frontend/
│       ├── src/
│       │   ├── pages/        # uma tela por arquivo (.tsx)
│       │   ├── components/   # componentes reutilizáveis (.tsx)
│       │   ├── services/     # api.ts (Axios com interceptor de refresh token)
│       │   ├── utils/        # format.ts, masks.ts, validators.ts
│       │   ├── types.ts      # todas as interfaces compartilhadas do frontend
│       │   └── types/        # html2pdf.d.ts (declaração de tipos de libs sem @types)
│       ├── public/           # ícones PWA, logo
│       └── tsconfig.json     # TypeScript frontend (noEmit: true — Vite compila, TS só checa tipos)
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
- [x] Recuperação de senha via e-mail (Brevo HTTP API) — `EsqueciSenha.tsx`, `RedefinirSenha.tsx`
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
- [x] PDF download via `html2pdf.js` — `ImprimirOrcamento.tsx` e `Proposta.tsx`
- [x] Nome da Marcenaria (`nomeMarcenaria`) editável no Perfil — aparece no PDF e no WhatsApp
- [x] Materiais padrão de marcenaria (31 itens) — lazy init na primeira listagem do usuário
- [x] Campos select + "Outro (digitar manualmente)": Ambiente, Forma de Pagamento, Categoria, Unidade
- [x] Opções customizadas fixas (`OpcaoCustomizada`) — checkbox "Salvar como opção fixa"
- [x] Notificações Telegram automáticas ao mudar status no Kanban
- [x] Audit Log de ações (criar/editar/excluir/login) — card no Perfil + painel Admin
- [x] PWA: ícones, manifest, service worker com `skipWaiting: true`
- [x] Testes automatizados: `__tests__/auth.test.js` + `__tests__/crossTenant.test.js`

### Fixes e melhorias sessão 24/05/2026

- [x] **Sombra laranja removida dos botões** — removida a `box-shadow` laranja do seletor base `button {}` no `index.css`. Corrige de uma vez os botões "Estoque", "Ver/Imprimir", "Remover foto" e qualquer outro botão sem classe específica. Botões com shadow própria (`.btn-add`) continuam inalterados. `.btn-action` ganhou `box-shadow: none` explícito também.
- [x] **Excluir materiais padrão** — `MaterialController.listar` agora só cria os padrões quando o usuário tem zero materiais (primeira vez). Antes recriava qualquer padrão deletado em toda listagem.
- [x] **Campos de estoque salvando corretamente** — três causas combinadas: (1) `prisma db push` executado para criar as colunas `quantidadeEstoque` e `estoqueMinimo` que existiam no schema mas não no banco; (2) `atualizar` do controller agora desestrutura os campos explicitamente; (3) frontend passa a usar a resposta direta do PUT/POST/PATCH para atualizar o estado local, eliminando race condition com o pooler do Neon.tech (write numa conexão, read em outra antes do commit ser visível). `handleChange` também corrigido para usar forma funcional do setState.
- [x] **`playing_with_neon` removida** — tabela de demo do Neon.tech removida do banco com o `db push` (não era dado do sistema).

### Fixes e melhorias sessão 22/05/2026

- [x] **Layout desktop com sidebar lateral** — menu horizontal do topo convertido em sidebar fixa de 220px na esquerda (`--sidebar-width: 220px`). Conteúdo preenche toda a largura restante. Em telas ≤ 900px reverte para menu horizontal no topo (comportamento anterior). Estrutura: `.app-shell` (flex) → `Menu` sidebar + `.app-main`. Avatar e dropdown de perfil/logout movidos para dentro do `Menu.tsx` como props (`user`, `avatarUrl`, `onLogout`).
- [x] **Botão de materiais no Histórico** — chip/pílula com borda e texto dinâmico "Ver/Ocultar X materiais". Remove `btn-ghost` que herdava `box-shadow` laranja do base `button`. Adiciona label "Materiais:" sempre visível. Fundo azul claro + borda azul quando expandido.

- [x] **Migração para TypeScript — backend completo** — todos os arquivos `src/**/*.js` convertidos para `.ts`. Pacotes instalados: `typescript`, `ts-node`, `ts-jest`, `cross-env`, `@types/*`. `tsconfig.json` com `strict: true`, output em `dist/`. Testes: 14/14 passando. Script `build` atualizado para `npx prisma generate && tsc`. Script `start` aponta para `dist/server.js`.
- [x] **Migração para TypeScript — frontend completo** — todos os arquivos `.jsx`/`.js` convertidos para `.tsx`/`.ts` (26 arquivos, ~3100 linhas). `tsconfig.json` com `noEmit: true` (Vite compila, TS só checa tipos), `strict: true`, `types: ["vite/client"]`. `src/types.ts` centraliza todas as interfaces compartilhadas. `src/types/html2pdf.d.ts` declara tipos do `html2pdf.js`. `tsc --noEmit`: zero erros. Build: sucesso.

### Decisões de arquitetura importantes
- **Banco:** usar `prisma db push` (não `migrate dev`) — o projeto não tem histórico de migrations. Novas colunas exigem `db push` explícito com aprovação do Victor.
- **Email:** Brevo HTTP API via `fetch` nativo — o Render bloqueia a porta 587 (SMTP), então Nodemailer não funciona.
- **PDF:** sempre usar `html2pdf.js` no frontend. O backend tem uma rota `GET /api/orcamentos/:id/pdf` com `pdfkit`, mas não é usada pelo frontend (layout diferente, mantida por precaução).
- **Estilos de impressão:** centralizados no `index.css` em `@media print`. Nunca colocar `.no-print` apenas em `<style>` inline de componente — não funciona no mobile.
- **Testes:** conectam no banco real do Neon.tech (não mockado). O `helpers.ts` deve deletar `AuditLog` antes do `User` na limpeza (FK constraint).

---

## 4. BACKLOG PRIORIZADO

### 🔴 Bugs abertos

- [ ] **Estoque — aguardando validação em produção** — fixes foram feitos (db push + código + estado local) mas ainda não confirmado que está funcionando no Render (deploy pode não ter completado). Testar na próxima sessão.

### ✅ Bugs resolvidos (histórico)

- [x] **Telegram chatId não salva pelo formulário** — resolvido. Campo salva corretamente.
- [x] **Botão "Adicionar Material" — cor azul não aparece no Vercel** — resolvido. Botão aparece azul corretamente.
- [x] **Layout mobile quebrado após sidebar desktop** — resolvido. `.app-shell` é `display: flex` (row por padrão); no mobile o menu voltava ao fluxo (`position: sticky`) mas o conteúdo ficava espremido à direita. Fix: `flex-direction: column` no `.app-shell` dentro do `@media (max-width: 900px)` no `index.css`.

---

### Roadmap de produto — o que falta pra ser competitivo

> Baseado em análise de mercado (22/05/2026). Implementar uma feature por vez com spec antes de começar.

#### 🔴 Fase 1 — Sem isso o sistema é incompleto

- [ ] **Melhoria do PDF de proposta** — o PDF já existe (`html2pdf.js`), mas o layout pode ser mais bonito: logo da marcenaria destacada, cores da marca, tabela de itens bem formatada. *(PDF básico já funciona — isso é refinamento)*
- [ ] **Contrato gerado automaticamente** — quando o orçamento é aprovado no Kanban, gera um contrato simples com dados preenchidos (cliente, valor, prazo, descrição do serviço) pronto pra assinar
- [ ] **Estoque básico de materiais** — marceneiro cadastra quantidade em estoque (MDF, ferragens, acessórios). Ao criar orçamento, o sistema desconta automaticamente do estoque
- [ ] **Alerta de estoque baixo** — avisa quando um material está abaixo de um limite definido pelo marceneiro antes de fechar novo orçamento *(depende do estoque básico)*
- [ ] **Financeiro básico — contas a receber** — por projeto: registrar sinal pago, parcelas, saldo restante. Visualizar situação de pagamento de cada obra

#### 🟡 Fase 2 — Transforma o produto

- [ ] **Ordem de produção em 1 clique** — quando cliente aprova, já cria uma ordem de produção com os dados do orçamento (hoje precisa mover manualmente no Kanban)
- [ ] **Métricas do funil de vendas** — o Kanban já existe, mas precisa de números: total em negociação, aprovados no mês, perdidos, valor médio
- [ ] **Taxa de conversão** — relatório "de X orçamentos enviados, Y viraram venda" — referência valiosa pro marceneiro
- [ ] **Rentabilidade por projeto** — lucro real por obra descontando material e mão de obra *(depende do financeiro básico da Fase 1)*
- [ ] **Fluxo de caixa** — projeção do dinheiro que vai entrar nos próximos 30/60/90 dias com base nos projetos em andamento

#### 🟢 Fase 3 — Diferencial competitivo

- [ ] **WhatsApp via EvolutionAPI** — notificações automáticas pro cliente em cada etapa (substituir Telegram, que já está implementado). Já estava no backlog.
- [ ] **Assinatura digital do contrato** — cliente assina pelo celular sem imprimir. Requer integração com ClickSign ou DocuSign (serviços pagos)
- [ ] **Galeria de projetos concluídos** — marceneiro cadastra fotos das obras pra mostrar na proposta
- [ ] **Catálogo de ambientes** — modelos prontos (cozinha, quarto, sala) com materiais e valores pré-calculados pra agilizar orçamento *(relacionado aos materiais padrão já existentes)*
- [ ] **App nativo (Play Store)** — hoje o PWA já funciona como app; publicar na Play Store dá credibilidade mas é bastante trabalho. Deixar por último.

---

### 🟡 Outros itens

- [ ] **Notificações push PWA** — service worker existe mas não tem push notifications implementado
- [ ] **Planos e billing** — freemium vs pago; Stripe ou Pagar.me
- [x] **TypeScript** — migração completa: backend (22/05/2026) + frontend (22/05/2026)

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
- Se a sessão trouxe mudanças estruturais, atualize também as seções afetadas: Stack, Estrutura de pastas, Decisões de arquitetura, Convenções — qualquer campo que ficou desatualizado em relação ao que foi feito
- Faça commit e push de tudo que ficou pendente

### Regras críticas para banco de dados
O projeto usa `prisma db push` (não `prisma migrate dev`) porque o banco foi criado sem histórico de migrations. Isso significa:
- Toda alteração de schema precisa de aprovação explícita do Victor antes de rodar
- `prisma db push` modifica o banco de produção real — não existe "ambiente de teste separado"
- **Nunca** usar `--accept-data-loss` sem mostrar ao Victor exatamente o que será apagado

### Se o contexto da sessão estiver acabando
- Pare, atualize este `CLAUDE.md` com o estado atual
- Avise o Victor: "Contexto próximo do limite — atualizei o CLAUDE.md. Recomendo continuar numa nova sessão."
