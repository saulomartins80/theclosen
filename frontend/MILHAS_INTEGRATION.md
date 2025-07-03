# Sistema de Milhas - Integração Frontend/Backend

## Visão Geral

O sistema de milhas foi completamente integrado entre frontend e backend, permitindo:

- ✅ **Observação em tempo real** do backend pelo frontend
- ✅ **API completa** para todas as operações de milhas
- ✅ **Integração com Pluggy** para sincronização automática
- ✅ **Calculadora de milhas** inteligente
- ✅ **Recomendações de cartões** personalizadas
- ✅ **Análises e relatórios** detalhados

## Estrutura da Integração

### Backend (`/backend`)

#### 1. Rotas (`src/routes/`)
- **`mileageRoutes.ts`** - Endpoints para sistema de milhas
- **`pluggyRoutes.ts`** - Integração com Pluggy
- **`index.ts`** - Roteamento principal

#### 2. Controllers (`src/controllers/`)
- **`mileageController.ts`** - Lógica de negócio para milhas
- **`pluggyController.ts`** - Integração com Pluggy

#### 3. Utilitários (`src/utils/`)
- **`mileageCalculator.ts`** - Cálculos inteligentes de milhas
- **`asyncHandler.ts`** - Tratamento de erros assíncronos

#### 4. Modelos (`src/models/`)
- **`Mileage.ts`** - Schema do MongoDB para milhas

### Frontend (`/frontend`)

#### 1. API (`services/api.ts`)
- **`mileageAPI`** - Cliente HTTP para todas as operações
- **Interceptors** - Autenticação e tratamento de erros

#### 2. Hook Personalizado (`hooks/useMileage.ts`)
- **Estado centralizado** para milhas
- **Operações CRUD** completas
- **Integração com Pluggy**

#### 3. Página (`pages/milhas.tsx`)
- **Interface completa** do sistema
- **Integração com hook** personalizado
- **UX moderna** com animações

## Endpoints da API

### Sistema de Milhas

```typescript
// Programas de Milhas
GET    /api/mileage/programs          // Listar programas
PUT    /api/mileage/programs/:id      // Atualizar programa

// Cartões de Milhas
GET    /api/mileage/cards             // Listar cartões
POST   /api/mileage/cards             // Adicionar cartão
PUT    /api/mileage/cards/:id         // Atualizar cartão
DELETE /api/mileage/cards/:id         // Remover cartão

// Transações de Milhas
GET    /api/mileage/transactions      // Listar transações
POST   /api/mileage/transactions      // Adicionar transação

// Análises e Relatórios
GET    /api/mileage/analytics         // Análises de milhas
POST   /api/mileage/recommendations   // Recomendações de cartões
POST   /api/mileage/calculate         // Calculadora de milhas
```

### Integração Pluggy

```typescript
// Pluggy
GET    /api/pluggy/connect-token      // Token de conexão
POST   /api/pluggy/item-created       // Webhook de item criado
GET    /api/pluggy/mileage-summary    // Resumo de milhas
GET    /api/pluggy/connections        // Listar conexões
DELETE /api/pluggy/connections/:id    // Desconectar
```

## Funcionalidades Implementadas

### 1. Calculadora de Milhas Inteligente

```typescript
// Backend: src/utils/mileageCalculator.ts
const result = calculateMiles({
  amount: 100,
  description: "Compra no supermercado",
  category: "Supermercado",
  paymentData: {
    cardLastDigits: "4539",
    establishment: "Extra"
  }
});

// Resultado:
{
  program: "Smiles",
  points: 375,
  monetaryValue: 9.38,
  cardName: "Cartão ****4539"
}
```

### 2. Recomendações de Cartões

```typescript
// Baseado no gasto mensal e programas preferidos
const recommendations = getCardRecommendations(5000, ["Smiles", "TudoAzul"]);

// Retorna cartões ordenados por melhor retorno
[
  {
    cartao: "Itaú Personnalité Smiles",
    programa: "Smiles",
    pts_por_real: 2.5,
    pontos_anuais: 150000,
    valor_anual: 3750,
    destaque: "2.5 pts/R$ em todas as compras"
  }
]
```

### 3. Integração Pluggy

```typescript
// 1. Obter token de conexão
const tokenData = await mileageAPI.getConnectToken();

// 2. Redirecionar para Pluggy
window.open(`https://pluggy.ai/connect?token=${tokenData.token}`, '_blank');

// 3. Webhook processa transações automaticamente
// 4. Milhas são calculadas e salvas
```

### 4. Hook Personalizado

```typescript
// Frontend: hooks/useMileage.ts
const {
  mileagePrograms,
  recentTransactions,
  mileageCards,
  isLoading,
  loadMileageData,
  connectPluggy,
  addMileageCard,
  calculateMiles
} = useMileage();
```

## Fluxo de Dados

### 1. Carregamento Inicial
```
Frontend → useMileage() → mileageAPI → Backend → MongoDB
```

### 2. Adição de Transação
```
Frontend → addMileageTransaction() → mileageAPI → Backend → MongoDB → Frontend (atualizado)
```

### 3. Integração Pluggy
```
Pluggy → Webhook → Backend → Processamento → MongoDB → Frontend (atualizado)
```

### 4. Cálculo de Milhas
```
Frontend → calculateMiles() → mileageAPI → Backend → mileageCalculator → Frontend
```

## Configuração

### Backend

1. **Variáveis de Ambiente**
```env
PLUGGY_CLIENT_ID=your_pluggy_client_id
PLUGGY_CLIENT_SECRET=your_pluggy_client_secret
MONGODB_URI=your_mongodb_uri
```

2. **Instalação**
```bash
cd backend
npm install
npm run build
npm start
```

### Frontend

1. **Variáveis de Ambiente**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

2. **Instalação**
```bash
cd frontend
npm install
npm run dev
```

## Monitoramento e Logs

### Backend
- Logs detalhados em todas as operações
- Tratamento de erros centralizado
- Métricas de performance

### Frontend
- Interceptors para logs de API
- Toast notifications para feedback
- Loading states para UX

## Próximos Passos

1. **Implementar WebSocket** para atualizações em tempo real
2. **Adicionar cache Redis** para melhor performance
3. **Implementar testes automatizados**
4. **Adicionar mais programas de milhas**
5. **Criar dashboard de analytics avançado**

## Troubleshooting

### Erro de Conexão
```bash
# Verificar se o backend está rodando
curl http://localhost:3001/api/mileage/programs

# Verificar logs do backend
npm run dev # no backend
```

### Erro de Autenticação
```bash
# Verificar token no frontend
localStorage.getItem('authToken')

# Verificar middleware de auth no backend
src/middlewares/authMiddleware.ts
```

### Erro de Pluggy
```bash
# Verificar credenciais
echo $PLUGGY_CLIENT_ID
echo $PLUGGY_CLIENT_SECRET

# Testar webhook
curl -X POST http://localhost:3001/api/pluggy/item-created
```

## Contribuição

Para adicionar novas funcionalidades:

1. **Backend**: Adicionar endpoint em `mileageRoutes.ts`
2. **Frontend**: Adicionar método em `mileageAPI`
3. **Hook**: Adicionar função em `useMileage`
4. **UI**: Atualizar componente em `milhas.tsx`

---

**Status**: ✅ **Integração Completa e Funcional**
**Última Atualização**: Dezembro 2024
**Versão**: 1.0.0 