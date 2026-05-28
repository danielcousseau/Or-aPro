# Glossário para o Victor

Este arquivo explica os termos técnicos usados no projeto em linguagem simples.
Se aparecer um termo que não está aqui, me pergunte e adiciono.

---

## Termos de infraestrutura

**API (Application Programming Interface)**
É como um garçom entre o frontend e o backend. O frontend faz um pedido (ex: "me dá a lista de clientes"), a API leva esse pedido para o backend, e traz a resposta de volta.

**Backend**
A parte do sistema que o usuário não vê. Fica no servidor, cuida da lógica de negócio (cálculos, regras), acessa o banco de dados e retorna dados para o frontend. No OrcaPro, é o código Node.js rodando no Render.

**Banco de dados (PostgreSQL)**
Um programa especializado em armazenar e recuperar dados de forma organizada, tipo uma planilha Excel gigante mas muito mais poderosa. O Neon.tech hospeda o banco do OrcaPro.

**Build**
O processo de transformar o código-fonte (que os desenvolvedores escrevem) em arquivos otimizados para o browser ou servidor. É como "compilar" o projeto em algo que pode rodar em produção.

**CI/CD (Continuous Integration / Continuous Deployment)**
Um sistema automático que roda os testes e faz o deploy toda vez que você sobe código novo. No OrcaPro, o GitHub Actions faz isso: se os testes passarem, sobe automaticamente para produção.

**Deploy**
Enviar a versão mais recente do código para o servidor de produção, onde os usuários reais acessam.

**Frontend**
A parte do sistema que o usuário vê e interage — botões, formulários, telas. No OrcaPro, é o código React rodando no Vercel.

**Hospedagem / Servidor**
Um computador (geralmente em um data center) que fica ligado 24h e serve o sistema para os usuários. Render hospeda o backend, Vercel hospeda o frontend.

**Produção (prod)**
O ambiente real, onde os usuários de verdade acessam o sistema. Diferente do ambiente local (sua máquina) ou de desenvolvimento.

**PWA (Progressive Web App)**
Um site que se comporta como um aplicativo. Pode ser "instalado" na tela inicial do celular, funciona offline (parcialmente), e tem ícones próprios.

---

## Termos de código

**`async/await`**
Forma de lidar com operações que demoram (como buscar dados do banco). O `await` faz o código "esperar" a resposta antes de continuar, sem travar tudo.

**Controller**
Arquivo que contém a lógica de negócio de uma parte do sistema. Por exemplo, `OrcamentoController.ts` tem as funções de criar, editar e listar orçamentos.

**JWT (JSON Web Token)**
É como um crachá digital. Quando você faz login, o servidor emite um JWT com seu ID. Você apresenta esse crachá em todo request subsequente para provar quem você é. O crachá tem data de validade.

**Middleware**
Código que fica "no meio" do caminho de uma requisição. Por exemplo, o middleware de autenticação verifica o JWT antes de deixar a requisição chegar no controller.

**Migration / `prisma db push`**
Formas de aplicar mudanças no banco de dados (criar tabelas, adicionar colunas). O OrcaPro usa `prisma db push` porque é mais simples — mostra o diff e aplica diretamente.

**`npm`**
O gerenciador de pacotes do Node.js. É como uma "loja de aplicativos" para bibliotecas de código. `npm install` baixa as dependências; `npm run <comando>` executa scripts.

**ORM (Prisma)**
Uma camada que transforma código TypeScript em queries SQL. Em vez de escrever `SELECT * FROM clientes WHERE userId = 42`, você escreve `prisma.cliente.findMany({ where: { userId: 42 } })`.

**React**
Uma biblioteca JavaScript para construir interfaces de usuário. Você descreve como a tela deve parecer em diferentes estados, e o React cuida de atualizar o DOM (o que aparece no browser) quando os dados mudam.

**Rate Limiting**
Um limite de quantas vezes alguém pode fazer a mesma requisição em um período. Por exemplo, máximo 10 tentativas de login por 15 minutos. Evita ataques automatizados.

**Request / Response**
Um request é uma pergunta que o frontend faz para o backend ("me dá os clientes"). A response é a resposta do backend ("aqui estão os clientes: [...]").

**REST**
Um estilo de organizar as rotas de uma API usando verbos HTTP: GET (buscar), POST (criar), PUT/PATCH (editar), DELETE (deletar).

**Schema (Prisma)**
O arquivo `schema.prisma` que define as tabelas do banco — quais colunas cada tabela tem, quais são obrigatórias, quais relacionamentos existem.

**TypeScript**
Uma extensão do JavaScript que adiciona "tipos" ao código. Em vez de descobrir na hora de rodar que uma variável não era o que você esperava, o TypeScript detecta esses erros antes, durante o desenvolvimento.

---

## Termos de segurança

**Cross-tenant**
"Cruzar os dados entre marcenarias". Um ataque cross-tenant seria um marceneiro conseguir ver os dados de outro. A validação cross-tenant previne isso.

**Hashing de senha**
Transformar a senha em uma sequência de caracteres irreconhecível (hash). O banco nunca armazena a senha real — só o hash. Quando o usuário faz login, a senha digitada é hasheada e comparada com o hash armazenado.

**httpOnly cookie**
Um cookie que o JavaScript da página não consegue ler — só o browser envia automaticamente para o servidor. Mais seguro porque código malicioso injetado na página não consegue roubar.

**IDOR (Insecure Direct Object Reference)**
Uma vulnerabilidade onde um usuário acessa recursos de outro usuário simplesmente trocando um ID na URL. Por exemplo, `/api/orcamentos/123` quando o orçamento 123 pertence a outro marceneiro. A validação cross-tenant previne isso.

**Rate limit**
Ver acima em "Termos de código".

**Token**
Uma string longa e aleatória usada como "chave de acesso". No OrcaPro há vários tipos: JWT (autenticação), `contratoToken` (link único do contrato), `propostaToken` (link da proposta).

**Variáveis de ambiente (`.env`)**
Configurações sensíveis (senhas, chaves de API) que ficam fora do código, em um arquivo separado. Nunca vão para o Git. Cada ambiente (local, produção) tem seu próprio `.env`.

---

## Termos de banco de dados

**FK Constraint (Foreign Key)**
Uma regra que diz "esse campo deve referenciar um registro existente em outra tabela". Por exemplo, um `AuditLog` não pode existir sem um `User` correspondente. Por isso, ao deletar dados de teste, é preciso deletar `AuditLog` antes do `User`.

**Pooler (PgBouncer)**
Um gerenciador de conexões do banco. Em vez de cada request do servidor abrir uma conexão nova com o banco (caro e lento), o pooler mantém um conjunto de conexões abertas e as reutiliza. O Neon.tech usa PgBouncer, mas ele não suporta operações DDL — daí a necessidade da `DIRECT_URL`.

**Schema (banco)**
No contexto do PostgreSQL, um schema é um namespace (agrupamento) de tabelas. O OrcaPro usa o schema `public` (padrão).

**Serverless**
O banco "dorme" quando não há requisições e "acorda" quando recebe uma. Economiza recursos mas pode ter uma demora de "cold start" na primeira requisição após um período de inatividade.
