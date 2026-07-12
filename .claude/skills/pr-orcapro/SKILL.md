---
name: pr-orcapro
description: Use ao commitar, abrir PR, mergear e atualizar o Trello no OrcaPro. Contém os comandos exatos, IDs do Trello e as regras do fluxo — evita redescobrir tudo e gastar tokens com lookups.
---

# Fluxo de PR do OrcaPro (commit → PR → merge → Trello)

`gh` sempre pelo caminho completo: `GH="/c/Program Files/GitHub CLI/gh.exe"`.
Raiz do repo: `/d/Github/OrcaPro` (os arquivos ficam sob `OrcaPro/...`).

## 1. Commit — SEMPRE via pathspec

O índice costuma carregar trabalho pré-existente do Victor já staged (backend, package.json…).
**Nunca** `git add -A` / commit sem pathspec. Padrão:

```bash
cd /d/Github/OrcaPro
git checkout -b feat/nome-curto        # ou fix/
git add OrcaPro/frontend/src/arquivo1 OrcaPro/frontend/src/arquivo2
git commit -m "mensagem em pt com prefixo feat:/fix:" -- OrcaPro/frontend/src/arquivo1 OrcaPro/frontend/src/arquivo2
```

Mensagem: português, prefixo `feat:`/`fix:`/`docs:`, terminar com
`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## 2. PR + checks + merge

```bash
git push -u origin BRANCH
"$GH" pr create --base main --head BRANCH --title "..." --body "..."   # body termina com o rodapé 🤖 do Claude Code
"$GH" pr checks N --watch --fail-fast          # espera CI + Claude Review (~3 min)
"$GH" pr merge N --merge --delete-branch
git checkout main && git pull origin main
```

Checks esperados: `Frontend — tipos e build`, `Testes do Backend`, `review` (Claude), Vercel.
`Deploy no Render` fica `skipping` no PR (só roda pós-merge) — é normal.
Merge só com tudo `pass` e estado `MERGEABLE`/`CLEAN`.

## 3. Trello (obrigatório pós-merge — CLAUDE.md)

Board: `69fbdd624733c5472cf7c132` (Projeto - OrçaPro). IDs fixos:

| Lista | ID |
|---|---|
| 🔍 Code Review / Testes | `6a03f36cf30288c98955463b` |
| ✅ Concluído | `6a03f36df8621ee0a51f4016` |
| 🎯 Sprint Atual | `6a03f3587d1962a9bef0808e` |

| Label | ID |
|---|---|
| Front-end | `6a03f5596226620902fcec52` |
| Back-end | `6a03f564565b3f00745e10ea` |
| Full-Stack | `6a03f57695af531019e2303f` |
| UI/UX | `6a17b27fed3f31366e750464` |
| Bug | `6a03f57d00315c17136e7949` |

Fluxo: ao abrir o PR → criar card em Code Review (`add_card_to_list`, descrição com link do PR
e hash). Ao mergear → `move_card` pra Concluído (**passar `boardId` junto — sem ele dá erro 400**)
+ `add_comment` com merge commit e data. Correção de PR anterior → só comentar no card existente.

## Regras que já causaram retrabalho

- "Está quebrando o design" = **consertar layout**, não remover a feature. Confirmar antes de deletar qualquer coisa.
- Testar no emulador **antes** de commitar (skill `testar-app-android`); o Victor aprova o merge em seguida.
- Botões de ícone inline no mobile: a regra global `button { width: 100% }` (≤600px) infla eles — dar `width: auto`/`flexShrink: 0`.
- Hover global `.menu a:hover` tem `transform: none` — cuidado com elementos centralizados via transform.
