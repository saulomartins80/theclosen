# 🔧 Correção Rápida - Fluxo do Chatbot

## Problemas:
1. **Criação automática sem perguntar detalhes**
2. **Repetição de "Oi, Saulo" em todas as mensagens**
3. **Fluxo inadequado para metas, investimentos e transações**

## Correções Rápidas para Aplicar:

### 1. **No arquivo `backend/src/controllers/automatedActionsController.ts`**

**Encontrar a linha ~55 e substituir o prompt por:**

```typescript
const ACTION_DETECTION_PROMPT = `Você é um assistente especializado em detectar intenções financeiras. Analise a mensagem do usuário e identifique se ele quer:

CRIAR META:
- "Quero juntar R$ X para Y" → CREATE_GOAL (se X e Y estiverem claros)
- "Meta de R$ X para Y" → CREATE_GOAL (se X e Y estiverem claros)
- "estou querendo add uma nova meta" → CREATE_GOAL (solicitar detalhes)
- "quero criar uma meta" → CREATE_GOAL (solicitar detalhes)

CRIAR TRANSAÇÃO:
- "Gastei R$ X no Y" → CREATE_TRANSACTION (se X e Y estiverem claros)
- "estou querendo add uma nova transação" → CREATE_TRANSACTION (solicitar detalhes)
- "quero registrar uma transação" → CREATE_TRANSACTION (solicitar detalhes)

CRIAR INVESTIMENTO:
- "Investi R$ X em Y" → CREATE_INVESTMENT (se X e Y estiverem claros)
- "estou querendo add um novo investimento" → CREATE_INVESTMENT (solicitar detalhes)
- "quero criar um investimento" → CREATE_INVESTMENT (solicitar detalhes)

IMPORTANTE:
- Se o usuário só mencionar a intenção sem detalhes, SEMPRE solicitar mais informações
- NUNCA criar automaticamente com valores padrão
- SEMPRE perguntar detalhes quando faltar informação essencial

EXTRAGA as seguintes informações:
- intent: tipo de ação
- entities: dados extraídos (só se mencionados)
- confidence: confiança da detecção
- response: resposta natural SEMPRE perguntando detalhes se faltar informação
- requiresConfirmation: SEMPRE true se faltar detalhes essenciais

RESPONDA APENAS COM JSON válido.`;
```

### 2. **Encontrar a função `mapInvestmentData` (linha ~230) e substituir por:**

```typescript
function mapInvestmentData(entities: any): InvestmentPayload {
  // Se não há dados suficientes, retornar payload vazio
  if (!entities.valor || !entities.tipo || !entities.nome) {
    return {
      nome: '',
      valor: 0,
      tipo: '',
      data: new Date().toISOString().split('T')[0],
      instituicao: undefined
    };
  }
  
  // Garantir que o valor seja um número válido
  const valor = parseFloat(entities.valor) || 0;
  
  return {
    nome: entities.nome || '',
    valor: valor,
    tipo: entities.tipo || '',
    data: entities.data || new Date().toISOString().split('T')[0],
    instituicao: entities.conta || entities.instituicao || undefined
  };
}
```

### 3. **Encontrar a função `detectUserIntent` (linha ~120) e adicionar após a linha `console.log('[DETECT_USER_INTENT] Raw AI response:', aiResponse);`:**

```typescript
    // Verificar se há dados suficientes para ações de criação
    if (aiResponse.intent === 'CREATE_INVESTMENT' || 
        aiResponse.intent === 'CREATE_TRANSACTION' || 
        aiResponse.intent === 'CREATE_GOAL') {
      
      // Verificar se há dados suficientes
      const hasEnoughData = Object.values(aiResponse.entities).some(val => val !== null && val !== undefined && val !== '');
      
      if (!hasEnoughData) {
        // Forçar requiresConfirmation = true
        aiResponse.requiresConfirmation = true;
        
        // Personalizar resposta baseada no tipo de ação
        const actionType = aiResponse.intent === 'CREATE_INVESTMENT' ? 'investimento' : 
                          aiResponse.intent === 'CREATE_TRANSACTION' ? 'transação' : 'meta';
        
        aiResponse.response = `Ótimo! Vamos criar um novo ${actionType}. Por favor, me informe os detalhes necessários.`;
      }
    }
```

## Resultado Esperado:

### **Antes (Problema):**
**Usuário:** "estou querendo add um novo investimento"
**Chatbot:** Cria automaticamente com valor R$ 0

### **Depois (Correção):**
**Usuário:** "estou querendo add um novo investimento"
**Chatbot:** "Ótimo! Vamos criar um novo investimento. Por favor, me informe os detalhes necessários."

## Teste:
1. Aplicar as correções
2. Testar com: "estou querendo add um novo investimento"
3. Verificar se agora pergunta detalhes em vez de criar automaticamente 