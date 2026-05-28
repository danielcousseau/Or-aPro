# Deploy e Infraestrutura do OrcaPro

## Visão geral

O OrcaPro tem três partes separadas, cada uma hospedada em um serviço diferente:

```
Usuário (browser)
      ↓
  Vercel (frontend React)
      ↓ chamadas de API
  Render (backend Node.js)
      ↓ queries
  Neon.tech (banco PostgreSQL)
```

## Frontend — Vercel

**O que é:** O Vercel é um serviço que hospeda o site React. Quando o usuário acessa `orca-pro-seven.vercel.app`, ele recebe os arquivos do frontend do Vercel.

**Deploy:** Automático a cada push na branch `main` do GitHub. O Vercel detecta o push e faz o build (`npm run build`) sozinho.

**Variáveis de ambiente configuradas no painel do Vercel:**
- `VITE_API_URL` — URL do backend no Render (o frontend usa isso para saber para onde enviar as requisições)
- Chaves do Cloudflare Turnstile (captcha)

## Backend — Render

**O que é:** O Render hospeda o servidor Node.js/Express. Processa requisições, acessa o banco de dados, envia emails, etc.

**Deploy:**
- O Render tem auto-deploy nativo, mas no plano gratuito é **instável** (frequentemente ignora pushes)
- Solução definitiva: GitHub Actions (`ci.yml`) dispara o deploy manualmente via **Deploy Hook** após os testes passarem
- O Deploy Hook é uma URL secreta do Render que, quando chamada, força o início de um novo deploy

**Tempo de deploy:** 3–7 minutos. Durante esse tempo, rotas novas retornam `Cannot GET /rota` (o servidor antigo ainda está rodando). Isso não é bug — é a janela de transição.

**Variáveis de ambiente configuradas no painel do Render:**
- `DATABASE_URL` — URL de conexão com o banco (via pooler do Neon.tech)
- `DIRECT_URL` — URL direta do banco (sem pooler — necessário para operações de schema)
- `JWT_SECRET` — chave para assinar tokens de autenticação
- `BREVO_API_KEY` — chave da API de email
- `TELEGRAM_BOT_TOKEN` — token do bot de notificações
- Chaves do Cloudflare Turnstile

## Banco de dados — Neon.tech

**O que é:** O Neon.tech hospeda o banco de dados PostgreSQL de forma "serverless" (dorme quando não está em uso, acorda quando recebe uma conexão).

**Projeto:** `neondb`, schema `public`

**Duas URLs importantes:**
- `DATABASE_URL` — URL do pooler (gerenciador de conexões). Usar para queries normais
- `DIRECT_URL` — URL direta. Usar apenas para `prisma db push` (alterações de schema)

**Por que duas URLs?** O Neon.tech usa um pooler (PgBouncer) que otimiza as conexões. Mas o PgBouncer não suporta alguns comandos DDL (que criam/alteram tabelas). Por isso o Prisma precisa da URL direta para aplicar mudanças de schema.

## CI/CD — GitHub Actions

**Arquivo:** `.github/workflows/ci.yml`

**O que faz a cada push na `main`:**
1. Instala dependências (`npm install`)
2. Roda os testes (`npm test`) — conecta no banco real do Neon.tech
3. Se os testes passarem: dispara o deploy no Render via Deploy Hook (`curl`)
4. Se os testes falharem: o deploy NÃO acontece (código com erro não sobe para produção)

**Secrets configurados no GitHub** (em Settings → Secrets and variables → Actions):
- `DATABASE_URL` — para os testes
- `DIRECT_URL` — para os testes
- `JWT_SECRET` — para os testes
- `RENDER_DEPLOY_HOOK` — URL que dispara o deploy no Render

## Como aplicar mudanças no banco de dados

O OrcaPro usa `prisma db push` (não `prisma migrate dev`) porque foi criado sem histórico de migrations.

**Fluxo obrigatório:**
1. Editar `OrcaPro/backend/prisma/schema.prisma`
2. Mostrar o diff para Victor e explicar o que vai mudar
3. Aguardar aprovação
4. Rodar `npx prisma db push` com as variáveis corretas configuradas
5. **Nunca** usar `--accept-data-loss` sem aprovação explícita e lista do que será perdido

**Rodar localmente:**
```bash
cd OrcaPro/backend
# Renomear prisma.config.ts temporariamente (causa conflito)
npm install
npx prisma db push
```

## Debugar deploy com problema

**Sintoma:** rota nova retorna 404 ou `Cannot GET /rota` mesmo após push.

**Checklist:**
1. Aguardar 3–7 min — pode ser que o deploy ainda não terminou
2. Verificar no painel do Render se o deploy finalizou com sucesso
3. Se finalizou mas rota ainda não funciona: rodar `npx tsc --noEmit` localmente para verificar erros de TypeScript
   ```bash
   cd OrcaPro/backend
   npm install
   npx tsc --noEmit
   ```
4. Erro de TypeScript no build faz o Render manter a versão antiga do código no ar (build falha silenciosamente)

## Monitoramento

- **Logs do backend:** painel do Render → serviço → Logs
- **Logs de deploy:** GitHub Actions → aba Actions → último workflow
- **Banco de dados:** painel do Neon.tech → projeto neondb → Tables
