# 🔧 Correções do Fluxo do Chatbot

## Problemas Identificados:

### 1. **Criação automática sem perguntar detalhes**
- O chatbot está criando investimentos com valor R$ 0 automaticamente
- Não está perguntando detalhes quando o usuário só menciona a intenção

### 2. **Repetição de "Oi, Saulo"**
- Está repetindo o nome do usuário em todas as mensagens
- Precisa de respostas mais naturais

### 3. **Fluxo inadequado**
- Precisa perguntar detalhes antes de criar qualquer item

## Correções Necessárias:

### 1. **Melhorar o Prompt de Detecção** (automatedActionsController.ts):

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

### 2. **Melhorar as Funções de Mapeamento**:

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

### 3. **Melhorar a Lógica de Detecção**:

```typescript
// Em detectUserIntent, adicionar validação
if (aiResponse.intent === 'CREATE_INVESTMENT' || 
    aiResponse.intent === 'CREATE_TRANSACTION' || 
    aiResponse.intent === 'CREATE_GOAL') {
  
  // Verificar se há dados suficientes
  const hasEnoughData = Object.values(aiResponse.entities).some(val => val !== null && val !== undefined);
  
  if (!hasEnoughData) {
    // Forçar requiresConfirmation = true
    aiResponse.requiresConfirmation = true;
    aiResponse.response = `Ótimo! Vamos ${getActionVerb(aiResponse.intent)}. Por favor, me informe os detalhes:
    ${getRequiredFields(aiResponse.intent)}`;
  }
}
```

### 4. **Melhorar as Respostas** (chatbotController.ts):

```typescript
// Evitar repetir o nome do usuário em todas as mensagens
const generateResponse = (userName: string, message: string) => {
  // Usar o nome apenas na primeira mensagem ou quando necessário
  if (message.includes('Oi') || message.includes('Olá')) {
    return `Oi, ${userName}! Como posso te ajudar hoje?`;
  }
  
  return message; // Não incluir o nome em todas as mensagens
};
```

## Fluxo Correto Esperado:

### **Cenário 1: Usuário menciona intenção sem detalhes**
**Usuário:** "estou querendo add um novo investimento"
**Chatbot:** "Ótimo! Vamos adicionar um novo investimento. Por favor, me informe:
- Qual o valor que você quer investir?
- Que tipo de investimento (CDB, ações, fundos, etc.)?
- Em qual instituição/banco?"

### **Cenário 2: Usuário fornece detalhes completos**
**Usuário:** "quero investir R$ 2000 em CDB no C6"
**Chatbot:** "Perfeito! Vou registrar esse investimento para você:
- Valor: R$ 2000
- Tipo: CDB
- Instituição: C6
Confirma que está correto?"

## Status:
- ⏳ Aguardando implementação das correções
- ⏳ Aguardando testes do novo fluxo 