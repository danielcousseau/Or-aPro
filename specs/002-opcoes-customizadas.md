# Spec: Opções Customizadas Fixas (Ambiente, Pagamento, Material)

> **Status:** Implementado — migration pendente no banco de produção
> **Data:** 2026-05-21
> **Autor:** Victor

---

## Problema

Nos campos "Ambiente", "Forma de Pagamento", "Categoria" e "Unidade de Medida", o marceneiro pode escolher "Outros" e digitar um valor livre. Porém, esse valor nunca fica salvo para uso futuro — o usuário precisa redigitar toda vez que usar um mesmo ambiente ou pagamento personalizado (ex: "Área Gourmet", "60% na entrega").

## Solução

Quando o usuário digita no campo "Outros", exibir um checkbox logo abaixo:

> ☐ Salvar "Área Gourmet" como opção fixa para os próximos orçamentos

Se marcado, o valor é salvo imediatamente via API (sem precisar salvar o orçamento). Na próxima vez, o valor aparece como opção fixa no dropdown, junto com as padrões.

## Usuários afetados

Todos os marceneiros que usam ambientes, pagamentos ou categorias fora dos padrões do sistema com frequência.

## Fluxo principal

1. Usuário seleciona "[ + ] Outro (Digitar manualmente)" no dropdown
2. Campo de texto aparece com `autoFocus`
3. Enquanto digita, o checkbox aparece: `☐ Salvar "X" como opção fixa`
4. Se o usuário apagar e redigitar, o checkbox volta para desmarcado (evita salvar valor errado)
5. Ao marcar o checkbox → POST imediato em `/api/opcoes-customizadas`
6. Toast de confirmação: `"X" salvo como opção fixa!`
7. Na próxima abertura da tela, o valor aparece no dropdown mesclado com as opções padrão

## Critérios de aceitação

- [x] Checkbox aparece apenas quando há texto digitado (não em campo vazio)
- [x] Mudar o texto reseta o checkbox para desmarcado
- [x] Salvar é imediato ao marcar (não depende de salvar o orçamento)
- [x] Salvar o mesmo valor duas vezes não gera duplicata (upsert por `@@unique([tipo, nome, userId])`)
- [x] Cada usuário vê apenas suas próprias opções salvas (SaaS isolado por `userId`)
- [x] Ao editar um orçamento que tem um valor customizado já salvo, ele aparece no dropdown (não em modo "Outros")
- [ ] **Pendente:** Migration aplicada no banco de produção (tabela `OpcaoCustomizada` não existe ainda)

## Fora do escopo

- Interface para gerenciar/excluir opções salvas (pode vir numa próxima sessão)
- Compartilhar opções entre usuários do mesmo plano

## Design técnico

### Backend
- `backend/prisma/schema.prisma` — model `OpcaoCustomizada` adicionado com `@@unique([tipo, nome, userId])`
- `backend/prisma/migrations/20260521000000_add_opcao_customizada/migration.sql` — criado manualmente
- `backend/src/controllers/OpcaoCustomizadaController.js` — `listar`, `criar` (create + P2002 handler), `excluir`
- `backend/src/routes/opcaoCustomizadaRoutes.js` — montado em `/api/opcoes-customizadas`
- `backend/src/app.js` — rota registrada

### Frontend
- `DadosGerais.jsx` — campo ambiente: busca opções customizadas no mount, checkbox ao digitar
- `ResumoValores.jsx` — campo pagamento: mesma lógica
- `Materiais.jsx` — campos categoria e unidade: checkbox independente para cada um

### Banco de dados
- Nova tabela `OpcaoCustomizada(id, tipo, nome, userId, createdAt)`
- `tipo` aceita: `"ambiente"` | `"pagamento"` | `"material_categoria"` | `"material_unidade"`

## Riscos e dependências

- **Migration não aplicada** — o `prisma migrate deploy` falha silenciosamente no Render porque `DIRECT_URL` pode não estar configurada nas env vars. O Neon.tech usa um pooler para conexões normais, mas migrations precisam da URL direta. Solução: configurar `DIRECT_URL` no Render (valor vem do painel do Neon → Connection Details → Direct connection) **ou** rodar o SQL manualmente no SQL Editor do Neon.
- `prisma.config.ts` foi corrigido (removido override de datasource sem `directUrl`) em 2026-05-21, mas a migration ainda precisa rodar no próximo deploy.
