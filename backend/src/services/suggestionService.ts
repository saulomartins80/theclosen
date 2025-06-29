// SuggestionService.ts
import AIService from './aiService';
import cacheService from './cacheService';

export class SuggestionService {
  private aiService: AIService;
  private readonly SUGGESTION_CATEGORIES = {
    INVESTMENT: 'investimento',
    SUPPORT: 'suporte',
    EDUCATION: 'educacao',
    PLATFORM: 'plataforma',
    GENERAL: 'geral'
  };

  constructor() {
    this.aiService = new AIService();
  }

  // Gerar sugestões baseadas na mensagem atual
  async generateSuggestions(
    currentMessage: string,
    conversationHistory: any[],
    userContext?: any
  ): Promise<string[]> {
    try {
      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(currentMessage, conversationHistory);
      const cached = await cacheService.getCachedSuggestions(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Analisar contexto da conversa
      const context = this.analyzeConversationContext(currentMessage, conversationHistory);
      
      // Gerar sugestões baseadas no contexto
      const suggestions = await this.generateContextualSuggestions(context, userContext);
      
      // Cache das sugestões
      await cacheService.cacheSuggestions(cacheKey, suggestions);
      
      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }

  // Analisar contexto da conversa
  private analyzeConversationContext(currentMessage: string, history: any[]): any {
    const context = {
      currentTopic: this.extractTopic(currentMessage),
      conversationLength: history.length,
      recentTopics: this.extractRecentTopics(history),
      userIntent: this.detectIntent(currentMessage),
      messageType: this.classifyMessage(currentMessage)
    };

    return context;
  }

  // Extrair tópico da mensagem
  private extractTopic(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('investimento') || lowerMessage.includes('carteira') || lowerMessage.includes('ação')) {
      return 'investimento';
    }
    if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo') || lowerMessage.includes('poupança')) {
      return 'metas';
    }
    if (lowerMessage.includes('transação') || lowerMessage.includes('gasto') || lowerMessage.includes('despesa')) {
      return 'transacoes';
    }
    if (lowerMessage.includes('relatório') || lowerMessage.includes('análise') || lowerMessage.includes('dashboard')) {
      return 'relatorios';
    }
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('problema') || lowerMessage.includes('erro')) {
      return 'suporte';
    }
    
