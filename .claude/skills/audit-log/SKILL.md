---
name: audit-log
description: Use whenever the user asks how to register an audit event, add logging to a new action, understand what the AuditLog table records, or implement LGPD-compliant activity tracking in OrcaPro. The AuditLog table and audit.ts service already exist — just call the function.
---

# Audit Log — Padrão OrcaPro

O OrcaPro já tem auditoria implementada. A tabela `AuditLog` e o serviço `audit.ts` existem em produção. Para registrar uma nova ação, basta chamar a função `registrarAuditoria`.

## O que já existe

```
OrcaPro/backend/src/services/audit.ts    ← função registrarAuditoria()
OrcaPro/backend/prisma/schema.prisma     ← model AuditLog
```

## Model no banco

```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  acao      String   // ex: 'CRIAR_ORCAMENTO', 'LOGIN', 'EXCLUIR_CLIENTE'
  detalhes  String?  // JSON stringificado com contexto adicional
  ip        String?
  criadoEm DateTime @default(now())

  @@index([userId])
  @@index([criadoEm])
}
```

## Como registrar uma nova ação

```typescript
import { registrarAuditoria } from "../services/audit";

// Dentro de um controller, após a operação principal:
await registrarAuditoria({
  userId: req.userId,
  acao: "CRIAR_ORCAMENTO",
  detalhes: JSON.stringify({
    orcamentoId: novoOrcamento.id,
    titulo: novoOrcamento.titulo,
  }),
  ip: req.ip,
});
```

> Não lançar erro se a auditoria falhar — ela é secundária. Usar try/catch separado ou deixar rejeição não tratada (não bloqueia a resposta principal).

## Nomenclatura das ações (convenção do projeto)

```
VERBO_SUBSTANTIVO em maiúsculas com underscore

Autenticação:
  LOGIN, LOGOUT, REGISTRAR, RECUPERAR_SENHA, REDEFINIR_SENHA

Orçamentos:
  CRIAR_ORCAMENTO, EDITAR_ORCAMENTO, EXCLUIR_ORCAMENTO
  MUDAR_STATUS_ORCAMENTO, GERAR_CONTRATO, ACEITAR_CONTRATO

Clientes:
  CRIAR_CLIENTE, EDITAR_CLIENTE, EXCLUIR_CLIENTE

Materiais:
  CRIAR_MATERIAL, EDITAR_MATERIAL, EXCLUIR_MATERIAL, AJUSTAR_ESTOQUE

Financeiro:
  REGISTRAR_PAGAMENTO, EXCLUIR_PAGAMENTO

Perfil:
  ATUALIZAR_PERFIL, UPLOAD_LOGO, REMOVER_LOGO
```

## Quais ações DEVEM ser auditadas (LGPD)

Obrigatório auditar:

- Login e logout
- Criação, edição e exclusão de qualquer dado de cliente
- Aceite de contrato (registro legal)
- Qualquer ação de admin (acesso ao painel admin)

Recomendado auditar:

- Criação e mudança de status de orçamentos
- Ajustes de estoque
- Registro e exclusão de pagamentos

Não é necessário auditar:

- Listagens e leituras (GET sem alteração)
- Ações internas do sistema (lazy init de materiais padrão)

## Limpeza em testes (armadilha conhecida)

O `AuditLog` tem FK para `User`. Ao limpar dados de teste, **sempre deletar AuditLog antes de User**:

```typescript
// helpers.ts
export async function limparDadosTeste(emails: string[]) {
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);

  // ORDEM OBRIGATÓRIA: AuditLog antes de User (FK constraint)
  await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
```

## Checklist ao adicionar nova ação auditável

- [ ] Ação registrada com nomenclatura em VERBO_SUBSTANTIVO maiúsculo?
- [ ] `detalhes` inclui contexto suficiente para rastrear o que mudou (IDs, valores relevantes)?
- [ ] IP do request incluído (`req.ip`)?
- [ ] Auditoria chamada APÓS a operação principal ter sucesso (não antes)?
- [ ] Em testes, `AuditLog` está sendo deletado antes de `User` no cleanup?
