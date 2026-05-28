---
name: billing-pagarme
description: Use whenever the user asks how to implement subscription plans, charge users, add billing to OrcaPro, or integrate Pagar.me for boleto, Pix, or credit card payments. Covers freemium gating, subscription flow, and webhook handling.
---

# Billing com Pagar.me — Padrão OrcaPro

O Pagar.me é o gateway de pagamento brasileiro escolhido para o OrcaPro. Suporta boleto, Pix e cartão de crédito com recorrência.

> **Status atual:** billing ainda não implementado. Esta skill documenta o padrão a seguir quando for implementado.

## Estrutura de planos sugerida

```
Freemium: até 3 orçamentos/mês — gratuito
Pro: ilimitado + WhatsApp + contrato digital — R$ 49/mês
```

## Schema do banco (adicionar via db push com aprovação)

```prisma
model Assinatura {
  id              Int       @id @default(autoincrement())
  userId          Int       @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  plano           String    @default("free")   // "free" | "pro"
  status          String    @default("ativa")  // "ativa" | "cancelada" | "inadimplente"
  pagarmeSubId    String?                       // ID da assinatura no Pagar.me
  proximoVenc     DateTime?
  criadaEm        DateTime  @default(now())
  atualizadaEm   DateTime  @updatedAt
}
```

## Variáveis de ambiente
```env
PAGARME_API_KEY=ak_live_xxxxxxxxxxxx    # chave de produção
PAGARME_API_KEY_TEST=ak_test_xxxx       # chave de teste (desenvolvimento)
PAGARME_WEBHOOK_SECRET=xxxx             # para validar webhooks
```

## Serviço Pagar.me (`src/services/pagarme.ts`)

```typescript
const BASE_URL = 'https://api.pagar.me/core/v5'
const API_KEY = process.env.PAGARME_API_KEY!

const headers = {
  'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
  'Content-Type': 'application/json'
}

// Criar assinatura recorrente
export async function criarAssinatura(dados: {
  nome: string
  email: string
  cpf: string
  telefone: string
  planoId: string          // ID do plano criado no painel Pagar.me
}): Promise<string> {      // retorna ID da assinatura
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      plan_id: dados.planoId,
      customer: {
        name: dados.nome,
        email: dados.email,
        document: dados.cpf.replace(/\D/g, ''),
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: dados.telefone.slice(0, 2),
            number: dados.telefone.slice(2)
          }
        }
      },
      payment_method: 'boleto'   // ou 'credit_card' | 'pix'
    })
  })

  const json = await res.json()
  if (!res.ok) throw new Error(`Pagar.me: ${json.message}`)
  return json.id
}
```

## Webhook para atualizar status da assinatura

```typescript
// src/routes/webhookRoutes.ts
router.post('/webhook/pagarme', express.raw({ type: 'application/json' }), async (req, res) => {
  // Validar assinatura do webhook
  const assinatura = req.headers['x-hub-signature'] as string
  const payload = req.body.toString()
  const esperado = `sha1=${crypto.createHmac('sha1', process.env.PAGARME_WEBHOOK_SECRET!).update(payload).digest('hex')}`

  if (assinatura !== esperado) {
    return res.status(401).json({ error: 'Webhook inválido' })
  }

  const evento = JSON.parse(payload)

  if (evento.type === 'subscription.status_changed') {
    const pagarmeSubId = evento.data.id
    const novoStatus = evento.data.status  // 'active' | 'canceled' | 'unpaid'

    await prisma.assinatura.update({
      where: { pagarmeSubId },
      data: { status: mapearStatus(novoStatus) }
    })
  }

  res.json({ ok: true })
})
```

## Gating de features (freemium)

```typescript
// middleware/plano.ts — verificar plano antes de liberar feature
export async function exigirPlano(plano: 'pro') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const assinatura = await prisma.assinatura.findUnique({
      where: { userId: req.userId }
    })

    if (!assinatura || assinatura.plano !== plano || assinatura.status !== 'ativa') {
      return res.status(403).json({
        error: 'Recurso disponível apenas no plano Pro',
        upgrade: true
      })
    }

    next()
  }
}

// Uso nas rotas:
router.post('/contratos', auth, exigirPlano('pro'), ContratoController.criar)
```

## Checklist antes de ativar billing

- [ ] Schema adicionado com aprovação do Victor + `db push` executado
- [ ] Variáveis de ambiente configuradas no Render (nunca no código)
- [ ] Webhook registrado no painel do Pagar.me apontando para a URL do backend
- [ ] Webhook valida assinatura HMAC antes de processar
- [ ] Rota de webhook usa `express.raw()` (não `express.json()`) — necessário para validação HMAC
- [ ] Dados de cartão nunca passam pelo backend (tokenizados no frontend via SDK Pagar.me)
- [ ] Testado com chave de teste (`ak_test_`) antes de ativar chave de produção
