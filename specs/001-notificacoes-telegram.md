# Spec: Notificações de Status via Telegram

> **Status:** Implementado
> **Data:** 2026-05-20
> **Autor:** Victor

---

## Problema

Quando o marceneiro atualiza o status de um orçamento no Quadro de Produção (ex: de "Aprovado" para "Produção"), o cliente não recebe nenhum aviso automático. Ele precisa ligar ou mandar mensagem para saber o andamento do projeto, gerando trabalho desnecessário para ambos os lados.

## Solução

Integrar um bot do Telegram que envia uma mensagem automática ao cliente sempre que o status do orçamento muda no Kanban. O marceneiro não precisa fazer nada além de mudar o status — a notificação é disparada automaticamente.

## Usuários afetados

- **Marceneiro:** não precisa mudar nada no fluxo atual; a notificação acontece em segundo plano
- **Cliente final:** recebe mensagem no Telegram quando o projeto avança de etapa

## Fluxo principal

1. Marceneiro cadastra o cliente e preenche o campo "Chat ID do Telegram"
2. Cliente abre o Telegram, busca o bot e manda qualquer mensagem (ex: "oi")
3. Marceneiro acessa **Configurações → Pendentes Telegram** para ver o Chat ID do cliente
4. Marceneiro preenche o Chat ID no cadastro do cliente e salva
5. A partir daí, toda mudança de status no Kanban dispara mensagem automática ao cliente

## Critérios de aceitação

- [x] Quando o status muda para "Aprovado", cliente recebe: "✅ Seu projeto X foi aprovado!"
- [x] Quando o status muda para "Produção", cliente recebe: "🔨 Seu projeto X entrou em produção!"
- [x] Quando o status muda para "Instalação", cliente recebe: "🚚 Seu projeto X está pronto para instalação!"
- [x] Quando o status muda para "Entregue", cliente recebe: "🎉 Seu projeto X foi entregue!"
- [x] Se o cliente não tem Chat ID cadastrado, nenhum erro é gerado
- [x] Falha no envio da mensagem não interrompe a atualização do status
- [x] Campo "Chat ID do Telegram" visível no cadastro de clientes
- [x] Clientes com Telegram ativo exibem indicador visual no card

## Fora do escopo

- Integração com WhatsApp (API paga e burocrática)
- Confirmação de leitura pelo cliente
- Mensagens personalizadas por marceneiro
- Notificações para os status "Aguardando" (não faz sentido notificar)

## Design técnico

### Backend
- `backend/src/services/telegram.js` — funções `enviarMensagem`, `notificarMudancaStatus`, `buscarPendentes`
- `OrcamentoController.atualizarStatus` — dispara `notificarMudancaStatus` após update (fire-and-forget)
- `GET /api/telegram/pendentes` — chama `getUpdates` da API do Telegram para listar chat_ids recentes

### Frontend
- `Clientes.jsx` — campo "Chat ID do Telegram" no formulário; indicador "✈️ Telegram ativo" no card

### Banco de dados
- `Cliente.telegramChatId String?` — campo opcional adicionado via `prisma db push`

## Riscos e dependências

- **Cliente precisa iniciar a conversa com o bot primeiro** — o Telegram não permite que bots enviem mensagens para quem nunca interagiu com eles
- **Token do bot** — `TELEGRAM_BOT_TOKEN` deve ser configurado como variável de ambiente no Render; sem ele, as notificações são silenciosamente ignoradas
- **Limitação de teste** — Telegram é solução de validação; migração futura para WhatsApp Business API ou Z-API quando validado com usuários reais
