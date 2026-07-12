# Spec: Envio do PDF do orçamento pelo Telegram

> **Status:** Implementado
> **Data:** 2026-07-03
> **Autor:** Victor (com Claude Code)

---

## Problema

O botão "WhatsApp" da tela do orçamento só envia um **link** da proposta — o PDF em si o cliente precisa baixar. Já o Telegram, que o OrcaPro usa apenas para notificações de status, permite enviar o **arquivo PDF de verdade** no chat. Sem isso, não dá para demonstrar (nem oferecer) o fluxo completo do orçamento dentro do Telegram.

## Solução

Novo botão **"Telegram"** na tela do orçamento (`ImprimirOrcamento`). Ele gera o mesmo PDF do botão "Baixar PDF" (via `DocumentoOrcamento.tsx`, fonte única de layout) e envia o arquivo direto no chat do cliente pelo bot, com uma legenda amigável e o link exclusivo da proposta online.

## Usuários afetados

- **Marceneiro:** ganha um novo canal de envio do orçamento, com um clique.
- **Cliente final:** recebe o PDF + link de aprovação no Telegram, sem precisar baixar nada de um link.

## Fluxo principal

1. Marceneiro abre o orçamento (tela Imprimir/Documento) e clica em **Telegram**.
2. O frontend gera o PDF em memória (html2pdf → blob) e envia para `POST /api/orcamentos/:id/enviar-telegram` como `application/pdf`.
3. O backend valida o dono do orçamento (tenant), confere se o cliente tem `telegramChatId` e repassa o PDF ao bot (`sendDocument`) com legenda + link da proposta (token JWT de 7 dias).
4. O cliente recebe no chat: mensagem personalizada, o arquivo PDF e o link para visualizar/aprovar online.
5. A ação fica registrada no Audit Log (`"enviou por Telegram"`).

## Critérios de aceitação

- [x] Botão "Telegram" visível na toolbar do orçamento, com estado "Enviando..."
- [x] PDF recebido no chat é idêntico ao do botão "Baixar PDF"
- [x] Legenda contém nome do cliente, nome da marcenaria, título do projeto e link da proposta
- [x] Cliente sem Telegram conectado → aviso claro, sem chamada ao bot
- [x] Tenant A não consegue enviar orçamento do tenant B (404) — coberto por teste
- [x] Nomes/títulos com `*`, `_`, `` ` `` ou `[` não quebram a mensagem (escape de Markdown)
- [x] Envio registrado no Audit Log

## Fora do escopo

- Envio de PDF pelo WhatsApp (continua sendo link via `wa.me`)
- Conexão do cliente ao bot (fluxo já existente na tela de Clientes)
- Reenvio automático ou agendado

## Design técnico

### Backend

- `services/telegram.ts`: `enviarDocumento(chatId, arquivo, nomeArquivo, legenda)` usando `sendDocument` com `FormData`/`fetch` nativos; `escaparMarkdown()` para todo texto vindo do usuário
- `OrcamentoController.enviarPdfTelegram`: valida buffer, filtro de tenant em todas as queries, gera link da proposta (mesmo JWT do `link-publico`), audita com `registrar`
- Rota `POST /orcamentos/:id/enviar-telegram` atrás do `authMiddleware`, body via `express.raw({ type: "application/pdf", limit: "15mb" })`
- Helper `calcularNumeroLocal` (count por `createdAt`) compartilhado com `gerarPDF`

### Frontend

- `ImprimirOrcamento.tsx`: botão Telegram; `html2pdf().outputPdf("blob")` com as mesmas opções do download (`opcoesPdf()`), POST do blob com `Content-Type: application/pdf`
- `types/html2pdf.d.ts`: shim ganha `outputPdf(type: "blob"): Promise<Blob>`

### Banco de dados

- Nenhuma mudança — usa `Cliente.telegramChatId` já existente.

## Riscos e dependências

- Depende de `TELEGRAM_BOT_TOKEN` configurado no Render (já usado pelas notificações de status)
- Telegram limita documentos de bot a 50 MB — o limite de 15 MB da rota fica bem abaixo
- Cliente precisa ter conectado o bot antes (fluxo da tela de Clientes)
