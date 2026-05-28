# Spec: Estoque Básico de Materiais

> **Status:** Rascunho
> **Data:** 2026-05-22
> **Autor:** Victor / Claude

---

## Problema

O marceneiro cadastra materiais (MDF, ferragens, dobradiças, etc.) e usa esses materiais nos orçamentos — mas o sistema não sabe quantos desses materiais ele tem em estoque. Resultado: ele pode fechar um orçamento prometendo materiais que não tem, ou comprar material que já existe na marcenaria porque não tem controle visual.

---

## Solução

Adicionar dois campos ao cadastro de cada material: **quantidade em estoque** e **estoque mínimo** (o limite abaixo do qual o sistema avisa que está acabando).

Quando o marceneiro **salvar um orçamento**, o sistema desconta automaticamente a quantidade usada no orçamento do estoque de cada material.

Na tela de Materiais, cada material exibe seu estoque atual. Materiais abaixo do mínimo aparecem com destaque visual (ícone de alerta + cor de aviso).

---

## Usuários afetados

Apenas o **marceneiro** (usuário logado). Cada marceneiro vê e controla apenas o seu próprio estoque — isolamento multi-tenant já garantido pelo `userId`.

---

## Fluxos

### Fluxo 1 — Configurar estoque de um material

1. Marceneiro abre a tela **Materiais**
2. Clica em editar um material existente (ou cria um novo)
3. Preenche o campo **"Estoque atual"** (ex: 15 chapas) e **"Estoque mínimo"** (ex: 3 chapas)
4. Salva — campos ficam registrados no banco
5. Na listagem, o material agora exibe o estoque atual ao lado do nome

### Fluxo 2 — Desconto automático ao salvar orçamento

1. Marceneiro abre um orçamento e adiciona materiais com quantidades
2. Clica em **Salvar orçamento**
3. O sistema desconta a quantidade de cada material do seu estoque
   - Ex: orçamento usa 4 chapas de MDF → estoque de MDF cai de 15 para 11
4. Se algum material ficar **abaixo do mínimo** após o desconto, um aviso aparece na tela: _"Atenção: MDF 15mm está com estoque baixo (2 unidades)"_

### Fluxo 3 — Ajuste manual de estoque (reabastecimento)

1. Marceneiro recebeu material novo e quer atualizar o estoque
2. Na tela de Materiais, clica em **"Ajustar estoque"** no material desejado
3. Informa a nova quantidade (sobrescreve o valor atual)
4. Salva — estoque atualizado

### Fluxo 4 — Visualizar alertas de estoque baixo

1. Na tela de Materiais, materiais com `quantidadeEstoque < estoqueMinimo` aparecem com:
   - Ícone ⚠️ ao lado do nome
   - Fundo ou texto na cor de aviso (`var(--warning)` ou vermelho suave)
2. Opcional: contador no menu lateral mostrando "X materiais em alerta"

---

## Critérios de aceitação

- [ ] Campo `quantidadeEstoque` e `estoqueMinimo` existem no banco na tabela `Material`
- [ ] Ambos os campos são opcionais (material sem estoque configurado não quebra nada)
- [ ] Tela de Materiais exibe o estoque atual de cada material
- [ ] Materiais com estoque abaixo do mínimo têm destaque visual claro na listagem
- [ ] Ao salvar um orçamento com materiais, o estoque é descontado automaticamente no backend
- [ ] O desconto ocorre apenas uma vez por orçamento (não desconta de novo se o orçamento for editado depois)
- [ ] Marceneiro consegue ajustar estoque manualmente a qualquer momento
- [ ] Zero impacto em orçamentos que usam materiais sem estoque configurado

---

## Fora do escopo desta versão

- **Histórico de movimentações** — não vamos rastrear cada entrada/saída de estoque (isso seria um "livro de estoque"); só o saldo atual
- **Bloqueio de orçamento** — o sistema avisa sobre estoque baixo, mas **não impede** o marceneiro de fechar o orçamento mesmo sem estoque suficiente
- **Estoque de materiais não cadastrados** — só controla materiais que existem na tabela `Material` do usuário
- **Notificação Telegram por estoque baixo** — fica para a feature de alertas dedicada (backlog)
- **Estorno de estoque ao excluir orçamento** — não implementar nesta versão para manter simples; o ajuste manual cobre esse caso
- **Multi-unidade** — não converter entre unidades (ex: metros vs chapas); o marceneiro define a unidade e a quantidade é sempre nessa unidade

