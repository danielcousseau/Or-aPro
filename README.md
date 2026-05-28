# OrçaPro - Sistema de Gestão para Marcenarias (SaaS)

Sistema web SaaS completo para gestão de marcenarias. Inclui cadastro de clientes, orçamentos com materiais e mão de obra, controle de estoque, módulo financeiro (contas a receber, rentabilidade por projeto), dashboard gerencial, Kanban de produção com drag-and-drop, geração de proposta e contrato digital para o cliente, notificações automáticas via Telegram e geração de PDF personalizado com logo da marcenaria.

## Arquitetura e Hospedagem
O projeto foi modernizado para uma arquitetura Cloud-First (SaaS):
- **Frontend:** Hospedado na Vercel (Serverless, alta velocidade e deploy contínuo).
- **Backend (API):** Hospedado no Render (Node.js REST API).
- **Banco de Dados:** PostgreSQL hospedado na Neon.tech (Serverless Postgres).
- **Mobile (PWA):** O sistema possui tecnologia Progressive Web App, permitindo instalação direta na tela inicial de smartphones (Android e iOS) com visual de aplicativo nativo.

---

## Como acessar o sistema em produção
Como o sistema agora está na nuvem e funciona no modelo de contas individuais (Multi-tenant):
1. Acesse o link oficial: https://orca-pro-seven.vercel.app
2. Clique em **"Criar Conta"** para registrar sua marcenaria.
3. Faça login com suas novas credenciais.
4. *(No celular)*: Clique em "Adicionar à Tela Inicial" pelo navegador para instalar o App do OrçaPro.

---

## Como Desenvolver Localmente

Caso deseje rodar o código no seu computador para adicionar novas funcionalidades, siga os passos abaixo. É necessário ter o Node.js instalado.

### 1. Backend (API)
1. Abra o terminal e navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo chamado `.env` na pasta `backend/`:
   ```env
   DATABASE_URL="postgresql://usuario:senha@ep-nome-do-banco.region.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="uma_string_aleatoria_longa_e_segura"
   JWT_REFRESH_SECRET="outra_string_aleatoria_diferente_da_de_cima"
   FRONTEND_URL="http://localhost:5173"
   BREVO_API_KEY="xkeysib-..."
   EMAIL_FROM="seu@email.com"
   ```
4. Sincronize o banco e inicie o servidor:
   ```bash
   npx prisma db push
   npm run dev
   ```

### 2. Frontend (Interface React)
1. Abra um novo terminal na pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale e inicie o Vite:
   ```bash
   npm install
   npm run dev
   ```

## Recuperação de Senha
O sistema possui fluxo de recuperação de senha via e-mail (Brevo): o usuário clica em "Esqueci a senha" na tela de login, recebe um link por e-mail e redefine a senha. O link expira assim que a senha é alterada.

## Tecnologias Utilizadas
- **Frontend:** React + TypeScript, Vite, React Router Dom, Chart.js, Vite PWA Plugin, html2pdf.js, CSS puro (Design System próprio).
- **Backend:** Node.js + TypeScript, Express 5, Prisma ORM, Zod (validação), express-rate-limit, Helmet.js.
- **Segurança:** JWT (access token 15min + refresh token 7d), BcryptJS, rate limiting, isolamento multi-tenant, Cloudflare Turnstile no cadastro, CSP via vercel.json.
- **Integrações:** Brevo (e-mail de recuperação de senha), Telegram Bot API (notificações de status ao cliente).
- **Infra:** Vercel (frontend) + Render (backend) + Neon.tech (PostgreSQL serverless) + GitHub Actions (CI/CD).