    return 'geral';
  }

  // Extrair tópicos recentes da conversa
  private extractRecentTopics(history: any[]): string[] {
    const recentMessages = history.slice(-5);
    const topics = new Set<string>();
    
    recentMessages.forEach(msg => {
      if (msg.sender === 'user') {
        const topic = this.extractTopic(msg.content);
        topics.add(topic);
      }
    });
    
    return Array.from(topics);
  }

  // Detectar intenção do usuário
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('como') || lowerMessage.includes('o que é') || lowerMessage.includes('explique')) {
      return 'explicacao';
    }
    if (lowerMessage.includes('quero') || lowerMessage.includes('preciso') || lowerMessage.includes('desejo')) {
      return 'acao';
    }
    if (lowerMessage.includes('melhor') || lowerMessage.includes('otimo') || lowerMessage.includes('recomendacao')) {
      return 'recomendacao';
    }
    if (lowerMessage.includes('problema') || lowerMessage.includes('erro') || lowerMessage.includes('nao funciona')) {
      return 'problema';
    }
    
    return 'consulta';
  }

  // Classificar tipo de mensagem
  private classifyMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.length < 10) {
      return 'curta';
    }
    if (lowerMessage.length > 100) {
      return 'longa';
    }
    if (lowerMessage.includes('?')) {
      return 'pergunta';
    }
    
    return 'afirmacao';
  }

  // Gerar sugestões contextuais
  private async generateContextualSuggestions(context: any, userContext?: any): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Sugestões baseadas no tópico atual
    switch (context.currentTopic) {
      case 'investimento':
        suggestions.push(
          'Como diversificar minha carteira de investimentos?',
          'Quais são os melhores investimentos para iniciantes?',
          'Como analisar o risco de um investimento?',
          'Qual a diferença entre renda fixa e variável?'
        );
        break;
        
      case 'metas':
        suggestions.push(
          'Como definir metas financeiras realistas?',
          'Qual a melhor forma de economizar para uma meta?',
          'Como acompanhar o progresso das minhas metas?',
          'Quanto devo poupar por mês?'
        );
        break;
        
      case 'transacoes':
        suggestions.push(
          'Como categorizar minhas transações automaticamente?',
          'Como criar um orçamento mensal?',
          'Como identificar gastos desnecessários?',
          'Como exportar meus dados financeiros?'
        );
        break;
        
      case 'relatorios':
        suggestions.push(
          'Como gerar relatórios personalizados?',
          'Quais são os principais indicadores financeiros?',
          'Como comparar meu desempenho com benchmarks?',
          'Como analisar tendências nos meus gastos?'
        );
        break;
        
      case 'suporte':
        suggestions.push(
          'Como alterar minha senha?',
          'Como cancelar minha assinatura?',
          'Como exportar meus dados?',
          'Como entrar em contato com o suporte?'
        );
        break;
        
      default:
        suggestions.push(
          'Como começar a investir?',
          'Como organizar minhas finanças?',
          'Quais são os principais conceitos financeiros?',
          'Como usar melhor a plataforma Finnextho?'
        );
    }

    // Adicionar sugestões baseadas na intenção
    if (context.userIntent === 'recomendacao') {
      suggestions.push(
        'Recomende investimentos para meu perfil',
        'Qual a melhor estratégia para meus objetivos?',
        'Como otimizar minha carteira atual?'
      );
    }

    // Adicionar sugestões baseadas no contexto do usuário
    if (userContext) {
      if (userContext.isPremium) {
        suggestions.push(
          'Análise avançada da minha carteira',
          'Estratégias de investimento personalizadas',
          'Otimização fiscal dos meus investimentos'
        );
      }
      
      if (userContext.hasInvestments) {
        suggestions.push(
          'Como rebalancear minha carteira?',
          'Análise de performance dos meus investimentos',
          'Como diversificar melhor?'
        );
      }
    }

    // Retornar até 6 sugestões únicas
    return [...new Set(suggestions)].slice(0, 6);
  }

  // Sugestões de fallback
  private getFallbackSuggestions(): string[] {
    return [
      'Como começar a investir?',
      'Como organizar minhas finanças?',
      'Como usar a plataforma Finnextho?',
      'Quais são os planos disponíveis?'
    ];
  }

  // Gerar cache key
  private generateCacheKey(message: string, history: any[]): string {
    const recentHistory = history.slice(-3).map(h => h.content).join(' ');
    return `${message.toLowerCase().substring(0, 50)}_${recentHistory.substring(0, 100)}`;
  }

  // Sugestões baseadas em tendências
  async getTrendingSuggestions(): Promise<string[]> {
    const trendingTopics = [
      'Como investir em criptomoedas com segurança?',
      'Estratégias para aposentadoria precoce (FIRE)',
      'Como proteger investimentos da inflação?',
      'Investimentos ESG e sustentabilidade',
      'Como aproveitar oportunidades de mercado?',
      'Estratégias de dividendos para renda passiva'
    ];
    
    return trendingTopics;
  }

  // Sugestões personalizadas baseadas no histórico
  async getPersonalizedSuggestions(userId: string, userContext: any): Promise<string[]> {
    try {
      // Aqui você pode implementar lógica mais avançada
      // baseada no histórico do usuário, preferências, etc.
      
      const suggestions: string[] = [];
      
      if (userContext.hasInvestments) {
        suggestions.push(
          'Como otimizar minha carteira atual?',
          'Análise de performance dos meus investimentos',
          'Estratégias para aumentar a rentabilidade'
        );
      }
      
      if (userContext.hasGoals) {
        suggestions.push(
          'Como acelerar o alcance das minhas metas?',
          'Revisão das minhas metas financeiras',
          'Estratégias para economizar mais'
        );
      }
      
      if (userContext.isPremium) {
        suggestions.push(
          'Análise avançada do meu perfil de risco',
          'Estratégias de investimento personalizadas',
          'Otimização fiscal dos meus investimentos'
        );
      }
      
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions();
    } catch (error) {
      console.error('Error getting personalized suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }
}

export default new SuggestionService(); 