# Correções para Problemas de Webhook e Assinatura Stripe

## Problemas Identificados

### 1. Erro: `subscription_exposed_id` é null
**Localização:** `backend/src/modules/subscriptions/controllers/SubscriptionController.ts:91`
**Erro:** `Stripe: Argument "subscription_exposed_id" must be a string, but got: null`

### 2. Erro: Webhook payload deve ser string ou Buffer
**Localização:** `backend/src/index.ts`
**Erro:** `Webhook payload must be provided as a string or a Buffer instance`

### 3. Erro: Portal do cliente não configurado
**Erro:** `No configuration provided and your test mode default configuration has not been created`

## Correções Necessárias

### 1. Corrigir validação de subscription no webhook

No arquivo `backend/src/modules/subscriptions/controllers/SubscriptionController.ts`, 
adicionar validação antes da linha 91:

```typescript
// Verificar se session.subscription existe antes de tentar recuperar
if (!session.subscription) {
  console.log('Subscription ID não encontrado na sessão:', session);
  res.status(400).json({ error: 'Subscription ID não encontrado na sessão' });
  return;
}
```

### 2. Remover configuração duplicada do express.raw

No arquivo `backend/src/index.ts`, remover a linha duplicada:

```typescript
// REMOVER esta linha (linha 82):
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// MANTER apenas esta linha (linha 237):
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
```

### 3. Configurar Portal do Cliente no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá para Settings > Billing > Customer Portal
3. Configure as opções do portal:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Allow customers to update billing information
4. Salve as configurações

### 4. Verificar variáveis de ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
FRONTEND_URL=http://localhost:3000
```

### 5. Atualizar middleware de webhook

No arquivo `backend/src/modules/subscriptions/routes/subscriptionRoutes.ts`, 
usar o middleware específico do Stripe:

```typescript
import { stripeWebhookMiddleware, stripeWebhookMiddlewareHandler } from '../../../middlewares/stripeWebhookMiddleware';

// ... outras rotas ...

// Usar middleware específico para webhook
router.post('/webhook', stripeWebhookMiddleware, stripeWebhookMiddlewareHandler, subscriptionController.handleWebhook.bind(subscriptionController));
```

## Testes Recomendados

1. **Testar criação de sessão de checkout:**
   ```bash
   curl -X POST http://localhost:5000/api/subscriptions/create-checkout-session \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"priceId": "price_123", "planName": "premium"}'
   ```

2. **Testar webhook (usando Stripe CLI):**
   ```bash
   stripe listen --forward-to localhost:5000/api/subscriptions/webhook
   ```

3. **Verificar logs:**
   ```bash
   tail -f backend/logs/combined.log
   ```

## Comandos para Aplicar Correções

```bash
# 1. Parar o servidor
pkill -f "node.*backend"

# 2. Aplicar correções nos arquivos

# 3. Reiniciar o servidor
cd backend
npm run dev
```

## Monitoramento

Após aplicar as correções, monitore os logs para verificar se os erros foram resolvidos:

```bash
# Monitorar logs em tempo real
tail -f backend/logs/combined.log | grep -E "(error|Error|ERROR)"
``` 