---

## Design técnico

### Banco de dados

**Tabela `Material`** — adicionar dois campos:

```prisma
model Material {
  // ... campos existentes ...
  quantidadeEstoque  Float?   // null = sem controle de estoque
  estoqueMinimo      Float?   // null = sem alerta configurado
}
```

**Tabela `OrcamentoMaterial`** — adicionar referência ao material do cadastro:

```prisma
model OrcamentoMaterial {
  // ... campos existentes ...
  materialId  Int?      // null = material avulso (digitado manualmente)
  material    Material? @relation(fields: [materialId], references: [id], onDelete: SetNull)
}
```

`materialId` é nullable para não quebrar orçamentos existentes nem materiais avulsos.

**Comando:** `prisma db push` (aguardar aprovação do Victor antes de rodar)

### Backend

**1. `MaterialController` — atualizar `criar` e `editar`**

- Aceitar `quantidadeEstoque` e `estoqueMinimo` no body
- Validar que são números positivos se informados

**2. `OrcamentoController` — atualizar `criar`**

- Após salvar o orçamento, para cada `OrcamentoMaterial` que tenha um `materialId` correspondente na tabela `Material`:
  - Buscar o `Material` do usuário pelo nome (matching por nome, pois `OrcamentoMaterial` não guarda `materialId`)
  - Se encontrar e o material tiver `quantidadeEstoque != null`, fazer: `quantidadeEstoque -= quantidade`
  - Nunca deixar negativo (mínimo 0)

> **Atenção:** `OrcamentoMaterial` não guarda `materialId` hoje. Vamos adicionar esse campo (nullable) nesta feature. Quando o usuário selecionar do cadastro, o `materialId` é salvo junto. O desconto de estoque usa `materialId` — confiável. Materiais digitados manualmente ("Material avulso...") não têm `materialId` e simplesmente não afetam o estoque.

**3. Nova rota `PATCH /api/materiais/:id/estoque`**

- Body: `{ quantidadeEstoque: number }`
- Permite ajuste manual sem precisar editar todos os outros campos do material
- Protegida pelo middleware `auth`

### Frontend

**1. Tela `Materiais.tsx` — listagem**

- Adicionar coluna/badge mostrando estoque: _"15 unid."_ ou _"—"_ se não configurado
- Badge vermelho/laranja quando `quantidadeEstoque < estoqueMinimo`
- Botão "Ajustar estoque" que abre um modal simples com campo numérico

**2. Modal de criação/edição de material**

- Adicionar campos: `Estoque atual` e `Estoque mínimo` (ambos opcionais, tipo número)
- Placeholder explicativo: _"Deixe em branco para não controlar estoque"_

**3. Tela `NovoOrcamento.tsx` / `EditarOrcamento.tsx`**

- Após salvar com sucesso, checar na resposta se algum material ficou abaixo do mínimo
- Se sim: exibir toast/alerta informativo (não bloqueante): _"Atenção: X materiais com estoque baixo"_

---

## Riscos e dependências

| Risco                                                                        | Impacto                                        | Mitigação                                                                            |
| ---------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Marceneiro edita um orçamento e o sistema desconta de novo                   | Estoque vai ficando negativo ao longo do tempo | **Não descontar ao editar** — apenas na criação. Ajuste manual cobre correções       |
| Material deletado após ser usado num orçamento                               | `materialId` ficaria órfão                     | `onDelete: SetNull` no schema — `materialId` vira null, nome/valor preservados       |
| `quantidadeEstoque` pode ficar negativo se orçamento usar mais do que existe | Estoque mostra valor negativo                  | Aplicar `Math.max(0, atual - usado)` no backend                                      |
| Material avulso (sem `materialId`) não desconta estoque                      | Estoque não reflete consumo real               | Comportamento esperado e documentado — material avulso = fora do controle de estoque |

---

## Ordem de implementação sugerida

1. **Banco** — adicionar colunas `quantidadeEstoque` e `estoqueMinimo` no schema + `db push`
2. **Backend** — atualizar endpoints de material (criar/editar) para aceitar os novos campos
3. **Backend** — lógica de desconto no `OrcamentoController.criar`
4. **Backend** — rota `PATCH /api/materiais/:id/estoque` para ajuste manual
5. **Frontend** — campos na tela/modal de material
6. **Frontend** — badge de estoque na listagem + destaque de alerta
7. **Frontend** — modal de ajuste de estoque
8. **Frontend** — toast de aviso após salvar orçamento
