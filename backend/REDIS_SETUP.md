# Configuração do Redis no Render - TheClosen

## ✅ Redis Configurado com Sucesso!

### 📋 **Detalhes da Instância:**
- **Nome**: `finextho-redis`
- **URL Interna**: `redis://red-d1gsqdvgi27c73c34r8g:6379`
- **Plan**: Free (25 MB RAM, 50 conexões)
- **Região**: Oregon
- **Runtime**: Valkey 8.1.0

## 🔧 **Configuração no Backend**

### 1. **Variável de Ambiente**

No painel do Render, no seu serviço web `theclosen-backend`:

1. Vá para **"Environment"**
2. Adicione a variável:
   - **Key**: `REDIS_URL`
   - **Value**: `redis://red-d1gsqdvgi27c73c34r8g:6379`

### 2. **Código Já Configurado**

O `cacheService.ts` já está configurado para usar `REDIS_URL`:

```typescript
constructor() {
  // Usar REDIS_URL se disponível, senão usar configuração individual
  if (process.env.REDIS_URL) {
    this.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
    });
  } else {
    // Fallback para configuração individual
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      // ... outras configurações
    });
  }
}
```

## 🚀 **Funcionalidades do Redis**

### **Cache Implementado:**

1. **Cache de Respostas do Chatbot**
   - Chave: `chatbot:response:{key}`
   - TTL: 5 minutos (padrão)

2. **Cache de Contexto do Usuário**
   - Chave: `chatbot:context:{userId}`
   - TTL: 1 hora

3. **Cache de Sugestões**
   - Chave: `chatbot:suggestions:{hash}`
   - TTL: 5 minutos

4. **Cache de Análise de Sentimentos**
   - Chave: `chatbot:sentiment:{hash}`
   - TTL: 5 minutos

5. **Cache de Métricas de Performance**
   - Chave: `chatbot:metrics:{date}`
   - TTL: 24 horas

### **Operações Disponíveis:**

- ✅ **Set/Get** - Armazenar e recuperar dados
- ✅ **SetEx** - Armazenar com TTL
- ✅ **Keys** - Buscar chaves por padrão
- ✅ **Del** - Remover chaves
- ✅ **Ping** - Health check
- ✅ **Info** - Estatísticas do Redis

## 📊 **Monitoramento**

### **Health Check**
O Redis é verificado automaticamente no endpoint `/health` do backend.

### **Logs**
- Conexão bem-sucedida: `✅ Redis connected successfully`
- Erros de conexão: `Redis connection error: {error}`
- Operações de cache: `[Cache] Response cached: {key}`

### **Estatísticas**
Use o método `getCacheStats()` para obter:
- Total de chaves
- Chaves por tipo (response, context, suggestions, sentiment)
- Informações do Redis

## 🔍 **Teste de Conexão**

### **Via Código:**
```typescript
import { CacheService } from './services/cacheService';

const cacheService = new CacheService();
const isHealthy = await cacheService.healthCheck();
console.log('Redis Health:', isHealthy);
```

### **Via Health Check:**
Acesse: `https://theclosen-backend.onrender.com/health`

O endpoint retornará o status do Redis junto com outros serviços.

## 🛠️ **Troubleshooting**

### **Problemas Comuns:**

1. **Erro de Conexão**
   - Verifique se `REDIS_URL` está configurada
   - Confirme se a URL está correta
   - Verifique se o Redis está ativo no Render

2. **Timeout de Conexão**
   - O código já tem `maxRetriesPerRequest: 3`
   - `lazyConnect: true` para conexão sob demanda

3. **Limite de Memória**
   - Plan Free: 25 MB
   - Monitore o uso via logs
   - Implemente limpeza automática se necessário

### **Limpeza de Cache:**

```typescript
// Limpar cache de um usuário específico
await cacheService.clearUserCache(userId);

// Limpar todo o cache
await cacheService.clearAllCache();
```

## 📈 **Performance**

### **Benefícios:**
- **Cache de respostas** - Reduz latência da API
- **Contexto do usuário** - Melhora experiência do chatbot
- **Análise de sentimentos** - Evita reprocessamento
- **Métricas** - Armazenamento temporário de dados

### **Limitações do Plan Free:**
- **25 MB RAM** - Suficiente para cache temporário
- **50 conexões** - Adequado para desenvolvimento/teste
- **Sem persistência** - Dados são perdidos em restart

## 🔄 **Próximos Passos**

1. **Configure a variável `REDIS_URL`** no painel do Render
2. **Deploy o backend** para testar a conexão
3. **Monitore os logs** para verificar a conexão
4. **Teste as funcionalidades** que usam cache
5. **Considere upgrade** para planos pagos se necessário

## 📚 **Recursos Adicionais**

- [Documentação do ioredis](https://github.com/luin/ioredis)
- [Documentação do Render Redis](https://render.com/docs/redis)
- [Melhores práticas de cache](https://redis.io/topics/patterns)

---

**Status**: ✅ Configurado e Pronto para Uso
**Data**: 29/06/2025 