import OpenAI from 'openai';
import { AppError } from '../core/errors/AppError';
import { MarketService } from './marketService';
import { ChatMessage } from '../types/chat';

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY não está configurada no ambiente');
}

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  timeout: 10000,
});

// CONHECIMENTO PROFUNDO E DETALHADO DA PLATAFORMA FINNEXTHO
const FINNEXTHO_KNOWLEDGE = {
  // INFORMAÇÕES GERAIS DA EMPRESA
  company: {
    name: "Finnextho",
    description: "Plataforma financeira completa para controle de gastos, investimentos e planejamento financeiro",
    website: "finnextho.com",
    tagline: "Transforme sua relação com o dinheiro",
    founded: "2023",
    mission: "Democratizar o acesso à educação financeira e ferramentas de investimento"
  },

  // PLANOS DE ASSINATURA DETALHADOS
  subscriptionPlans: {
    free: {
      name: "Plano Gratuito",
      price: "R$ 0,00",
      features: [
        "Dashboard básico",
        "Registro de até 50 transações/mês",
        "1 meta financeira",
        "Relatórios básicos",
        "Suporte por email"
      ],
      limitations: [
        "Sem análise avançada de investimentos",
        "Sem relatórios personalizados",
        "Sem suporte prioritário",
        "Sem funcionalidades premium"
      ]
    },
    essencial: {
      name: "Plano Essencial",
      price: {
        monthly: "R$ 29,90/mês",
        annual: "R$ 299,90/ano (R$ 25/mês)"
      },
      savings: "Economia de R$ 58,80/ano no plano anual",
      features: [
        "Dashboard completo",
        "Transações ilimitadas",
        "Até 5 metas financeiras",
        "Categorização automática",
        "Relatórios intermediários",
        "Suporte por chat",
        "Exportação de dados",
        "Notificações personalizadas"
      ],
      bestFor: "Pessoas que querem controle financeiro básico"
    },
    top: {
      name: "Plano Top",
      price: {
        monthly: "R$ 69,90/mês",
        annual: "R$ 699,90/ano (R$ 58,30/mês)"
      },
      savings: "Economia de R$ 138,90/ano no plano anual",
      features: [
        "TODAS as funcionalidades do Essencial",
        "Análise avançada de investimentos",
        "Metas ilimitadas",
        "Relatórios personalizados e avançados",
        "Consultor AI premium (CFA, CFP, CNAI, CNPI)",
        "Suporte prioritário 24/7",
        "Acompanhamento de carteira de investimentos",
        "Alertas de mercado em tempo real",
        "Estratégias de investimento personalizadas",
        "Análise de risco avançada",
        "Backtesting de estratégias",
        "Integração com corretoras",
        "Webinars exclusivos",
        "Comunidade premium"
      ],
      bestFor: "Investidores e pessoas que querem controle financeiro avançado",
      aiFeatures: [
        "Consultor financeiro certificado (CFA, CFP, CNAI, CNPI)",
        "Análises personalizadas de investimentos",
        "Recomendações baseadas no perfil de risco",
        "Estratégias de diversificação",
        "Análise de mercado em tempo real",
        "Planejamento de aposentadoria",
        "Otimização de impostos",
        "Gestão de patrimônio"
      ]
    },
    enterprise: {
      name: "Plano Enterprise",
      price: "Sob consulta",
      features: [
        "TODAS as funcionalidades do Top",
        "Gestão de múltiplos usuários",
        "Relatórios corporativos",
        "API personalizada",
        "Suporte dedicado",
        "Treinamento para equipes",
        "Integração com sistemas empresariais",
        "Compliance e auditoria"
      ],
      bestFor: "Empresas e organizações"
    }
  },

  // FUNCIONALIDADES DETALHADAS
  features: {
    dashboard: {
      description: "Dashboard principal com visão completa das finanças",
      components: [
        "Saldo atual e projeções",
        "Gráficos interativos de gastos",
        "Métricas de performance",
        "Alertas e notificações",
        "Resumo de investimentos",
        "Progresso das metas"
      ]
    },
    transacoes: {
      description: "Sistema completo de registro e gestão de transações",
      capabilities: [
        "Registro manual e automático",
        "Categorização inteligente",
        "Upload de extratos",
        "Reconhecimento de padrões",
        "Histórico completo",
        "Filtros avançados",
        "Exportação de dados"
      ]
    },
    investimentos: {
      description: "Acompanhamento e análise de carteira de investimentos",
      capabilities: [
        "Registro de ativos",
        "Acompanhamento de performance",
        "Análise de alocação",
        "Cálculo de rentabilidade",
        "Comparação com benchmarks",
        "Alertas de mercado",
        "Recomendações personalizadas"
      ]
    },
    metas: {
      description: "Sistema de metas financeiras com planejamento",
      capabilities: [
        "Definição de metas",
        "Cálculo de poupança necessária",
        "Acompanhamento de progresso",
        "Alertas de prazo",
        "Projeções de atingimento",
        "Estratégias de economia"
      ]
    },
    chatbot: {
      description: "Assistente AI inteligente para dúvidas e análises",
      capabilities: [
        "Respostas instantâneas",
        "Análises personalizadas",
        "Orientação sobre a plataforma",
        "Dicas financeiras",
        "Suporte técnico",
        "Educação financeira"
      ]
    },
    relatorios: {
      description: "Relatórios avançados com insights e análises",
      types: [
        "Relatório mensal de gastos",
        "Análise de investimentos",
        "Progresso das metas",
        "Comparativo anual",
        "Projeções financeiras",
        "Análise de risco"
      ]
    }
  },

  // NAVEGAÇÃO E INTERFACE
  navigation: {
    sidebar: {
      description: "Menu lateral com acesso rápido a todas as funcionalidades",
      items: [
        "Dashboard",
        "Transações",
        "Investimentos", 
        "Metas",
        "Relatórios",
        "Configurações",
        "Suporte"
      ]
    },
    header: {
      description: "Cabeçalho com notificações, perfil e configurações",
      elements: [
        "Notificações",
        "Perfil do usuário",
        "Configurações",
        "Logout"
      ]
    },
    mobile: {
      description: "Interface responsiva otimizada para dispositivos móveis",
      features: [
        "Navegação por gestos",
        "Interface adaptativa",
        "Notificações push",
        "Sincronização em tempo real"
      ]
    }
  },

  // PROCESSOS E FLUXOS
  workflows: {
    novaTransacao: [
      "1. Clique em 'Transações' no menu lateral",
      "2. Selecione '+ Nova Transação'",
      "3. Preencha: valor, categoria, data, descrição",
      "4. Escolha o tipo (receita/despesa)",
      "5. Clique em 'Salvar'"
    ],
    novaMeta: [
      "1. Vá em 'Metas' no menu lateral",
      "2. Clique em '+ Nova Meta'",
      "3. Defina: nome, valor objetivo, prazo",
      "4. Escolha a categoria da meta",
      "5. Configure lembretes (opcional)",
      "6. Clique em 'Criar Meta'"
    ],
    novoInvestimento: [
      "1. Acesse 'Investimentos' no menu",
      "2. Clique em '+ Novo Investimento'",
      "3. Selecione o tipo de ativo",
      "4. Preencha: valor, data, corretora",
      "5. Adicione observações (opcional)",
      "6. Clique em 'Salvar'"
    ]
  },

  // DICAS E ORIENTAÇÕES
  tips: {
    transacoes: [
      "Registre suas transações diariamente para melhor controle",
      "Use categorias específicas para análises mais precisas",
      "Configure lembretes para contas recorrentes",
      "Revise suas categorizações mensalmente"
    ],
    metas: [
      "Defina metas realistas e mensuráveis",
      "Estabeleça prazos específicos",
      "Monitore o progresso regularmente",
      "Ajuste as metas conforme necessário"
    ],
    investimentos: [
      "Diversifique sua carteira",
      "Mantenha foco no longo prazo",
      "Reavalie periodicamente",
      "Considere seu perfil de risco"
    ]
  },

  // SUPORTE E AJUDA
  support: {
    channels: {
      chat: "Chat em tempo real (planos Essencial e superiores)",
      email: "suporte@finnextho.com",
      helpCenter: "Centro de ajuda com artigos e tutoriais",
      community: "Comunidade de usuários (plano Top)"
    },
    responseTimes: {
      free: "48 horas",
      essencial: "24 horas",
      top: "2 horas",
      enterprise: "Imediato"
    }
  }
};

