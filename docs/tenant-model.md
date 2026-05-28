# Modelo Multi-Tenant do OrcaPro

## O que é multi-tenant?

Imagine um prédio de apartamentos: cada apartamento (tenant = inquilino) tem a sua chave e não consegue entrar no apartamento do vizinho. No OrcaPro, cada marcenaria é um "apartamento" — um marceneiro não consegue ver os clientes, orçamentos ou materiais de outro marceneiro.

Tecnicamente: **todos os dados ficam no mesmo banco de dados**, mas cada registro tem um campo `userId` que identifica o dono. Toda consulta ao banco **obrigatoriamente** filtra por esse `userId`.

## Como funciona na prática

### 1. Login cria o identificador do tenant

Quando o marceneiro faz login, o backend gera um **JWT** (uma espécie de crachá digital) contendo o `userId` daquele marceneiro. Esse crachá é enviado em todo request subsequente.

```
Marceneiro faz login
   → Backend valida senha
   → Gera JWT com { userId: 42 }
   → Frontend guarda o JWT
   → Todo request usa esse JWT no header: Authorization: Bearer <jwt>
```

### 2. Middleware de autenticação extrai o userId

Em `backend/src/middlewares/auth.ts`, todo request autenticado passa por uma verificação que:
1. Lê o JWT do header `Authorization` (ou do cookie `accessToken`)
2. Valida a assinatura e a validade
3. Injeta `req.userId` na requisição para os controllers usarem

```typescript
// Exemplo simplificado do que o middleware faz:
req.userId = jwtPayload.userId; // agora todos os controllers têm acesso
```

### 3. Controllers filtram SEMPRE por userId

**Regra absoluta:** toda query Prisma que busca dados do marceneiro DEVE ter `where: { userId: req.userId }`.

```typescript
// CORRETO — garante isolamento
const clientes = await prisma.cliente.findMany({
  where: { userId: req.userId }
});

// ERRADO — vaza dados de todos os marceneiros
const clientes = await prisma.cliente.findMany();
```

### 4. Validação cross-tenant

Quando um marceneiro tenta criar/editar um orçamento referenciando um cliente, o backend verifica se aquele cliente realmente pertence ao marceneiro:

```typescript
// Em OrcamentoController — validação cross-tenant
const cliente = await prisma.cliente.findFirst({
  where: {
    id: clienteId,
    userId: req.userId  // ← confirma que o cliente é dono deste marceneiro
  }
});

if (!cliente) {
  throw new Error('Cliente não encontrado ou não pertence a você');
}
```

Sem essa verificação, um marceneiro poderia criar orçamentos usando o ID de um cliente de outro marceneiro (ataque de referência cruzada, também chamado IDOR — Insecure Direct Object Reference).

## Tabelas e isolamento

| Tabela | Campo de isolamento | Observação |
|---|---|---|
| `Cliente` | `userId` | Direto |
| `Orcamento` | `userId` | Direto |
| `Material` | `userId` | Direto |
| `OpcaoCustomizada` | `userId` | Direto |
| `Pagamento` | via `Orcamento.userId` | Indireto — buscar orçamento antes |
| `AuditLog` | `userId` | Direto |
| `User` | `id` | É o próprio tenant |

## Rotas públicas (sem autenticação)

Algumas rotas são intencionalmente públicas — o cliente final acessa sem precisar de conta:

- `GET /api/orcamentos/proposta/:token` — visualiza a proposta comercial
- `GET /api/orcamentos/contrato/:token` — visualiza o contrato
- `PATCH /api/orcamentos/contrato/:token/aceitar` — cliente assina o contrato

Essas rotas usam **tokens únicos** (UUIDs) como "chave de acesso" ao invés de autenticação completa. O token é gerado pelo backend e enviado ao cliente via WhatsApp.

## Como adicionar uma nova feature com isolamento correto

Checklist para qualquer nova tabela ou endpoint:

1. **Nova tabela:** adicionar campo `userId Int` com `@relation` para `User`
2. **Listar:** sempre `where: { userId: req.userId }`
3. **Buscar por ID:** sempre `where: { id, userId: req.userId }` — nunca só por `id`
4. **Criar:** sempre incluir `userId: req.userId` no `data`
5. **Editar/Deletar:** sempre verificar que o registro pertence ao `req.userId` antes de modificar
6. **Referências cruzadas:** se um registro B referencia um registro A de outra tabela, verificar que A pertence ao mesmo `userId`
