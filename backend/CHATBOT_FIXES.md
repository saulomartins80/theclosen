# 🔧 Correções Necessárias para o Chatbot

## Problemas Identificados:

### 1. **Campo `instituicao` não está sendo salvo**
- O chatbot detecta "C6" como `conta` mas não salva no campo `instituicao`
- Precisa mapear `entities.conta` para `payload.instituicao`

### 2. **Problema de Validação de Valor**
- Sistema cria investimentos com valor R$ 0,00 quando deveria perguntar
- Precisa validar se o valor foi fornecido antes de criar

### 3. **Problema de Conversa**
- Erro constante: "Conversa não encontrada"
- Problema no serviço de histórico de chat

## Correções Necessárias:

### 1. Atualizar `automatedActionsController.ts`:

```typescript
// Linha 21-27: Atualizar interface
interface InvestmentPayload {
  nome: string;
  valor: number;
  tipo: string;
  data: string;
  instituicao?: string; // Adicionar campo opcional
}

// Linha 229-237: Corrigir função mapInvestmentData
function mapInvestmentData(entities: any): InvestmentPayload {
  // Garantir que o valor seja um número válido
  const valor = parseFloat(entities.valor) || 0;
  
  return {
    nome: entities.nome || 'Investimento automático',
    valor: valor,
    tipo: entities.tipo || 'Renda Fixa',
    data: entities.data || new Date().toISOString().split('T')[0],
    instituicao: entities.conta || entities.instituicao || undefined
  };
}

// Linha 604-664: Atualizar função createInvestment
export async function createInvestment(userId: string, payload: any) {
  // Validar se o valor foi fornecido
  const valor = parseFloat(payload.valor) || 0;
  if (valor <= 0) {
    throw new Error('Por favor, informe o valor do investimento');
  }

  // ... resto do código existente ...

  const investimento = new Investimento({
    userId,
    nome: payload.nome || 'Investimento',
    tipo,
    valor,
    data: payload.data ? new Date(payload.data) : new Date(),
    instituicao: payload.instituicao, // Adicionar campo instituicao
    createdAt: new Date()
  });
  
  await investimento.save();
  return investimento;
}
```

### 2. Atualizar `chatbotController.ts`:

```typescript
// Melhorar detecção de entidades para incluir instituição
const prompt = `... extraia também:
- instituicao: banco/corretora (ex: "C6", "Nubank", "XP")
- conta: conta específica (se mencionada)
...`;
```

### 3. Corrigir `chatHistoryService.ts`:

```typescript
// Verificar se a conversa existe antes de tentar buscar
async getConversation(conversationId: string) {
  try {
    const conversation = await ChatMessage.findOne({ conversationId });
    if (!conversation) {
      console.log(`[ChatHistoryService] Conversa ${conversationId} não encontrada`);
      return null; // Retornar null em vez de throw error
    }
    return conversation;
  } catch (error) {
    console.error('[ChatHistoryService] Erro ao buscar conversa:', error);
    return null;
  }
}
```

## Testes Necessários:

1. **Teste de criação de investimento com instituição:**
   - "quero investir em cdb 2000 reais no c6"
   - Deve salvar: nome="CDB", valor=2000, tipo="CDB", instituicao="C6"

2. **Teste de validação de valor:**
   - "quero add uma novo investimento em cdb"
   - Deve perguntar o valor em vez de criar com R$ 0

3. **Teste de histórico de conversa:**
   - Verificar se não há mais erros de "Conversa não encontrada"

## Status:
- ✅ Problemas identificados
- ⏳ Aguardando implementação das correções
- ⏳ Aguardando testes 