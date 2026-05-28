---
name: tenant-isolation
description: Use whenever the user asks how to implement tenant isolation, add a new Prisma query, create a new controller, or ensure a user can only see their own data. Provides the standard AsyncLocalStorage + middleware + Prisma extension pattern for OrcaPro.
---

# Tenant Isolation — Padrão OrcaPro

Cada marceneiro (tenant) só pode ver e modificar seus próprios dados. O isolamento é garantido em duas camadas: middleware de auth que extrai o `userId` do JWT, e filtro obrigatório em toda query Prisma.

## Camada 1 — Middleware de autenticação

O middleware `auth.ts` já existe em `OrcaPro/backend/src/middlewares/auth.ts`. Ele:

1. Lê o JWT do cookie `accessToken` (ou header `Authorization`)
2. Verifica e decodifica o token
3. Injeta `req.userId` (number) para uso nos controllers

**Toda rota autenticada deve ter esse middleware:**

```typescript
// src/routes/exemploRoutes.ts
import { auth } from "../middlewares/auth";

router.get("/", auth, ExemploController.listar);
router.post("/", auth, ExemploController.criar);
router.patch("/:id", auth, ExemploController.atualizar);
router.delete("/:id", auth, ExemploController.deletar);
```

## Camada 2 — Filtro em toda query Prisma

### Listar (findMany)

```typescript
const itens = await prisma.exemplo.findMany({
  where: { userId: req.userId },
});
```

### Buscar por ID (findFirst — não findUnique)

```typescript
// findFirst com userId garante que o registro pertence ao tenant
const item = await prisma.exemplo.findFirst({
  where: { id: Number(req.params.id), userId: req.userId },
});
if (!item) return res.status(404).json({ error: "Não encontrado" });
```

### Criar

```typescript
const item = await prisma.exemplo.create({
  data: {
    ...dadosValidados,
    userId: req.userId,
  },
});
```

### Atualizar

```typescript
// where com id E userId — evita que tenant A edite dados do tenant B
const item = await prisma.exemplo.update({
  where: { id: Number(req.params.id), userId: req.userId },
  data: dadosValidados,
});
```

### Deletar

```typescript
const item = await prisma.exemplo.delete({
  where: { id: Number(req.params.id), userId: req.userId },
});
```

## Validação cruzada entre entidades

Quando um recurso referencia outro (ex: orçamento usa clienteId), verificar que o cliente também pertence ao mesmo tenant:

```typescript
// Antes de criar/atualizar o orçamento:
const cliente = await prisma.cliente.findFirst({
  where: { id: clienteId, userId: req.userId },
});
if (!cliente) {
  return res.status(404).json({ error: "Cliente não encontrado" });
}
```

## Schema Prisma — novo model com isolamento

Todo novo model que contém dados de tenant deve ter campo `userId`:

```prisma
model Exemplo {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  nome      String
  criadoEm DateTime @default(now())

  @@index([userId])
}
```

O `@@index([userId])` é obrigatório — toda query filtra por `userId` e o índice garante performance.

## Checklist antes de commitar

- [ ] Rota tem middleware `auth`?
- [ ] `findMany` tem `where: { userId: req.userId }`?
- [ ] `findFirst`/`findUnique` por ID também filtra `userId`?
- [ ] `create` inclui `userId: req.userId` no `data`?
- [ ] `update`/`delete` filtra por `id` E `userId`?
- [ ] Validação cruzada feita para entidades relacionadas?
- [ ] Novo model no schema tem campo `userId` e `@@index([userId])`?
