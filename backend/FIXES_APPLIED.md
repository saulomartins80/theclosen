# Correções Necessárias - Problemas Identificados nos Logs

## Problemas Encontrados

### 1. **Erro de Validação de Investimentos**
- **Problema**: O sistema está tentando criar investimentos com valores inválidos (0) e tipos não reconhecidos ("criptomoeda")
- **Erro**: `Path 'valor' (0) is less than minimum allowed value (0.01)`
- **Erro**: `'criptomoeda' is not a valid enum value for path 'tipo'`

### 2. **Erro de Duplicação na Exclusão**
- **Problema**: Tentativa dupla de exclusão da mesma conversa causando erro 500
- **Log**: `Conversa 81bed422-a5f1-4065-8ca1-e756719c30e4 excluída com sucesso` seguido de `Conversa não encontrada`

### 3. **Detecção de Intenções**
- **Problema**: AI retornando "UNKNOWN" para mensagens que deveriam ser reconhecidas
- **Exemplo**: "vamos nessa" e "porque a data esta 28 hoje e 27"

## Correções Implementadas

### 1. **Melhorar Validação de Investimentos**

No arquivo `backend/src/controllers/chatbotController.ts`, função `createInvestment`:

```typescript
async function createInvestment(userId: string, payload: any) {
  // Mapeamento de tipos de investimento
  const tipoMapping: { [key: string]: string } = {
    'criptomoeda': 'Criptomoedas',
    'criptomoedas': 'Criptomoedas',
    'crypto': 'Criptomoedas',
    'bitcoin': 'Criptomoedas',
    'btc': 'Criptomoedas',
    'tesouro': 'Tesouro Direto',
    'tesouro direto': 'Tesouro Direto',
    'acoes': 'Ações',
    'ações': 'Ações',
    'fii': 'Fundos Imobiliários',
    'fundos imobiliarios': 'Fundos Imobiliários',
    'fundos imobiliários': 'Fundos Imobiliários',
    'previdencia': 'Previdência Privada',
    'previdência': 'Previdência Privada',
    'etf': 'ETF',
    'internacional': 'Internacional',
    'renda variavel': 'Renda Variável',
    'renda variável': 'Renda Variável',
    'renda fixa': 'Renda Fixa'
  };

  // Mapear o tipo se necessário
  let tipo = payload.tipo;
  if (tipoMapping[tipo.toLowerCase()]) {
    tipo = tipoMapping[tipo.toLowerCase()];
  }

  // Validar valor mínimo
  const valor = parseFloat(payload.valor) || 0;
  if (valor < 0.01) {
    throw new Error('O valor do investimento deve ser maior que R$ 0,01');
  }

  // Validar se o tipo é válido
  const tiposValidos = [
    'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários',
    'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável'
  ];
  
  if (!tiposValidos.includes(tipo)) {
    throw new Error(`Tipo de investimento inválido. Tipos válidos: ${tiposValidos.join(', ')}`);
  }

  const investimento = new Investimento({
    userId,
    nome: payload.nome || 'Investimento',
    tipo,
    valor,
    data: payload.data ? new Date(payload.data) : new Date(),
    createdAt: new Date()
  });
  
  await investimento.save();
  return investimento;
}
```

### 2. **Corrigir Erro de Duplicação na Exclusão**

No arquivo `backend/src/controllers/chatbotController.ts`, função `deleteConversation`:

```typescript
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Verificar se a conversa existe antes de tentar excluir
    try {
      const conversation = await chatHistoryService.getConversation(chatId);
      
      // Verificar se a conversa pertence ao usuário
      if (conversation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }
    } catch (error) {
      // Se a conversa não existe, retornar sucesso (já foi excluída)
      return res.status(200).json({ 
        success: true, 
        message: 'Conversa não encontrada ou já foi excluída' 
      });
    }

    await chatHistoryService.deleteConversation(chatId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Conversa excluída com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao excluir conversa:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir conversa' 
    });
  }
};
```

### 3. **Melhorar Detecção de Intenções**

No arquivo `backend/src/services/aiService.ts`, melhorar o prompt de detecção:

```typescript
const actionDetectionPrompt = `
Analise a mensagem do usuário e detecte a intenção. Considere:

1. **CREATE_INVESTMENT**: "quero investir", "apliquei", "comprei ações", "investimento em", "R$ X em"
2. **CREATE_TRANSACTION**: "gastei", "recebi", "paguei", "comprei", "transferência"
3. **CREATE_GOAL**: "quero juntar", "meta de", "economizar para", "guardar para"
4. **ANALYZE_DATA**: "analise", "resumo", "como estou", "performance"
5. **GENERATE_REPORT**: "relatório", "report", "estatísticas"

Mensagens como "vamos nessa", "ok", "sim" devem ser tratadas como confirmações de ações anteriores.

Responda apenas com JSON válido:
{
  "intent": "INTENT_NAME",
  "entities": {},
  "confidence": 0.0-1.0,
  "response": "Resposta para o usuário",
  "requiresConfirmation": true/false
}
`;
```

## Status das Correções

- [ ] **Validação de Investimentos**: Precisa ser implementada
- [ ] **Erro de Duplicação**: Precisa ser corrigido
- [ ] **Detecção de Intenções**: Precisa ser melhorada

## Próximos Passos

1. Aplicar as correções nos arquivos correspondentes
2. Testar as funcionalidades de criação de investimentos
3. Testar a exclusão de conversas
4. Melhorar os prompts de detecção de intenções
5. Monitorar os logs para verificar se os problemas foram resolvidos 

# Correções Aplicadas para Problemas de Webhook

## Problemas Identificados nos Logs

### 1. Erro: `subscription_exposed_id` é null
**Erro:** `Stripe: Argument "subscription_exposed_id" must be a string, but got: null`
**Localização:** SubscriptionController.ts linha 91

### 2. Erro: Webhook payload deve ser string ou Buffer
**Erro:** `Webhook payload must be provided as a string or a Buffer instance`
**Causa:** Configuração duplicada do express.raw()

### 3. Erro: Portal do cliente não configurado
**Erro:** `No configuration provided and your test mode default configuration has not been created`

## Correções Necessárias

### 1. Corrigir validação de subscription no webhook

No arquivo `backend/src/modules/subscriptions/controllers/SubscriptionController.ts`, 
adicionar validação antes de chamar `stripe.subscriptions.retrieve()`:

```typescript
// Verificar se session.subscription existe antes de tentar recuperar
if (!session.subscription) {
  console.log('Subscription ID não encontrado na sessão:', session);
  res.status(400).json({ error: 'Subscription ID não encontrado na sessão' });
  return;
}
```

### 2. Remover configuração duplicada do express.raw

No arquivo `backend/src/index.ts`, remover a linha duplicada na linha 82:

```typescript
// REMOVER esta linha:
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
```

### 3. Configurar Portal do Cliente no Stripe

1. Acesse https://dashboard.stripe.com/test/settings/billing/portal
2. Configure as opções do portal
3. Salve as configurações

### 4. Verificar variáveis de ambiente

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

## Status das Correções

- [ ] Validação de subscription no webhook
- [ ] Remoção de express.raw duplicado
- [ ] Configuração do portal do cliente
- [ ] Verificação de variáveis de ambiente

## Comandos para Aplicar

```bash
# 1. Parar o servidor
pkill -f "node.*backend"

# 2. Aplicar correções nos arquivos

# 3. Reiniciar o servidor
cd backend
npm run dev
``` 