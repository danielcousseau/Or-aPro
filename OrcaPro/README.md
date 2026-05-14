# OrçaPro - Marcenaria Planner

Sistema completo para gestão de orçamentos e acompanhamento de projetos para marcenarias. Inclui cadastro de clientes, controle de materiais, precificação, dashboard gerencial e kanban de produção.

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas na sua máquina:
- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org/en/) (Recomendamos baixar a versão LTS mais recente)
- Um editor de código, como o [VS Code](https://code.visualstudio.com/)

## 🚀 Passo a Passo para Instalação e Execução

O projeto é dividido em duas partes principais: o **Backend** (servidor e banco de dados) e o **Frontend** (interface que o usuário interage). 
**Você precisará rodar ambas as partes simultaneamente, em terminais separados.**

---

### 1. Configurando e Rodando o Backend (Servidor)
O backend fornece e gerencia os dados do sistema.

1. Abra o terminal e navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências necessárias:
   ```bash
   npm install
   ```
3. Configure o Banco de Dados criando um arquivo chamado `.env` na pasta `backend` com as suas credenciais. Exemplo:
   ```env
   DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/orcapro?schema=public"
   JWT_SECRET="segredo_super_seguro_orcamento"
   ```
4. Sincronize as tabelas do banco de dados e rode a semente (seed) para gerar o usuário administrador inicial e dados de teste:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
5. Inicie o servidor:
   ```bash
   npm run dev
   ```
   *O servidor ficará rodando. Deixe este terminal aberto.*

---

### 2. Configurando e Rodando o Frontend (Interface Visual)
O frontend é a aplicação React onde o usuário navega.

1. Abra um **novo terminal** e navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências da interface:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do frontend:
   ```bash
   npm run dev
   ```
4. Após rodar o comando, o terminal exibirá um link (geralmente `http://localhost:5173/` ou similar). Segure a tecla `Ctrl` e clique no link para abrir o sistema no seu navegador.

---

## 🔑 Primeiro Acesso
Após iniciar o frontend e o backend, você será redirecionado para a tela de Login. Utilize as credenciais padrão geradas pelo sistema para entrar:
- **Usuário:** `admin`
- **Senha:** `ninguemsabe`

## 📦 Tecnologias Utilizadas
- **Frontend:** React, React Router Dom, Chart.js (Gráficos), Axios.
- **Backend:** Node.js, Express, Prisma (ORM), Zod (Validação), JSON Web Token (Autenticação), BcryptJS (Criptografia).