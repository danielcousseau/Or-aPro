# Reorganização do projeto — Fases pendentes

Iniciada em 28/05/2026. **TODAS AS FASES CONCLUÍDAS** em 28/05/2026.

## O que já foi feito

- **Fase 0** — Diagnóstico (nenhuma mudança, só mapeamento)
- **Fase 1** — Backup + docs/ + CLAUDE.md enxuto
  - `_backup_arquitetura_v1/CLAUDE.md` — backup do CLAUDE.md original (365 linhas)
  - `CLAUDE.md` — substituído por versão enxuta (~160 linhas)
  - `docs/architecture.md` — stack, estrutura de pastas, decisões técnicas
  - `docs/tenant-model.md` — modelo multi-tenant e isolamento por userId
  - `docs/security-rules.md` — checklist de segurança
  - `docs/deploy.md` — Vercel, Render, Neon.tech, CI/CD
  - `docs/iniciante.md` — glossário com ~30 termos em português simples
  - Commit: `567133d`
- **Fase 2** — Configuração de segurança (settings.json + hooks)
  - `.claude/settings.json` reescrito com allow/ask/deny + hooks PreToolUse e PostToolUse
  - `.gitignore` — linha duplicada de `settings.local.json` removida
  - Commit: ver abaixo

---

## O que falta fazer

### ~~Fase 2 — Configuração de segurança (settings.json + hooks)~~ ✅ CONCLUÍDA

Criar/atualizar `.claude/settings.json` com:

**Permissions allow** (comandos liberados automaticamente):

- `Bash(npm run *)`, `Bash(npm test*)`, `Bash(npx tsc*)`, `Bash(npx prisma studio*)`
- `Bash(git status*)`, `Bash(git diff*)`, `Bash(git add*)`, `Bash(git log*)`
- `Bash(git commit*)`, `Read(*)`, `Glob(*)`, `Grep(*)`

**Permissions ask** (Claude pergunta antes):

- `Bash(git push*)` — push requer confirmação
- `Bash(npx prisma db push*)` — altera banco de produção
- `Bash(npx prisma migrate deploy*)` — idem
- `Edit(OrcaPro/backend/prisma/schema.prisma)` — editar schema

**Permissions deny** (bloqueado sempre):

- `Bash(rm -rf*)`, `Bash(rm -r*)` — deletar recursivo
- `Bash(*--accept-data-loss*)` — flag destrutiva do Prisma
- `Bash(*migrate reset*)` — apaga todo o banco
- `Bash(*DROP TABLE*)`, `Bash(*DROP DATABASE*)` — SQL destrutivo
- `Read(**/.env*)`, `Edit(**/.env*)` — arquivos de segredos

**Hook PreToolUse** — bloqueia comandos destrutivos com mensagem de aviso:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const cmd = process.env.CLAUDE_TOOL_INPUT || ''; const blocked = ['rm -rf','--accept-data-loss','migrate reset','DROP TABLE','DROP DATABASE']; const found = blocked.find(b => cmd.includes(b)); if (found) { console.error('BLOQUEADO: comando destrutivo detectado: ' + found); process.exit(2); }\""
          }
        ]
      }
    ]
  }
}
```

**Hook PostToolUse** — roda prettier após edições (opcional):

```json
{
  "matcher": "Edit",
  "hooks": [
    {
      "type": "command",
      "command": "npx prettier --write \"${CLAUDE_TOOL_INPUT_FILE_PATH}\" 2>/dev/null || true"
    }
  ]
}
```

**Importante:** `.claude/settings.local.json` NÃO deve ir pro git (configurações pessoais). O `settings.json` SIM (configurações compartilhadas do projeto). Verificar que `settings.local.json` está no `.gitignore`.

---

### Fase 3 — Subagents (6 especialistas)

Criar pasta `.claude/agents/` com um arquivo `.md` por subagent.

Cada arquivo precisa de:

- YAML frontmatter: `name`, `description` (com "Use proactively when..."), `tools`, `model`
- Corpo: instruções do que o subagent faz

**Ordem de criação (um por vez, aguardar aprovação entre cada):**

1. `security-auditor.md`
   - Audita OWASP Top 10, JWT, secrets, headers, rate limit, Turnstile
   - Invocado proativamente em mudanças de auth, middleware, rotas públicas

2. `tenant-isolation-reviewer.md`
   - Verifica que toda query Prisma tem filtro `userId`
   - Invocado proativamente em qualquer novo controller ou query

3. `db-migration-reviewer.md`
   - Valida mudanças no `schema.prisma` antes do `db push`
   - Bloqueia sugestões de `--accept-data-loss` sem aprovação explícita

4. `code-reviewer.md`
   - Revisão geral: qualidade, duplicação, TypeScript strict, padrões do projeto

5. `test-writer.md`
   - Gera testes Jest + Supertest
   - Sempre inclui casos cross-tenant (tenant A não acessa dados do tenant B)
   - Conecta no banco real (não mocka)

6. `pdf-orcamento-designer.md`
   - Revisa templates de PDF/proposta
   - Garante que `DocumentoOrcamento.tsx` é a fonte única de verdade

---

### Fase 4 — Skills customizadas

Criar pasta `.claude/skills/` com subpasta para cada skill.

**Ordem de criação (uma por vez):**

1. `tenant-isolation/SKILL.md` — padrão AsyncLocalStorage + middleware + Prisma extension
2. `gerar-pdf-orcamento/SKILL.md` — usar `html2pdf.js` via `DocumentoOrcamento.tsx`
3. `evolution-whatsapp/SKILL.md` — REST direto com header `apikey` da EvolutionAPI
4. `billing-pagarme/SKILL.md` — fluxo de assinatura + boleto + pix com Pagar.me
5. `audit-log/SKILL.md` — middleware de auditoria LGPD com a tabela `AuditLog` existente

Cada `SKILL.md` precisa de:

- YAML frontmatter: `name`, `description` (com "Use whenever...")
- Corpo: passo a passo concreto de implementação

---

### Fase 5 — Skills oficiais + validação final

1. Explicar como instalar skills oficiais Anthropic (pdf, docx, xlsx) via `/plugin install`
2. Verificar que `.claude/settings.local.json` está no `.gitignore`
3. Simular como o Claude reagiria a comandos destrutivos com os novos hooks
4. Criar `_backup_arquitetura_v1/MIGRACAO.md` documentando tudo que mudou

---

## Regras para essa sessão de trabalho

1. Victor é iniciante — explicar tudo em linguagem simples antes de fazer
2. NUNCA mais de uma fase de uma vez — aguardar aprovação entre cada
3. Antes de cada fase: explicar o que vai mudar, qual o risco, o que pode quebrar
4. NÃO executar nada destrutivo sem perguntar
