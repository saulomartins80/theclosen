//SentimentService.ts
import AIService from './aiService';
import cacheService from './cacheService';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  topics: string[];
  urgency: 'low' | 'medium' | 'high';
  userMood: string;
  suggestions: string[];
}

export class SentimentService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  // Analisar sentimento de uma mensagem
  async analyzeSentiment(message: string, userId?: string): Promise<SentimentAnalysis> {
    try {
      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(message);
      const cached = await cacheService.getCachedSentimentAnalysis(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Análise básica de sentimento
      const basicAnalysis = this.performBasicAnalysis(message);
      
      // Análise avançada com IA (se disponível)
      const advancedAnalysis = await this.performAdvancedAnalysis(message);
      
      // Combinar análises
      const combinedAnalysis = this.combineAnalyses(basicAnalysis, advancedAnalysis);
      
      // Cache do resultado
      await cacheService.cacheSentimentAnalysis(cacheKey, combinedAnalysis);
      
      return combinedAnalysis;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.getDefaultSentiment();
    }
  }

  // Análise básica baseada em palavras-chave
  private performBasicAnalysis(message: string): Partial<SentimentAnalysis> {
    const lowerMessage = message.toLowerCase();
    let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
    let confidence = 0.5;
    let urgency: 'low' | 'medium' | 'high' = 'low';

    // Palavras positivas
    const positiveWords = [
      'ótimo', 'excelente', 'maravilhoso', 'fantástico', 'incrível', 'perfeito',
      'gosto', 'adoro', 'funciona', 'bom', 'bem', 'sucesso', 'consegui',
      'obrigado', 'valeu', 'legal', 'show', 'top', 'demais'
    ];

    // Palavras negativas
    const negativeWords = [
      'ruim', 'péssimo', 'horrível', 'terrível', 'não funciona', 'erro',
      'problema', 'difícil', 'complicado', 'frustrado', 'irritado', 'chateado',
      'não gosto', 'odeio', 'detesto', 'falha', 'bug', 'quebrado'
    ];

    // Palavras de urgência
    const urgentWords = [
      'urgente', 'agora', 'imediatamente', 'rápido', 'emergência', 'crítico',
      'problema grave', 'não consigo', 'preciso de ajuda', 'socorro'
    ];

    // Contar palavras
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    const urgentCount = urgentWords.filter(word => lowerMessage.includes(word)).length;

    // Determinar sentimento
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeCount * 0.1));
    } else if (positiveCount === negativeCount && positiveCount > 0) {
      sentiment = 'mixed';
      confidence = 0.7;
    }

    // Determinar urgência
    if (urgentCount > 0) {
      urgency = urgentCount > 2 ? 'high' : 'medium';
    }

    return {
      sentiment,
      confidence,
      urgency,
      emotions: this.estimateEmotions(lowerMessage),
      topics: this.extractTopics(lowerMessage)
    };
  }

  // Análise avançada com IA
  private async performAdvancedAnalysis(message: string): Promise<Partial<SentimentAnalysis>> {
    try {
      const prompt = `
        Analise o sentimento da seguinte mensagem e retorne um JSON com:
        - sentiment: "positive", "negative", "neutral", ou "mixed"
        - confidence: número entre 0 e 1
        - emotions: objeto com scores de 0 a 1 para: joy, sadness, anger, fear, surprise, disgust
        - userMood: descrição do humor do usuário
        - suggestions: array com 2-3 sugestões para melhorar a experiência

        Mensagem: "${message}"

        Retorne apenas o JSON válido.
      `;

      const response = await this.aiService.generateContextualResponse(
        'Você é um analisador de sentimentos especializado. Analise a mensagem fornecida e retorne apenas um JSON válido com a análise.',
        prompt,
        []
      );
      
      try {
        const analysis = JSON.parse(response);
        return {
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          emotions: analysis.emotions,
          userMood: analysis.userMood,
          suggestions: analysis.suggestions
        };
      } catch (parseError) {
        console.error('Error parsing AI sentiment response:', parseError);
        return {};
      }
    } catch (error) {
      console.error('Error in advanced sentiment analysis:', error);
      return {};
    }
  }

  // Combinar análises básica e avançada
  private combineAnalyses(basic: Partial<SentimentAnalysis>, advanced: Partial<SentimentAnalysis>): SentimentAnalysis {
    return {
      sentiment: advanced.sentiment || basic.sentiment || 'neutral',
      confidence: advanced.confidence || basic.confidence || 0.5,
      emotions: advanced.emotions || basic.emotions || this.getDefaultEmotions(),
      topics: basic.topics || [],
      urgency: basic.urgency || 'low',
      userMood: advanced.userMood || this.getDefaultUserMood(),
      suggestions: advanced.suggestions || this.getDefaultSuggestions()
    };
  }

  // Estimar emoções baseadas em palavras-chave
  private estimateEmotions(message: string): SentimentAnalysis['emotions'] {
    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0
    };

    // Palavras de alegria
    const joyWords = ['feliz', 'alegre', 'contente', 'satisfeito', 'animado', 'empolgado'];
    emotions.joy = joyWords.filter(word => message.includes(word)).length * 0.2;

    // Palavras de tristeza
    const sadnessWords = ['triste', 'chateado', 'decepcionado', 'frustrado', 'desanimado'];
    emotions.sadness = sadnessWords.filter(word => message.includes(word)).length * 0.2;

    // Palavras de raiva
    const angerWords = ['irritado', 'bravo', 'furioso', 'nervoso', 'estressado'];
    emotions.anger = angerWords.filter(word => message.includes(word)).length * 0.2;

    // Palavras de medo
    const fearWords = ['preocupado', 'ansioso', 'nervoso', 'assustado', 'inseguro'];
    emotions.fear = fearWords.filter(word => message.includes(word)).length * 0.2;

    // Palavras de surpresa
    const surpriseWords = ['surpreso', 'impressionado', 'incrível', 'nossa', 'uau'];
    emotions.surprise = surpriseWords.filter(word => message.includes(word)).length * 0.2;

    // Palavras de nojo
    const disgustWords = ['nojento', 'repugnante', 'horrível', 'terrível'];
    emotions.disgust = disgustWords.filter(word => message.includes(word)).length * 0.2;

    // Normalizar valores
    Object.keys(emotions).forEach(key => {
      emotions[key as keyof typeof emotions] = Math.min(1, emotions[key as keyof typeof emotions]);
    });

    return emotions;
  }

  // Extrair tópicos da mensagem
  private extractTopics(message: string): string[] {
    const topics = new Set<string>();
    
    if (message.includes('investimento') || message.includes('carteira')) {
      topics.add('investimentos');
    }
    if (message.includes('meta') || message.includes('objetivo')) {
      topics.add('metas');
    }
    if (message.includes('transação') || message.includes('gasto')) {
      topics.add('transacoes');
    }
    if (message.includes('relatório') || message.includes('análise')) {
      topics.add('relatorios');
    }
    if (message.includes('ajuda') || message.includes('suporte')) {
      topics.add('suporte');
    }
    if (message.includes('plataforma') || message.includes('app')) {
      topics.add('plataforma');
    }

    return Array.from(topics);
  }

  // Gerar cache key
  private generateCacheKey(message: string): string {
    return message.toLowerCase().substring(0, 100).replace(/[^a-z0-9]/g, '');
  }

  // Sentimento padrão
  private getDefaultSentiment(): SentimentAnalysis {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      emotions: this.getDefaultEmotions(),
      topics: [],
      urgency: 'low',
      userMood: 'Neutro',
      suggestions: this.getDefaultSuggestions()
    };
  }

  // Emoções padrão
  private getDefaultEmotions(): SentimentAnalysis['emotions'] {
    return {
      joy: 0.1,
      sadness: 0.1,
      anger: 0.1,
      fear: 0.1,
      surprise: 0.1,
      disgust: 0.1
    };
  }

  // Humor padrão
  private getDefaultUserMood(): string {
    return 'Neutro';
  }

  // Sugestões padrão
  private getDefaultSuggestions(): string[] {
    return [
      'Como posso ajudá-lo melhor?',
      'Tem alguma dúvida específica?',
      'Posso explicar melhor algum conceito?'
    ];
  }

  // Adaptar resposta baseada no sentimento
  adaptResponseToSentiment(response: string, sentiment: SentimentAnalysis): string {
    let adaptedResponse = response;

    // Adicionar empatia para sentimentos negativos
    if (sentiment.sentiment === 'negative') {
      if (sentiment.urgency === 'high') {
        adaptedResponse = `Entendo sua preocupação e vou ajudá-lo imediatamente. ${response}`;
      } else {
        adaptedResponse = `Peço desculpas pela frustração. Vou fazer o possível para ajudá-lo. ${response}`;
      }
    }

    // Adicionar entusiasmo para sentimentos positivos
    if (sentiment.sentiment === 'positive') {
      adaptedResponse = `Que ótimo! Fico feliz em saber que está satisfeito. ${response}`;
    }

    // Adicionar sugestões personalizadas
    if (sentiment.suggestions && sentiment.suggestions.length > 0) {
      adaptedResponse += `\n\n💡 Dica: ${sentiment.suggestions[0]}`;
    }

    return adaptedResponse;
  }

  // Analisar sentimento de uma conversa completa
  async analyzeConversationSentiment(messages: any[]): Promise<SentimentAnalysis> {
    try {
      const userMessages = messages.filter(m => m.sender === 'user');
      const sentiments = await Promise.all(
        userMessages.map(msg => this.analyzeSentiment(msg.content))
      );

      // Calcular sentimento médio
      const avgSentiment = this.calculateAverageSentiment(sentiments);
      
      return avgSentiment;
    } catch (error) {
      console.error('Error analyzing conversation sentiment:', error);
      return this.getDefaultSentiment();
    }
  }

  // Calcular sentimento médio
  private calculateAverageSentiment(sentiments: SentimentAnalysis[]): SentimentAnalysis {
    if (sentiments.length === 0) {
      return this.getDefaultSentiment();
    }

    const avgEmotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0
    };

    sentiments.forEach(sentiment => {
      Object.keys(avgEmotions).forEach(key => {
        avgEmotions[key as keyof typeof avgEmotions] += sentiment.emotions[key as keyof typeof sentiment.emotions];
      });
    });

    Object.keys(avgEmotions).forEach(key => {
      avgEmotions[key as keyof typeof avgEmotions] /= sentiments.length;
    });

    // Determinar sentimento dominante
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0
    };

    sentiments.forEach(s => sentimentCounts[s.sentiment]++);

    const dominantSentiment = Object.entries(sentimentCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as SentimentAnalysis['sentiment'];

    return {
      sentiment: dominantSentiment,
      confidence: sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length,
      emotions: avgEmotions,
      topics: [...new Set(sentiments.flatMap(s => s.topics))],
      urgency: sentiments.some(s => s.urgency === 'high') ? 'high' : 
               sentiments.some(s => s.urgency === 'medium') ? 'medium' : 'low',
      userMood: this.getConversationMood(sentiments),
      suggestions: this.getConversationSuggestions(sentiments)
    };
  }

  // Determinar humor da conversa
  private getConversationMood(sentiments: SentimentAnalysis[]): string {
    const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;
    
    if (avgConfidence > 0.7) {
      return 'Muito expressivo';
    } else if (avgConfidence > 0.5) {
      return 'Moderadamente expressivo';
    } else {
      return 'Pouco expressivo';
    }
  }

  // Sugestões baseadas na conversa
  private getConversationSuggestions(sentiments: SentimentAnalysis[]): string[] {
    const suggestions: string[] = [];
    
    const hasNegative = sentiments.some(s => s.sentiment === 'negative');
    const hasHighUrgency = sentiments.some(s => s.urgency === 'high');
    
    if (hasNegative && hasHighUrgency) {
      suggestions.push('Vou priorizar sua solicitação e responder o mais rápido possível.');
    }
    
    if (hasNegative) {
      suggestions.push('Se precisar de mais ajuda, estou aqui para você.');
    }
    
    return suggestions;
  }
}

export default new SentimentService(); 