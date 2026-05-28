---
name: evolution-whatsapp
description: Use whenever the user asks how to send WhatsApp messages via EvolutionAPI, replace Telegram notifications with WhatsApp, or integrate automated WhatsApp messaging in OrcaPro. Uses direct REST API with apikey header — no SDK needed.
---

# WhatsApp via EvolutionAPI — Padrão OrcaPro

A EvolutionAPI é uma API REST que conecta ao WhatsApp via QR Code. Substitui o Telegram nas notificações automáticas do Kanban.

> **Status atual:** Telegram ainda ativo em produção. EvolutionAPI está no backlog como substituto. Há TODOs marcados em `Kanban.tsx` para a integração futura.

## Como funciona

1. O marceneiro instala a EvolutionAPI (self-hosted ou cloud)
2. Escaneia o QR Code no painel da EvolutionAPI com o WhatsApp do negócio
3. O OrcaPro chama a API REST para enviar mensagens

## Implementação no backend

### Variáveis de ambiente necessárias
```env
EVOLUTION_API_URL=https://sua-instancia.evolution-api.com
EVOLUTION_API_KEY=sua-chave-aqui
EVOLUTION_INSTANCE=nome-da-instancia
```

### Serviço de envio (`src/services/whatsapp.ts`)
```typescript
interface MensagemWhatsApp {
  numero: string   // formato: '5551999998888' (55 + DDD + número, sem espaços ou símbolos)
  texto: string
}

export async function enviarWhatsApp({ numero, texto }: MensagemWhatsApp): Promise<void> {
  const url = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instancia = process.env.EVOLUTION_INSTANCE

  if (!url || !apiKey || !instancia) return  // silencioso se não configurado

  const res = await fetch(`${url}/message/sendText/${instancia}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey           // header obrigatório — sem 'Bearer', só o valor
    },
    body: JSON.stringify({
      number: numero,
      text: texto
    })
  })

  if (!res.ok) {
    console.error('[WhatsApp] Falha ao enviar mensagem:', await res.text())
    // Não lançar erro — notificação WhatsApp não deve quebrar o fluxo principal
  }
}
```

### Formatação do número (armadilha conhecida)
```typescript
// EvolutionAPI espera: 5551999998888 (sem +, sem espaços, sem parênteses)
// O campo telefone no banco pode ter máscara: (51) 99999-8888
// Sempre limpar antes de enviar:

function limparTelefone(tel: string): string {
  const soDigitos = tel.replace(/\D/g, '')
  // Adicionar 55 se não tiver DDI
  return soDigitos.startsWith('55') ? soDigitos : `55${soDigitos}`
}
```

### Mensagem de status (substitui notificação do Telegram)
```typescript
// Exemplo: notificar cliente quando orçamento muda de status
import { enviarWhatsApp } from '../services/whatsapp'

const mensagem = `Olá ${cliente.nome}! Seu projeto *${orcamento.titulo}* foi atualizado para: *${novoStatus}*. Qualquer dúvida, estamos à disposição!`

await enviarWhatsApp({
  numero: limparTelefone(cliente.telefone),
  texto: mensagem
})
```

## Formatação de texto no WhatsApp
- `*texto*` → **negrito**
- `_texto_` → _itálico_
- Evitar emojis (podem não renderizar igual em todos os dispositivos)
- Sempre usar `.trim()` antes de montar `*texto*` — espaço antes do `*` quebra a formatação

## Onde integrar no OrcaPro

Substituir (ou adicionar ao lado de) as chamadas `enviarTelegram()` em:
- `OrcamentoController.ts` — ao mudar status no Kanban
- `OrcamentoController.ts` — ao gerar contrato (TODO já marcado no código)

## Checklist antes de ativar

- [ ] Variáveis de ambiente configuradas no Render (nunca no código)
- [ ] EvolutionAPI acessível publicamente (não localhost)
- [ ] Número do cliente tem telefone cadastrado antes de tentar enviar
- [ ] Falha no envio não quebra a operação principal (try/catch ou verificação de `res.ok`)
- [ ] Mensagem usa `.trim()` antes de montar formatação em negrito
