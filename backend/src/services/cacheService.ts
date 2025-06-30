//cacheService.ts
import Redis from 'ioredis';
import { AppError } from '../core/errors/AppError';

export class CacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutos
  private readonly PREMIUM_TTL = 600; // 10 minutos
  private readonly USER_PREFERENCES_TTL = 3600; // 1 hora

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
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        db: 0,
      });
    }

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  // Cache de respostas do chatbot
  async cacheResponse(key: string, response: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = `chatbot:response:${key}`;
      await this.redis.setex(cacheKey, ttl, JSON.stringify(response));
      console.log(`[Cache] Response cached: ${cacheKey}`);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  async getCachedResponse(key: string): Promise<any | null> {
    try {
      const cacheKey = `chatbot:response:${key}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        console.log(`[Cache] Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
      
      console.log(`[Cache] Cache miss: ${cacheKey}`);
      return null;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  // Cache de contexto do usuário
  async cacheUserContext(userId: string, context: any): Promise<void> {
    try {
      const cacheKey = `chatbot:context:${userId}`;
      await this.redis.setex(cacheKey, this.USER_PREFERENCES_TTL, JSON.stringify(context));
    } catch (error) {
      console.error('Error caching user context:', error);
    }
  }

  async getUserContext(userId: string): Promise<any | null> {
    try {
      const cacheKey = `chatbot:context:${userId}`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  // Cache de sugestões
  async cacheSuggestions(query: string, suggestions: string[]): Promise<void> {
    try {
      const cacheKey = `chatbot:suggestions:${this.hashString(query)}`;
      await this.redis.setex(cacheKey, this.DEFAULT_TTL, JSON.stringify(suggestions));
    } catch (error) {
      console.error('Error caching suggestions:', error);
    }
  }

  async getCachedSuggestions(query: string): Promise<string[] | null> {
    try {
      const cacheKey = `chatbot:suggestions:${this.hashString(query)}`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached suggestions:', error);
      return null;
    }
  }

  // Cache de análise de sentimentos
  async cacheSentimentAnalysis(text: string, sentiment: any): Promise<void> {
    try {
      const cacheKey = `chatbot:sentiment:${this.hashString(text)}`;
      await this.redis.setex(cacheKey, this.DEFAULT_TTL, JSON.stringify(sentiment));
    } catch (error) {
      console.error('Error caching sentiment analysis:', error);
    }
  }

  async getCachedSentimentAnalysis(text: string): Promise<any | null> {
    try {
      const cacheKey = `chatbot:sentiment:${this.hashString(text)}`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached sentiment analysis:', error);
      return null;
    }
  }

  // Cache de métricas de performance
  async cachePerformanceMetrics(metrics: any): Promise<void> {
    try {
      const cacheKey = `chatbot:metrics:${new Date().toISOString().split('T')[0]}`;
      await this.redis.setex(cacheKey, 86400, JSON.stringify(metrics)); // 24 horas
    } catch (error) {
      console.error('Error caching performance metrics:', error);
    }
  }

  // Limpeza de cache
  async clearUserCache(userId: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`chatbot:*:${userId}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`[Cache] Cleared ${keys.length} keys for user ${userId}`);
      }
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('chatbot:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`[Cache] Cleared all ${keys.length} cache keys`);
      }
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // Estatísticas do cache
  async getCacheStats(): Promise<any> {
    try {
      const info = await this.redis.info();
      const keys = await this.redis.keys('chatbot:*');
      
      return {
        totalKeys: keys.length,
        responseKeys: keys.filter(k => k.includes('response')).length,
        contextKeys: keys.filter(k => k.includes('context')).length,
        suggestionKeys: keys.filter(k => k.includes('suggestions')).length,
        sentimentKeys: keys.filter(k => k.includes('sentiment')).length,
        redisInfo: info
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Utilitário para hash de strings
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Fechar conexão
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

export default new CacheService(); 