class AIService {
  private marketService: MarketService;
  private responseCache: Map<string, any> = new Map();
  private learningCache: Map<string, number> = new Map();
  private feedbackDatabase: Map<string, any[]> = new Map();
  private userPreferences: Map<string, any> = new Map();

  constructor() {
    this.marketService = new MarketService();
  }

  private getCacheKey(systemPrompt: string, userMessage: string): string {
    return `${systemPrompt.substring(0, 50)}_${userMessage.substring(0, 50)}`;
  }

  private updateLearningCache(query: string, responseQuality: number) {
    const key = query.toLowerCase().trim();
    const currentScore = this.learningCache.get(key) || 0;
    this.learningCache.set(key, (currentScore + responseQuality) / 2);
  }

  async generateContextualResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: ChatMessage[]
  ) {
    const startTime = Date.now();
    
    try {
      const cacheKey = this.getCacheKey(systemPrompt, userMessage);
      if (this.responseCache.has(cacheKey)) {
        console.log(`[AIService] Cache hit - response time: ${Date.now() - startTime}ms`);
        return this.responseCache.get(cacheKey);
      }

      const limitedHistory = conversationHistory.slice(-2);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...limitedHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      console.log(`[AIService] Sending request to DeepSeek - ${messages.length} messages`);

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 400,
      });

      const response = {
        text: completion.choices[0]?.message?.content || '',
        analysisData: null
      };

      this.responseCache.set(cacheKey, response);
      
      if (this.responseCache.size > 30) {
        const firstKey = this.responseCache.keys().next().value;
        if (typeof firstKey === 'string') {
        this.responseCache.delete(firstKey);
        }
      }

      console.log(`[AIService] Response generated in ${Date.now() - startTime}ms`);
      return response;
    } catch (error) {
      console.error('Erro ao gerar resposta contextual:', error);
      throw new AppError(500, 'Erro ao processar sua mensagem. Por favor, tente novamente mais tarde.');
    }
  }

  async getAdvancedFinancialAnalysis(
    context: string,
    query: string,
    conversationHistory: ChatMessage[]
  ) {
    const startTime = Date.now();
    
    try {
      const cacheKey = this.getCacheKey(context, query);
      if (this.responseCache.has(cacheKey)) {
        console.log(`[AIService] Cache hit for premium analysis - response time: ${Date.now() - startTime}ms`);
        return this.responseCache.get(cacheKey);
      }

      const expertContext = {
        userData: JSON.parse(context),
        platformKnowledge: FINNEXTHO_KNOWLEDGE,
        marketContext: {
          currentMarket: 'Dados em tempo real disponíveis',
          relevantIndicators: ['S&P 500', 'IBOVESPA', 'CDI', 'IPCA', 'Dólar', 'Euro']
        },
        certifications: ['CFA', 'CFP', 'CNAI', 'CNPI'],
        expertise: [
          'Análise fundamentalista e técnica',
          'Planejamento financeiro pessoal e corporativo',
          'Gestão de risco e compliance',
          'Mercado imobiliário e investimentos alternativos',
          'Educação financeira e treinamento'
        ]
      };

      const limitedHistory = conversationHistory.slice(-1);

      const premiumSystemPrompt = `
        Você é o Finn, consultor financeiro premium do Finnextho com certificações CFA, CFP, CNAI e CNPI.
        
        PERFIL:
        - Personalidade: Profissional, experiente e confiável
        - Tom: Educativo, mas acessível
        - Objetivo: Fornecer análises financeiras avançadas e orientação estratégica
        - Estilo: Respostas detalhadas com insights práticos
        
        CERTIFICAÇÕES E EXPERTISE:
        - CFA (Chartered Financial Analyst): Análise de investimentos e gestão de portfólio
        - CFP (Certified Financial Planner): Planejamento financeiro pessoal
        - CNAI (Certificação Nacional de Analista de Investimentos): Análise técnica e fundamentalista
        - CNPI (Certificação Nacional de Profissional de Investimentos): Gestão de risco e compliance
        
        CONHECIMENTO PROFUNDO DA PLATAFORMA FINNEXTHO:
        ${JSON.stringify(FINNEXTHO_KNOWLEDGE, null, 2)}
        
        REGRAS PARA USUÁRIOS PREMIUM:
        1. Forneça análises detalhadas e estratégicas
        2. Use dados específicos da plataforma quando relevante
        3. Ofereça insights baseados no perfil do usuário
        4. Sugira estratégias de otimização
        5. Explique conceitos financeiros de forma clara
        6. Mantenha tom profissional mas acessível
        7. Inclua recomendações práticas e acionáveis
        
        CONTEXTO DO USUÁRIO:
        - Nome: ${expertContext.userData.name || 'Cliente Premium'}
        - Plano: ${expertContext.userData.subscriptionPlan || 'Top'}
        - Status: ${expertContext.userData.subscriptionStatus || 'Ativo'}
        - Dados disponíveis: ${expertContext.userData.hasTransactions ? 'Transações' : 'Sem transações'}, ${expertContext.userData.hasInvestments ? 'Investimentos' : 'Sem investimentos'}, ${expertContext.userData.hasGoals ? 'Metas' : 'Sem metas'}
        
        Responda como um consultor financeiro certificado, fornecendo análises profundas e orientação estratégica personalizada.
      `;

      const messages = [
        { role: 'system', content: premiumSystemPrompt },
        ...limitedHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: query }
      ];

      console.log(`[AIService] Sending expert request to DeepSeek - ${messages.length} messages`);

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages as any,
        temperature: 0.6,
        max_tokens: 800,
      });

      const response = {
        analysisText: completion.choices[0]?.message?.content || '',
        analysisData: {
          expertise: 'CFA, CFP, CNAI, CNPI',
          responseTime: Date.now() - startTime,
          confidence: 0.95,
          analysisType: 'premium'
        }
      };

      this.responseCache.set(cacheKey, response);
      this.updateLearningCache(query, 0.9);
      
      console.log(`[AIService] Expert analysis generated in ${Date.now() - startTime}ms`);
      return response;
    } catch (error) {
      console.error('Erro ao gerar análise financeira:', error);
      throw new AppError(500, 'Erro ao processar sua análise. Por favor, tente novamente mais tarde.');
    }
  }

  async getPlatformGuidance(query: string, userContext: any) {
    const startTime = Date.now();
    
    try {
      const platformPrompt = `
        Você é um especialista em UX/UI e treinamento da plataforma Finnextho.
        
        CONHECIMENTO PROFUNDO DA PLATAFORMA:
        ${JSON.stringify(FINNEXTHO_KNOWLEDGE, null, 2)}
        
        OBJETIVO: Ajudar usuários a navegar e usar eficientemente a plataforma Finnextho.
        
        DIRETRIZES:
        1. Forneça instruções passo-a-passo claras e específicas
        2. Explique onde encontrar cada funcionalidade na interface
        3. Dê dicas de produtividade e melhores práticas
        4. Sugira fluxos de trabalho otimizados
        5. Responda de forma didática e encorajadora
        6. Use exemplos práticos e específicos da plataforma
        7. Mencione diferenças entre planos quando relevante
        
        CONTEXTO DO USUÁRIO: ${JSON.stringify(userContext)}
        
        Pergunta do usuário: ${query}
        
        Responda de forma clara, prática e específica sobre como usar a plataforma Finnextho.
      `;

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: platformPrompt }, { role: 'user', content: query }],
        temperature: 0.7,
        max_tokens: 600,
      });

      return {
        guidanceText: completion.choices[0]?.message?.content || '',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Erro ao gerar orientação da plataforma:', error);
      throw new AppError(500, 'Erro ao processar orientação da plataforma.');
    }
  }

  async getMarketOverview() {
    return {
      sp500: 4500,
      ibovespa: 120000,
      cdi: 12.5,
      ipca: 4.2,
      dolar: 5.15,
      euro: 5.60
    };
  }

  async generateFollowUpQuestions(
    originalQuery: string,
    aiResponse: string
  ): Promise<string[]> {
    try {
      const contextAwareQuestions = [
        "Como posso aplicar essa análise na minha carteira atual?",
        "Quais indicadores devo monitorar para acompanhar essa estratégia?",
        "Como posso usar as ferramentas da plataforma para implementar essas recomendações?",
        "Qual seria o próximo passo para otimizar minha situação financeira?",
        "Posso ver um exemplo prático de como isso funciona na plataforma?",
        "Quais funcionalidades do meu plano posso usar para isso?",
        "Como isso se relaciona com minhas metas financeiras?",
        "Que relatórios da plataforma podem me ajudar com isso?"
      ];
      
      const relevantQuestions = contextAwareQuestions.slice(0, 3);
      return relevantQuestions;
    } catch (error) {
      console.error('Erro ao gerar perguntas de acompanhamento:', error);
      return [];
    }
  }

  private parseAIResponse(responseContent: string | undefined): any {
    if (!responseContent) {
      throw new AppError(500, 'Resposta da IA vazia');
    }

    try {
      return JSON.parse(responseContent);
    } catch (error) {
      return { text: responseContent.trim() };
    }
  }

  // SISTEMA DE FEEDBACK E APRENDIZADO
  async saveUserFeedback(
    userId: string,
    messageId: string,
    feedback: {
      rating: number; // 1-5 estrelas
      helpful: boolean;
      comment?: string;
      category: 'accuracy' | 'helpfulness' | 'clarity' | 'relevance';
      context: string;
    }
  ) {
    try {
      const userFeedback = {
        userId,
        messageId,
        timestamp: new Date(),
        ...feedback
      };

      // Salvar feedback no cache local
      if (!this.feedbackDatabase.has(userId)) {
        this.feedbackDatabase.set(userId, []);
      }
      this.feedbackDatabase.get(userId)!.push(userFeedback);

      // Atualizar preferências do usuário baseado no feedback
      await this.updateUserPreferences(userId, feedback);

      // Ajustar cache de aprendizado baseado no feedback
      this.adjustLearningCache(feedback);

      console.log(`[AIService] Feedback salvo para usuário ${userId}: ${feedback.rating}/5`);
      
      return { success: true, message: 'Feedback registrado com sucesso!' };
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      throw new AppError(500, 'Erro ao salvar feedback');
    }
  }

  private async updateUserPreferences(userId: string, feedback: any) {
    try {
      const currentPrefs = this.userPreferences.get(userId) || {
        preferredStyle: 'balanced',
        detailLevel: 'medium',
        technicalLevel: 'intermediate',
        responseLength: 'medium',
        topics: [],
        feedbackHistory: []
      };

      // Ajustar preferências baseado no feedback
      if (feedback.rating >= 4) {
        // Usuário gostou - manter estilo similar
        currentPrefs.feedbackHistory.push({
          type: 'positive',
          category: feedback.category,
          timestamp: new Date()
        });
      } else if (feedback.rating <= 2) {
        // Usuário não gostou - ajustar estilo
        currentPrefs.feedbackHistory.push({
          type: 'negative',
          category: feedback.category,
          timestamp: new Date()
        });

        // Ajustar baseado no comentário
        if (feedback.comment) {
          const comment = feedback.comment.toLowerCase();
          if (comment.includes('muito técnico') || comment.includes('complexo')) {
            currentPrefs.technicalLevel = 'basic';
          }
          if (comment.includes('muito longo') || comment.includes('verboso')) {
            currentPrefs.responseLength = 'short';
          }
          if (comment.includes('muito curto') || comment.includes('superficial')) {
            currentPrefs.responseLength = 'detailed';
          }
        }
      }

      this.userPreferences.set(userId, currentPrefs);
      console.log(`[AIService] Preferências atualizadas para usuário ${userId}`);
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
    }
  }

  private adjustLearningCache(feedback: any) {
    try {
      // Ajustar qualidade das respostas baseado no feedback
      const qualityAdjustment = feedback.rating >= 4 ? 0.1 : -0.1;
      
      // Aplicar ajuste ao cache de aprendizado
      this.learningCache.forEach((score, key) => {
        const newScore = Math.max(0, Math.min(1, score + qualityAdjustment));
        this.learningCache.set(key, newScore);
      });

      console.log(`[AIService] Cache de aprendizado ajustado baseado no feedback`);
    } catch (error) {
      console.error('Erro ao ajustar cache de aprendizado:', error);
    }
  }

  async getUserFeedbackAnalytics(userId: string) {
    try {
      const userFeedback = this.feedbackDatabase.get(userId) || [];
      const preferences = this.userPreferences.get(userId);

      const analytics = {
        totalFeedback: userFeedback.length,
        averageRating: userFeedback.length > 0 
          ? userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length 
          : 0,
        helpfulnessRate: userFeedback.length > 0
          ? (userFeedback.filter(f => f.helpful).length / userFeedback.length) * 100
          : 0,
        categoryBreakdown: userFeedback.reduce((acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        }, {} as any),
        preferences: preferences,
        recentFeedback: userFeedback.slice(-5)
      };

      return analytics;
    } catch (error) {
      console.error('Erro ao gerar analytics de feedback:', error);
      throw new AppError(500, 'Erro ao gerar analytics');
    }
  }

  async getPersonalizedResponse(
    userId: string,
    query: string,
    conversationHistory: ChatMessage[]
  ) {
    try {
      const preferences = this.userPreferences.get(userId);
      
      // Personalizar prompt baseado nas preferências do usuário
      let personalizedPrompt = '';
      
      if (preferences) {
        personalizedPrompt = `
          PREFERÊNCIAS DO USUÁRIO:
          - Estilo preferido: ${preferences.preferredStyle}
          - Nível de detalhe: ${preferences.detailLevel}
          - Nível técnico: ${preferences.technicalLevel}
          - Tamanho da resposta: ${preferences.responseLength}
          
          HISTÓRICO DE FEEDBACK:
          - Avaliação média: ${preferences.feedbackHistory?.filter(f => f.type === 'positive').length || 0} positivas
          - Problemas frequentes: ${preferences.feedbackHistory?.filter(f => f.type === 'negative').map(f => f.category).join(', ') || 'Nenhum'}
          
          Ajuste sua resposta baseado nessas preferências para melhorar a satisfação do usuário.
        `;
      }

      // Usar o prompt personalizado no contexto
      const systemPrompt = `
        ${personalizedPrompt}
        
        Você é o Finn, assistente inteligente do Finnextho.
        
        CONHECIMENTO PROFUNDO DA PLATAFORMA:
        ${JSON.stringify(FINNEXTHO_KNOWLEDGE, null, 2)}
        
        Responda de forma personalizada e útil, considerando o histórico de feedback do usuário.
      `;

      return await this.generateContextualResponse(
        systemPrompt,
        query,
        conversationHistory
      );
    } catch (error) {
      console.error('Erro ao gerar resposta personalizada:', error);
      throw new AppError(500, 'Erro ao gerar resposta personalizada');
    }
  }
}

export default AIService;
