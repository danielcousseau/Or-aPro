# OrçaPro - Sistema de Gestão para Marcenarias (SaaS)

Sistema web completo, responsivo e em nuvem para gestão de orçamentos, acompanhamento de projetos e emissão de propostas para marcenarias. O sistema inclui cadastro de clientes, controle de materiais, cálculos inteligentes de precificação (Markup/Mão de Obra/Lucros), dashboard gerencial e geração de link seguro para envio da proposta em PDF/WhatsApp.

## Arquitetura e Hospedagem
O projeto foi modernizado para uma arquitetura Cloud-First (SaaS):
- **Frontend:** Hospedado na Vercel (Serverless, alta velocidade e deploy contínuo).
- **Backend (API):** Hospedado no Render (Node.js REST API).
- **Banco de Dados:** PostgreSQL hospedado na Neon.tech (Serverless Postgres).
- **Mobile (PWA):** O sistema possui tecnologia Progressive Web App, permitindo instalação direta na tela inicial de smartphones (Android e iOS) com visual de aplicativo nativo.

---

## Como acessar o sistema em produção
Como o sistema agora está na nuvem e funciona no modelo de contas individuais (Multi-tenant):
1. Acesse o link oficial do projeto na Vercel (Ex: https://seu-projeto.vercel.app).
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
3. Crie um arquivo chamado `.env` e aponte para o seu banco de dados na Neon.tech:
   ```env
   DATABASE_URL="postgresql://usuario:senha@ep-nome-do-banco.region.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="segredo_super_seguro_orcamento"
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

## Ferramentas do Administrador
Como não há recuperação de senha por e-mail no momento, foi criado um script local na raiz do Backend (`reset-senha.js`) que se conecta diretamente ao banco em produção. Se um funcionário ou cliente perder a senha, basta executar `node reset-senha.js` no seu VS Code local para injetar uma senha temporária criptografada de forma segura.

## Tecnologias Utilizadas
- **Frontend:** React, Vite, React Router Dom, Chart.js, Vite PWA Plugin, CSS puro (Design System próprio).
- **Backend:** Node.js, Express, Prisma ORM, CORS.
- **Segurança:** JSON Web Token (JWT) para Sessões, BcryptJS (Hash de Senhas).
