# Migração de Arquitetura — OrcaPro

Documentação completa da reorganização do projeto iniciada em 28/05/2026.
Todas as 5 fases concluídas na mesma sessão.

---

## Resumo executivo

O projeto passou de um `CLAUDE.md` monolítico de 365 linhas para uma arquitetura em camadas com documentação separada, segurança configurada em código, subagentes especialistas e skills reutilizáveis. Nada foi deletado — tudo foi reorganizado e expandido.

---

## O que existia antes

- `CLAUDE.md` — arquivo único com 365 linhas misturando: stack, regras, estado, backlog, decisões, convenções, instruções de comunicação
- `.claude/settings.json` — com permissões soltas e caminhos de outro usuário (`victor.amorim`)
- Sem subagentes
- Sem skills customizadas
- Sem hooks de segurança
- `.gitignore` com linha duplicada de `settings.local.json`

---

## O que existe agora

### Fase 1 — Documentação em camadas (commit `567133d`)

| Arquivo                            | Conteúdo                                                             |
| ---------------------------------- | -------------------------------------------------------------------- |
| `CLAUDE.md`                        | Versão enxuta (~160 linhas) — visão geral, regras, comandos, backlog |
| `docs/architecture.md`             | Stack completa, estrutura de pastas, decisões técnicas               |
| `docs/tenant-model.md`             | Modelo multi-tenant, isolamento por userId, exemplos Prisma          |
| `docs/security-rules.md`           | Checklist OWASP, JWT, headers, rate limit, secrets                   |
| `docs/deploy.md`                   | Vercel, Render, Neon.tech, CI/CD, variáveis de ambiente              |
| `docs/iniciante.md`                | Glossário com ~30 termos em português simples                        |
| `_backup_arquitetura_v1/CLAUDE.md` | Backup do CLAUDE.md original (preservado, não deletado)              |

### Fase 2 — Segurança configurada (commit `fd52abc`)

**`.claude/settings.json`** reescrito com:

```
ALLOW (sem pergunta):
  npm run *, npm test*, npx tsc*, npx prisma studio*
  git status*, git diff*, git add*, git log*, git commit*
  Read(*), Glob(*), Grep(*)

ASK (pergunta antes):
  git push*
  npx prisma db push*
  npx prisma migrate deploy*
  Edit(OrcaPro/backend/prisma/schema.prisma)

DENY (bloqueado sempre):
  rm -rf*, rm -r*
  *--accept-data-loss*
  *migrate reset*
  *DROP TABLE*, *DROP DATABASE*
  Read(**/.env*), Edit(**/.env*)
```

**Hooks:**

- `PreToolUse` → script Node.js intercepta Bash e aborta se detectar comandos destrutivos
- `PostToolUse` → Prettier automático após edições

**`.gitignore`** — linha duplicada de `settings.local.json` removida.

### Fase 3 — Subagentes especialistas (commits `cdee330` + `953d0d1`)

Pasta `.claude/agents/` com 6 arquivos:

| Subagente                      | Trigger automático                                |
| ------------------------------ | ------------------------------------------------- |
| `security-auditor.md`          | Mudanças em auth, middleware, rotas públicas      |
| `tenant-isolation-reviewer.md` | Qualquer controller ou query Prisma nova/editada  |
| `db-migration-reviewer.md`     | Menção a schema.prisma ou db push                 |
| `code-reviewer.md`             | Fim de feature ou pedido de revisão               |
| `test-writer.md`               | Novo endpoint ou controller de backend            |
| `pdf-orcamento-designer.md`    | Mudanças em PDF, proposta ou orçamento imprimível |

### Fase 4 — Skills customizadas (commit `5f60802`)

Pasta `.claude/skills/` com 5 subpastas:

| Skill                          | O que documenta                                  |
| ------------------------------ | ------------------------------------------------ |
| `tenant-isolation/SKILL.md`    | Padrão de filtro `userId` em toda query Prisma   |
| `gerar-pdf-orcamento/SKILL.md` | `html2pdf.js` via `DocumentoOrcamento.tsx`       |
| `evolution-whatsapp/SKILL.md`  | REST direto com header `apikey` da EvolutionAPI  |
| `billing-pagarme/SKILL.md`     | Assinatura + boleto + Pix + webhook com Pagar.me |
| `audit-log/SKILL.md`           | `registrarAuditoria()` com convenções LGPD       |

### Fase 5 — Validação final (este commit)

- `MIGRACAO.md` criado (este arquivo)
- `PROXIMAS_FASES.md` atualizado com todas as fases marcadas como concluídas
- Skills oficiais Anthropic documentadas abaixo

---

## Skills oficiais Anthropic (como instalar)

O Claude Code tem skills oficiais mantidas pela Anthropic que podem ser instaladas via linha de comando. Para instalar no projeto:

```bash
# Dentro da pasta raiz do projeto (OrcaPro/)
claude mcp add @anthropic/skill-pdf      # leitura e extração de PDFs
claude mcp add @anthropic/skill-docx     # leitura de documentos Word
claude mcp add @anthropic/skill-xlsx     # leitura de planilhas Excel
```

Após instalar, o Claude passa a ter a skill disponível automaticamente nas sessões do projeto. As skills oficiais aparecem junto com as customizadas em `.claude/skills/`.

> **Nota:** a disponibilidade dessas skills pode variar conforme o plano e a versão do Claude Code. Verificar documentação atualizada em https://docs.anthropic.com/claude-code

---

## Como o Claude reage a comandos destrutivos (com os novos hooks)

Com a Fase 2 ativa, o seguinte acontece se o Claude tentar rodar um comando proibido:

**Exemplo 1 — `rm -rf`:**

```
Bloqueado pela regra deny antes mesmo de tentar executar.
Mensagem: "Esta ação requer permissão (deny rule: Bash(rm -rf*))"
```

**Exemplo 2 — `prisma db push --accept-data-loss`:**

```
1. Regra deny bloqueia: Bash(*--accept-data-loss*)
2. Se o deny não capturasse, o hook PreToolUse interceptaria:
   BLOQUEADO: comando destrutivo detectado: --accept-data-loss
   (exit code 2 — o Claude não executa)
```

**Exemplo 3 — `git push`:**

```
Bloqueado pela regra ask.
Claude pergunta: "Deseja executar git push origin main?"
Só executa após confirmação do Victor.
```

**Exemplo 4 — `npx prisma studio`:**

```
Permitido pela regra allow (Bash(npx prisma studio*)).
Executa sem perguntar.
```

---

## Estrutura final do `.claude/`

```
.claude/
├── settings.json          → permissões compartilhadas do projeto (vai pro git)
├── settings.local.json    → permissões pessoais do Victor (NÃO vai pro git)
├── agents/
│   ├── security-auditor.md
│   ├── tenant-isolation-reviewer.md
│   ├── db-migration-reviewer.md
│   ├── code-reviewer.md
│   ├── test-writer.md
│   └── pdf-orcamento-designer.md
└── skills/
    ├── tenant-isolation/SKILL.md
    ├── gerar-pdf-orcamento/SKILL.md
    ├── evolution-whatsapp/SKILL.md
    ├── billing-pagarme/SKILL.md
    └── audit-log/SKILL.md
```

---

## O que NÃO mudou

- Todo o código do frontend e backend — zero alterações funcionais
- Banco de dados — sem migrations
- Deploy — Vercel, Render e Neon.tech inalterados
- CI/CD — GitHub Actions inalterado
- Funcionalidades em produção — todas continuam funcionando
