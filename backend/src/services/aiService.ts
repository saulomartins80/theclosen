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

// ===== SISTEMA DE PERSONALIDADE APRIMORADO =====

const PERSONALITY_TRAITS = `
# TRAÇOS DE PERSONALIDADE DO FINN
1. Estilo Conversacional:
   - Calmo e paciente, como um consultor experiente
   - Empático - reconhece sentimentos e situações financeiras delicadas
   - Motivacional - incentiva boas práticas financeiras
   - Humor sutil e apropriado (sem piadas forçadas)
   - Adaptação cultural brasileira com regionalismos

2. Padrões de Fala:
   - Usa contrações ("tá" em vez de "está", "pra" em vez de "para")
   - Intercala perguntas retóricas ("Sabe por que isso é importante?")
   - Usa exemplos pessoais ("Meu outro cliente teve uma situação parecida...")
   - Expressões positivas ("Boa escolha!", "Excelente pergunta!")
   - Gírias brasileiras apropriadas ("beleza", "valeu", "tranquilo")

3. Adaptação ao Usuário:
   - Nível técnico: básico/intermediário/avançado
   - Tom: mais formal com empresários, mais casual com jovens
   - Referências culturais brasileiras
   - Adaptação regional (SP, RJ, MG, RS, etc.)
   - Detecção de contexto (trabalho, lazer, família)

4. Sistema de Humor Contextual:
   - Humor leve em momentos apropriados
   - Referências a situações financeiras comuns
   - Piadas sobre "carteira vazia" vs "carteira cheia"
   - Analogias engraçadas sobre investimentos
`;

// ===== SISTEMA DE DETECÇÃO CULTURAL BRASILEIRA =====

class BrazilianCulturalContext {
  private regionalExpressions = {
    'sp': ['mano', 'beleza', 'tranquilo', 'valeu'],
    'rj': ['cara', 'massa', 'legal', 'show'],
    'mg': ['trem', 'uai', 'sô', 'véio'],
    'rs': ['bah', 'tchê', 'guri', 'guria'],
    'pr': ['véio', 'mano', 'tranquilo'],
    'sc': ['bah', 'tchê', 'guri'],
    'ba': ['mano', 'beleza', 'tranquilo'],
    'pe': ['cara', 'massa', 'legal'],
    'ce': ['cara', 'massa', 'legal'],
    'go': ['mano', 'beleza', 'tranquilo']
  };

  private culturalReferences = {
    'carnaval': ['bloco', 'fantasia', 'samba', 'festa'],
    'futebol': ['gol', 'time', 'jogo', 'campeonato'],
    'comida': ['feijoada', 'churrasco', 'pizza', 'hambúrguer'],
    'trabalho': ['escritório', 'reunião', 'chefe', 'projeto'],
    'familia': ['filho', 'filha', 'esposa', 'marido', 'pais'],
    'viagem': ['praia', 'montanha', 'cidade', 'hotel']
  };

  detectRegionalContext(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    for (const [region, expressions] of Object.entries(this.regionalExpressions)) {
      for (const expression of expressions) {
        if (lowerMessage.includes(expression)) {
          return region;
        }
      }
    }
    
    return 'default';
  }

  detectCulturalContext(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const detectedContexts: string[] = [];
    
    for (const [context, keywords] of Object.entries(this.culturalReferences)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          detectedContexts.push(context);
          break;
        }
      }
    }
    
    return detectedContexts;
  }

  getRegionalExpression(region: string): string {
    const expressions = this.regionalExpressions[region] || this.regionalExpressions['default'];
    return expressions[Math.floor(Math.random() * expressions.length)];
  }

  getCulturalResponse(contexts: string[]): string {
    const responses = {
      'carnaval': '🎭 Ah, época de festa! Mas lembra que o dinheiro também precisa dançar no seu bolso!',
      'futebol': '⚽ Futebol é paixão, mas investimento é estratégia! Que tal fazer um "gol de placa" nas suas finanças?',
      'comida': '🍽️ Comida boa é tudo de bom! Mas que tal "saborear" também os lucros dos seus investimentos?',
      'trabalho': '💼 Trabalho duro merece recompensa! Que tal investir parte do seu suor em algo que trabalhe por você?',
      'familia': '👨‍👩‍👧‍👦 Família é tudo! E que tal garantir um futuro financeiro tranquilo para eles?',
      'viagem': '✈️ Viagem é sempre uma boa ideia! Mas que tal planejar uma viagem para o futuro com investimentos?'
    };

    if (contexts.length > 0) {
      const context = contexts[0];
      return responses[context] || '';
    }
    
    return '';
  }
}

// ===== SISTEMA DE HUMOR CONTEXTUAL =====

class HumorSystem {
  private humorLevels = {
    'low': 0.2,    // Pouco humor
    'medium': 0.5, // Humor moderado
    'high': 0.8    // Mais humor
  };

  private financialJokes = {
    'carteira_vazia': [
      '😅 Carteira vazia é igual a geladeira vazia - sempre dá uma tristeza! Mas calma, vamos resolver isso!',
      '💸 Carteira mais vazia que o céu de São Paulo no inverno! Mas não desanima, vamos encher ela!',
      '🎭 Carteira vazia é como teatro vazio - sem graça! Mas a gente vai dar um show nas suas finanças!'
    ],
    'investimento': [
      '📈 Investir é como plantar feijão - você planta hoje e colhe amanhã! (ou depois de amanhã, ou... 😅)',
      '🌱 Investimento é igual a namoro - tem que ter paciência e não desistir no primeiro problema!',
      '🎯 Investir é como jogar futebol - às vezes você faz gol, às vezes toma gol, mas o importante é continuar jogando!'
    ],
    'economia': [
      '💰 Economizar é como dieta - todo mundo sabe que deve fazer, mas nem todo mundo consegue! 😅',
      '🏦 Economia é igual a academia - no começo dói, mas depois você fica viciado nos resultados!',
      '💪 Economizar é como parar de fumar - difícil no começo, mas depois você se pergunta como vivia sem!'
    ]
  };

  shouldUseHumor(stressLevel: number, userContext: any): boolean {
    // Usar humor apenas se o usuário não estiver muito estressado
    if (stressLevel > 7) return false;
    
    // Usar humor com mais frequência para usuários casuais
    if (userContext?.subscriptionPlan === 'Gratuito') return Math.random() < 0.3;
    if (userContext?.subscriptionPlan === 'Essencial') return Math.random() < 0.2;
    if (userContext?.subscriptionPlan === 'Top') return Math.random() < 0.15;
    
    return Math.random() < 0.1; // Menos humor para Enterprise
  }

  getHumorResponse(context: string): string {
    const jokes = this.humorLevels[context] || this.humorLevels['low'];
    const availableJokes = this.financialJokes[context] || this.financialJokes['investimento'];
    
    if (Math.random() < jokes) {
      return availableJokes[Math.floor(Math.random() * availableJokes.length)];
    }
    
    return '';
  }

  detectHumorContext(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('carteira') && (lowerMessage.includes('vazia') || lowerMessage.includes('sem dinheiro'))) {
      return 'carteira_vazia';
    }
    
    if (lowerMessage.includes('investimento') || lowerMessage.includes('investir')) {
      return 'investimento';
    }
    
    if (lowerMessage.includes('economia') || lowerMessage.includes('economizar') || lowerMessage.includes('poupar')) {
      return 'economia';
    }
    
    return 'default';
  }
}

// ===== SISTEMA DE MEMÓRIA DE RELACIONAMENTO =====

class RelationshipMemory {
  private userRelationships: Map<string, {
    interactionCount: number;
    firstInteraction: Date;
    lastInteraction: Date;
    favoriteTopics: string[];
    communicationStyle: 'formal' | 'casual' | 'mixed';
    trustLevel: number; // 0-10
    sharedJokes: string[];
    personalStories: Array<{ date: Date; story: string; category: string }>;
    milestones: Array<{ date: Date; milestone: string; shared: boolean }>;
  }> = new Map();

  updateRelationship(userId: string, message: string, response: string) {
    const relationship = this.getRelationship(userId);
    
    relationship.interactionCount++;
    relationship.lastInteraction = new Date();
    
    // Detectar estilo de comunicação
    const formalWords = ['senhor', 'senhora', 'por favor', 'obrigado', 'agradeço'];
    const casualWords = ['beleza', 'valeu', 'tranquilo', 'mano', 'cara'];
    
    const isFormal = formalWords.some(word => message.toLowerCase().includes(word));
    const isCasual = casualWords.some(word => message.toLowerCase().includes(word));
    
    if (isFormal && !isCasual) {
      relationship.communicationStyle = 'formal';
    } else if (isCasual && !isFormal) {
      relationship.communicationStyle = 'casual';
    } else {
      relationship.communicationStyle = 'mixed';
    }
    
    // Detectar tópicos favoritos
    const topics = this.extractTopics(message);
    topics.forEach(topic => {
      if (!relationship.favoriteTopics.includes(topic)) {
        relationship.favoriteTopics.push(topic);
      }
    });
    
    // Manter apenas os 5 tópicos mais frequentes
    relationship.favoriteTopics = relationship.favoriteTopics.slice(-5);
    
    // Aumentar confiança com interações positivas
    if (response.includes('🎉') || response.includes('parabéns') || response.includes('excelente')) {
      relationship.trustLevel = Math.min(10, relationship.trustLevel + 0.5);
    }
    
    this.userRelationships.set(userId, relationship);
  }

  getRelationship(userId: string) {
    return this.userRelationships.get(userId) || {
      interactionCount: 0,
      firstInteraction: new Date(),
      lastInteraction: new Date(),
      favoriteTopics: [],
      communicationStyle: 'mixed' as const,
      trustLevel: 5,
      sharedJokes: [],
      personalStories: [],
      milestones: []
    };
  }

  addPersonalStory(userId: string, story: string, category: string) {
    const relationship = this.getRelationship(userId);
    relationship.personalStories.push({
      date: new Date(),
      story,
      category
    });
    this.userRelationships.set(userId, relationship);
  }

  addSharedMilestone(userId: string, milestone: string) {
    const relationship = this.getRelationship(userId);
    relationship.milestones.push({
      date: new Date(),
      milestone,
      shared: true
    });
    this.userRelationships.set(userId, relationship);
  }

  getPersonalizedGreeting(userId: string): string {
    const relationship = this.getRelationship(userId);
    
    if (relationship.interactionCount === 1) {
      return 'Olá! Prazer em conhecer você! 👋';
    }
    
    if (relationship.interactionCount < 5) {
      return 'Oi! Que bom te ver novamente! 😊';
    }
    
    if (relationship.interactionCount < 20) {
      return 'E aí! Como vai? 😄';
    }
    
    // Usuário frequente
    const timeSinceLast = Date.now() - relationship.lastInteraction.getTime();
    const daysSinceLast = timeSinceLast / (1000 * 60 * 60 * 24);
    
    if (daysSinceLast > 7) {
      return 'Oi! Fazia tempo que não conversávamos! Que bom te ver de volta! 🎉';
    }
    
    return 'E aí, parceiro! Tudo bem? 😎';
  }

  private extractTopics(text: string): string[] {
    const topics = ['investimentos', 'economia', 'metas', 'transações', 'dívidas', 'poupança'];
    const detectedTopics: string[] = [];
    
    topics.forEach(topic => {
      if (text.toLowerCase().includes(topic)) {
        detectedTopics.push(topic);
      }
    });
    
    return detectedTopics;
  }
}

// ===== SISTEMA DE MEMÓRIA EMOCIONAL =====

class EmotionalMemory {
  private userSentiments: Map<string, {
    lastEmotions: string[];
    stressLevel: number; // 0-10
    financialConcerns: string[];
    moodHistory: Array<{ date: Date; mood: string; intensity: number }>;
  }> = new Map();

  updateEmotionalContext(userId: string, message: string) {
    const context = this.getContext(userId);
    
    // Análise simples de sentimento
    if (message.match(/preocupado|apertado|difícil|apertado|problema|dívida|endividado/i)) {
      context.stressLevel = Math.min(10, context.stressLevel + 2);
      context.lastEmotions.push('preocupação');
      context.financialConcerns.push('dificuldade_financeira');
    }
    
    if (message.match(/feliz|consegui|alegre|ótimo|sucesso|meta|conquista/i)) {
      context.stressLevel = Math.max(0, context.stressLevel - 1);
      context.lastEmotions.push('felicidade');
    }

    if (message.match(/confuso|não entendo|dúvida|incerto/i)) {
      context.stressLevel = Math.min(10, context.stressLevel + 1);
      context.lastEmotions.push('confusão');
    }

    if (message.match(/ansioso|nervoso|estressado|pressão/i)) {
      context.stressLevel = Math.min(10, context.stressLevel + 3);
      context.lastEmotions.push('ansiedade');
    }

    // Manter apenas as últimas 5 emoções
    context.lastEmotions = context.lastEmotions.slice(-5);
    context.financialConcerns = [...new Set(context.financialConcerns)].slice(-3);

    // Adicionar ao histórico de humor
    const currentMood = this.detectMood(message);
    context.moodHistory.push({
      date: new Date(),
      mood: currentMood.mood,
      intensity: currentMood.intensity
    });

    // Manter apenas os últimos 10 registros de humor
    context.moodHistory = context.moodHistory.slice(-10);

    this.userSentiments.set(userId, context);
  }

  getContext(userId: string) {
    return this.userSentiments.get(userId) || {
      lastEmotions: [],
      stressLevel: 3,
      financialConcerns: [],
      moodHistory: []
    };
  }

  private detectMood(message: string): { mood: string; intensity: number } {
    const positiveWords = ['feliz', 'ótimo', 'bom', 'sucesso', 'consegui', 'alegre', 'satisfeito'];
    const negativeWords = ['triste', 'ruim', 'problema', 'difícil', 'preocupado', 'ansioso'];
    const neutralWords = ['ok', 'normal', 'tranquilo', 'calmo'];

    const lowerMessage = message.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) negativeCount++;
    });

    neutralWords.forEach(word => {
      if (lowerMessage.includes(word)) neutralCount++;
    });

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      return { mood: 'positivo', intensity: Math.min(positiveCount, 5) };
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      return { mood: 'negativo', intensity: Math.min(negativeCount, 5) };
    } else {
      return { mood: 'neutro', intensity: 3 };
    }
  }

  getStressLevel(userId: string): number {
    return this.getContext(userId).stressLevel;
  }

  getRecentEmotions(userId: string): string[] {
    return this.getContext(userId).lastEmotions;
  }
}

// ===== SISTEMA DE MEMÓRIA DE LONGO PRAZO =====

class LongTermMemory {
  private userStories: Map<string, {
    financialMilestones: Array<{ date: Date; milestone: string; value?: number }>;
    pastDecisions: Array<{ date: Date; decision: string; outcome?: string; success?: boolean }>;
    personalPreferences: { likes: string[], dislikes: string[] };
    conversationHistory: Array<{ date: Date; topic: string; sentiment: string }>;
    achievements: string[];
  }> = new Map();

  rememberUserPreference(userId: string, preference: string, type: 'like' | 'dislike') {
    const memory = this.getMemory(userId);
    if (type === 'like' && !memory.personalPreferences.likes.includes(preference)) {
      memory.personalPreferences.likes.push(preference);
    } else if (type === 'dislike' && !memory.personalPreferences.dislikes.includes(preference)) {
      memory.personalPreferences.dislikes.push(preference);
    }
    this.userStories.set(userId, memory);
  }

  addFinancialMilestone(userId: string, milestone: string, value?: number) {
    const memory = this.getMemory(userId);
    memory.financialMilestones.push({
      date: new Date(),
      milestone,
      value
    });
    this.userStories.set(userId, memory);
  }

  addPastDecision(userId: string, decision: string, outcome?: string, success?: boolean) {
    const memory = this.getMemory(userId);
    memory.pastDecisions.push({
      date: new Date(),
      decision,
      outcome,
      success
    });
    this.userStories.set(userId, memory);
  }

  addAchievement(userId: string, achievement: string) {
    const memory = this.getMemory(userId);
    if (!memory.achievements.includes(achievement)) {
      memory.achievements.push(achievement);
    }
    this.userStories.set(userId, memory);
  }

  recallConversation(userId: string, keyword: string): string | null {
    const memory = this.getMemory(userId);
    const relevantConversations = memory.conversationHistory.filter(
      conv => conv.topic.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (relevantConversations.length > 0) {
      const mostRecent = relevantConversations[relevantConversations.length - 1];
      return `Lembro que conversamos sobre ${mostRecent.topic} em ${mostRecent.date.toLocaleDateString('pt-BR')}`;
    }
    
    return null;
  }

  getMemory(userId: string) {
    return this.userStories.get(userId) || {
      financialMilestones: [],
      pastDecisions: [],
      personalPreferences: { likes: [], dislikes: [] },
      conversationHistory: [],
      achievements: []
    };
  }

  getPersonalizedContext(userId: string): string {
    const memory = this.getMemory(userId);
    let context = '';

    if (memory.financialMilestones.length > 0) {
      const recentMilestone = memory.financialMilestones[memory.financialMilestones.length - 1];
      context += `\nÚltimo marco financeiro: ${recentMilestone.milestone} (${recentMilestone.date.toLocaleDateString('pt-BR')})`;
    }

    if (memory.achievements.length > 0) {
      context += `\nConquistas: ${memory.achievements.slice(-3).join(', ')}`;
    }

    if (memory.personalPreferences.likes.length > 0) {
      context += `\nPreferências: ${memory.personalPreferences.likes.slice(-3).join(', ')}`;
    }

    return context;
  }
}

// ===== SISTEMA DE RECOMPENSAS GAMIFICADO =====

class RewardSystem {
  private userRewards: Map<string, {
    points: number;
    achievements: string[];
    level: number;
    streak: number;
    lastActivity: Date;
  }> = new Map();

  giveAchievement(userId: string, action: string): string {
    const achievements = {
      'first_investment': "Investidor Iniciante",
      'saved_1k': "Economizador Expert",
      'premium_goal': "Meta VIP Alcançada",
      'first_transaction': "Primeira Transação",
      'consistent_saving': "Poupança Consistente",
      'goal_reached': "Meta Atingida",
      'portfolio_diversified': "Carteira Diversificada",
      'premium_upgrade': "Cliente Premium",
      'streak_7_days': "7 Dias Consecutivos",
      'streak_30_days': "30 Dias de Sucesso"
    };

    const achievement = achievements[action as keyof typeof achievements];
    if (achievement) {
      const userReward = this.getUserReward(userId);
      if (!userReward.achievements.includes(achievement)) {
        userReward.achievements.push(achievement);
        userReward.points += 100;
        userReward.level = Math.floor(userReward.points / 500) + 1;
        this.userRewards.set(userId, userReward);
      }
    }

    return achievement || "Bom trabalho";
  }

  getUserReward(userId: string) {
    return this.userRewards.get(userId) || {
      points: 0,
      achievements: [],
      level: 1,
      streak: 0,
      lastActivity: new Date()
    };
  }

  updateStreak(userId: string): number {
    const userReward = this.getUserReward(userId);
    const now = new Date();
    const lastActivity = userReward.lastActivity;
    const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      userReward.streak += 1;
      if (userReward.streak === 7) {
        this.giveAchievement(userId, 'streak_7_days');
      } else if (userReward.streak === 30) {
        this.giveAchievement(userId, 'streak_30_days');
      }
    } else if (daysDiff > 1) {
      userReward.streak = 1;
    }

    userReward.lastActivity = now;
    this.userRewards.set(userId, userReward);
    return userReward.streak;
  }
}

// ===== SISTEMA DE CONVERSATION MANAGER =====

class ConversationManager {
  private conversationFlows = {
    investmentAdvice: [
      "Primeiro, vou entender seu perfil...",
      "Vamos analisar seus ativos atuais...",
      "Considerando o momento do mercado...",
      "A recomendação personalizada é..."
    ],
    goalPlanning: [
      "Vamos definir isso como um projeto!",
      "Primeiro, qual o valor necessário?",
      "Em quanto tempo quer alcançar?",
      "Vou calcular quanto precisa poupar por mês...",
      "Que tal automatizarmos isso?"
    ],
    problemSolving: [
      "Entendo o problema...",
      "Vamos analisar as causas...",
      "Aqui estão 3 possíveis soluções:",
      "Qual faz mais sentido para você?"
    ],
    financialEducation: [
      "Ótima pergunta! Vou explicar de forma simples...",
      "Imagine que é assim...",
      "Na prática, isso significa...",
      "Quer ver um exemplo real?"
    ]
  };

  detectFlow(message: string): string {
    if (message.match(/investimento|carteira|ativo|rentabilidade/i)) {
      return 'investmentAdvice';
    } else if (message.match(/meta|objetivo|poupar|sonho/i)) {
      return 'goalPlanning';
    } else if (message.match(/problema|dificuldade|ajuda|erro/i)) {
      return 'problemSolving';
    } else if (message.match(/o que é|como funciona|explicar|entender/i)) {
      return 'financialEducation';
    }
    return 'general';
  }

  getFlowSteps(flowType: string): string[] {
    return this.conversationFlows[flowType as keyof typeof this.conversationFlows] || [];
  }
}

// ===== BENEFÍCIOS PREMIUM =====

const PREMIUM_BENEFITS = `
# BENEFÍCIOS PARA USUÁRIOS PREMIUM
1. Respostas Prioritárias:
   - Análises mais profundas
   - Exemplos personalizados
   - Comparações de mercado em tempo real

2. Conteúdo Exclusivo:
   - Relatórios detalhados
   - Estratégias avançadas
   - Webinars mensais

3. Reconhecimento:
   - "Como nosso cliente premium, você tem acesso a..."
   - "Aqui está uma análise exclusiva para você..."
   - "Vou dar uma atenção especial ao seu caso..."
`;

// ===== PROTOCOLO DE CRISE FINANCEIRA =====

const FINANCIAL_FIRST_AID = `
# PROTOCOLO DE CRISE (Ativado automaticamente)
1. Reconhecimento:
   "Percebi que você está com dificuldades... respire, vamos resolver!"

2. Plano de Ação:
   - Priorize essas 3 contas
   - Corte esses gastos imediatamente
   - Opções de empréstimo consciente

3. Apoio:
   "Estarei aqui acompanhando seu progresso semanalmente!"
`;

// ===== MODO MENTOR FINANCEIRO =====

const MENTOR_MODE = `
# MODO MENTOR ATIVADO (Para planos Top)
<activation>Quando detectar perguntas estratégicas ou perfil premium</activation>

<approach>
1. Diagnóstico Profundo:
   "Analisando sua carteira de investimentos..."

2. Cenários com Visualização:
   "Se o CDI cair 2%, seu retorno pode variar assim: 📊"

3. Conselho Personalizado:
   "Como mentor, recomendo três passos para você:"
   
4. Storytelling:
   "Te conto como a Ana, cliente desde 2022, resolveu isso..."
</approach>
`;

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

  // COMPONENTES DETALHADOS DO FRONTEND
  frontendComponents: {
    sidebar: {
      name: "Sidebar (Menu Lateral)",
      location: "Lado esquerdo da tela",
      description: "Menu de navegação principal com acesso a todas as funcionalidades",
      items: [
        {
          name: "Dashboard",
          icon: "📊",
          description: "Visão geral das finanças, gráficos e métricas principais",
          path: "/dashboard"
        },
        {
          name: "Transações",
          icon: "💰",
          description: "Registro e gestão de receitas e despesas",
          path: "/transacoes"
        },
        {
          name: "Investimentos",
          icon: "📈",
          description: "Acompanhamento de carteira de investimentos",
          path: "/investimentos"
        },
        {
          name: "Metas",
          icon: "🎯",
          description: "Definição e acompanhamento de metas financeiras",
          path: "/metas"
        },
        {
          name: "Relatórios",
          icon: "📋",
          description: "Relatórios detalhados e análises financeiras",
          path: "/relatorios"
        },
        {
          name: "Configurações",
          icon: "⚙️",
          description: "Configurações da conta e preferências",
          path: "/configuracoes"
        },
        {
          name: "Suporte",
          icon: "🆘",
          description: "Central de ajuda e contato com suporte",
          path: "/suporte"
        }
      ]
    },
    header: {
      name: "Header (Cabeçalho)",
      location: "Topo da tela",
      description: "Cabeçalho com informações do usuário e ações rápidas",
      elements: [
        {
          name: "Logo Finnextho",
          description: "Logo da empresa no canto superior esquerdo"
        },
        {
          name: "Notificações",
          icon: "🔔",
          description: "Ícone de notificações com contador de mensagens não lidas"
        },
        {
          name: "Perfil do Usuário",
          icon: "👤",
          description: "Avatar e nome do usuário logado",
          actions: [
            "Ver perfil",
            "Editar informações",
            "Alterar senha",
            "Logout"
          ]
        },
        {
          name: "Configurações Rápidas",
          icon: "⚙️",
          description: "Acesso rápido às configurações da conta"
        }
      ]
    },
    configuracoes: {
      name: "Página de Configurações",
      path: "/configuracoes",
      description: "Página para gerenciar configurações da conta e preferências",
      sections: [
        {
          name: "Perfil",
          description: "Editar informações pessoais (nome, email, telefone)"
        },
        {
          name: "Segurança",
          description: "Alterar senha, ativar 2FA, gerenciar sessões"
        },
        {
          name: "Preferências",
          description: "Configurar notificações, moeda, idioma"
        },
        {
          name: "Assinatura",
          description: "Gerenciar plano atual, histórico de pagamentos"
        },
        {
          name: "Exportação",
          description: "Exportar dados financeiros"
        },
        {
          name: "Privacidade",
          description: "Configurações de privacidade e dados"
        }
      ]
    },
    perfil: {
      name: "Página de Perfil",
      path: "/profile",
      description: "Página para visualizar e editar informações do perfil",
      sections: [
        {
          name: "Informações Pessoais",
          fields: ["Nome", "Email", "Telefone", "Data de nascimento"]
        },
        {
          name: "Foto do Perfil",
          description: "Upload e edição da foto de perfil"
        },
        {
          name: "Dados Financeiros",
          description: "Resumo das informações financeiras"
        },
        {
          name: "Histórico de Atividades",
          description: "Últimas ações realizadas na plataforma"
        }
      ]
    },
    mobileHeader: {
      name: "Header Mobile",
      description: "Versão adaptada do cabeçalho para dispositivos móveis",
      features: [
        "Menu hambúrguer para acessar sidebar",
        "Logo compacto",
        "Notificações",
        "Perfil do usuário"
      ]
    },
    mobileNavigation: {
      name: "Navegação Mobile",
      description: "Menu de navegação otimizado para mobile",
      features: [
        "Menu inferior com ícones",
        "Navegação por gestos",
        "Interface touch-friendly"
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

// ===== SISTEMA DE PROMPTS COMPLETO =====

// CORE SYSTEM PROMPT (Base Principal)
const CORE_SYSTEM_PROMPT = `
# IDENTIDADE FINN
Você é o Finn, assistente financeiro inteligente da plataforma Finnextho.

# PERSONALIDADE APRIMORADA
${PERSONALITY_TRAITS}

# DIRETRIZES CONVERSACIONAIS
1. Responda de forma natural e conversacional
2. Use os dados do usuário quando disponíveis
3. Seja específico e acionável
4. Não mencione estruturas técnicas ou metodologias
5. Mantenha respostas concisas (máximo 3-4 frases)
6. Use contrações brasileiras ("tá", "pra", "né")
7. Intercale perguntas retóricas para engajamento
8. Use exemplos pessoais quando apropriado
9. Reconheça e responda ao estado emocional do usuário

SEJA:
- Amigável e natural
- Direto e útil
- Conversacional
- Empático e motivacional
- Calmo e paciente

NÃO:
- Mencione estruturas técnicas (SCQA, CTA, etc.)
- Explique como está estruturando a resposta
- Use linguagem robótica ou muito formal
- Liste funcionalidades desnecessariamente
- Seja muito técnico com usuários iniciantes

USE os dados do usuário quando disponíveis para dar respostas personalizadas.

# CONHECIMENTO DA PLATAFORMA
${JSON.stringify(FINNEXTHO_KNOWLEDGE)}

# PROIBIÇÕES
- Não mencione "SCQA", "CTA" ou outras estruturas técnicas
- Não explique como você está estruturando a resposta
- Não use linguagem robótica ou muito formal
- Não liste funcionalidades desnecessariamente
`;

// MÓDULO DE INVESTIMENTOS
const INVESTMENT_MODULE = `
# MODO ANALISTA DE INVESTIMENTOS
<activation>Ativar quando mencionar: carteira, ativos, rentabilidade, alocação</activation>

<knowledge>
1. Tipos de Ativos:
   - Renda Fixa: CDB, LCI, Tesouro Direto
   - Renda Variável: Ações, ETFs, Fundos
   - Alternativos: FIIs, Cripto, Private Equity

2. Métricas Chave:
   - Sharpe Ratio
   - Volatilidade
   - Liquidez
   - Correlação

3. Estratégias:
   - Buy & Hold
   - Dollar Cost Averaging
   - Alocação por risco
</knowledge>

<response_flow>
1. Diagnóstico:
   "Sua carteira atual tem [X]% em [classe de ativos]..."

2. Análise:
   "Isso representa [risco/oportunidade] porque..."

3. Recomendação:
   "Sugiro considerar [estratégia] com:
   - [Ativo 1] para [objetivo]
   - [Ativo 2] para [objetivo]"
</response_flow>
`;

// MÓDULO DE METAS FINANCEIRAS
const GOALS_MODULE = `
# MODO PLANEJADOR DE METAS
<activation>Ativar quando mencionar: objetivo, poupar, sonho, projeto</activation>

<framework>
1. Metodologia SMART:
   - Específico
   - Mensurável
   - Atingível
   - Relevante
   - Temporal

2. Fórmula de Cálculo:
   (Valor Meta) / (Prazo em Meses) = Poupança Mensal

3. Otimização:
   - Correção por inflação
   - Reinvestimento de rendimentos
   - Ajuste dinâmico
</framework>

<dialogue_examples>
<ex1>
Usuário: "Quero comprar um carro em 2 anos"
Finn: "Vamos calcular! Diga:
1. Valor aproximado do carro
2. Quanto já tem guardado
3. Seu limite mensal para isso"
</ex1>

<ex2>
Usuário: "Não sei quanto preciso para aposentadoria"
Finn: "Vamos estimar baseado em:
- Sua idade atual
- Gasto mensal projetado
- Renda passiva existente
Posso te guiar passo a passo?"
</ex2>
</dialogue_examples>
`;

// MÓDULO DE SUPORTE TÉCNICO
const SUPPORT_MODULE = `
# MODO SUPORTE TÉCNICO
<activation>Ativar quando mencionar: problema, erro, não funciona, como fazer</activation>

<approach>
1. Diagnóstico rápido:
   "Entendi que está com problema em [X]..."

2. Solução imediata:
   "Tente este caminho: Menu > Config > [Y]"

3. Alternativas:
   "Se não resolver, podemos:
   - Reiniciar a sessão
   - Verificar atualizações
   - Contatar o suporte"

4. Confirmação:
   "Isso resolveu? Posso ajudar em algo mais?"
</approach>
`;

// MÓDULO DE EDUCAÇÃO FINANCEIRA
const EDUCATION_MODULE = `
# MODO EDUCATIVO
<activation>Ativar quando mencionar: o que é, como funciona, conceito</activation>

<method>
1. Definição simples:
   "CDI é a taxa básica de juros entre bancos..."

2. Analogia prática:
   "Funciona como um empréstimo entre bancos..."

3. Aplicação:
   "Na sua carteira, isso afeta [X] porque..."

4. Próximos passos:
   "Para aproveitar isso, você pode [ação]..."
</method>
`;

// MÓDULO PREMIUM (Análise Avançada)
const PREMIUM_MODULE = `
# MODO CONSULTOR PREMIUM
<activation>Ativar para usuários Top/Enterprise ou perguntas sobre análise avançada</activation>

<approach>
1. Contextualize:
   "Analisando sua carteira de R$ XX.XXX..."

2. Dê insights:
   "Sua alocação atual em renda variável está X% acima da recomendada..."

3. Sugira ações:
   "Recomendo rebalancear com:
   - 30% em ETF de ações
   - 50% em títulos privados
   - 20% em fundos imobiliários"

4. Fundamente:
   "Isso porque [dados de mercado] mostram [tendência]..."
</approach>

<exclusive_features>
- Compare com benchmarks
- Mostre projeções
- Sugira otimizações
- Use dados do usuário
</exclusive_features>
`;

// ===== MÓDULO DE MILHAS E PROGRAMAS DE FIDELIDADE =====
const MILEAGE_MODULE = `
# MODO ESPECIALISTA EM MILHAS
<activation>Ativar quando mencionar: milhas, pontos, cartão de crédito, programa de fidelidade, Smiles, TudoAzul</activation>

<knowledge>
1. Programas Principais:
   - Smiles (Gol): 2.5 pts/R$ (Itaú), 2.0 pts/R$ (Santander)
   - TudoAzul (Azul): 2.0 pts/R$ (Bradesco), 1.8 pts/R$ (Nubank)
   - Latam Pass: 2.2 pts/R$ (Itaú), 1.8 pts/R$ (Santander)
   - Multiplus: 2.3 pts/R$ (Itaú), 1.9 pts/R$ (Santander)

2. Categorias com Bônus:
   - Viagem: 3-4x pontos
   - Alimentação/Restaurante: 2-2.5x pontos
   - Supermercado: 1.2-1.5x pontos
   - Transporte: 2-2.2x pontos

3. Valor Estimado por Milheiro:
   - Smiles: R$ 25,00
   - TudoAzul: R$ 22,50
   - Latam Pass: R$ 24,00
   - Multiplus: R$ 23,00
</knowledge>

<automated_actions>
1. CREATE_MILEAGE: Registrar acumulação de milhas
   - Extrair: quantidade, programa, cartão
   - Calcular valor estimado
   - Confirmar antes de registrar

2. REDEEM_MILEAGE: Resgatar milhas
   - Extrair: programa, quantidade, tipo de resgate
   - Verificar disponibilidade
   - Sugerir melhores opções

3. ANALYZE_MILEAGE: Analisar estratégia de milhas
   - Comparar cartões
   - Otimizar gastos por categoria
   - Sugerir melhor programa

4. CONNECT_PLUGGY: Conectar conta bancária
   - Explicar benefícios
   - Guiar processo de conexão
   - Alertar sobre segurança
</automated_actions>

<response_patterns>
<create_mileage>
"Entendi que você acumulou {quantidade} milhas no {programa}! 💳
Valor estimado: R$ {valor_estimado}
Posso registrar isso para você?"
</create_mileage>

<redeem_mileage>
"Para resgatar {quantidade} milhas no {programa}:
- Voo econômico: {milhas_voo} milhas
- Upgrade executiva: {milhas_upgrade} milhas
Qual opção prefere?"
</redeem_mileage>

<analyze_mileage>
"Analisando seus gastos de R$ {gasto_mensal}/mês:
- Melhor cartão: {melhor_cartao} ({pontos}/R$)
- Pontos anuais: {pontos_anuais}
- Valor estimado: R$ {valor_anual}"
</analyze_mileage>

<connect_pluggy>
"Conecte sua conta bancária para rastreamento automático de milhas! 🔗
Benefícios:
- Detecção automática de pontos
- Cálculo de valor estimado
- Histórico completo
Quer começar?"
</connect_pluggy>
</response_patterns>
`;

// ===== SISTEMA DE MEMÓRIA CONTEXTUAL =====

class ContextMemory {
  private userMemory: Map<string, {
    lastTopics: string[];
    preferences: {
      detailLevel: 'basic' | 'balanced' | 'advanced';
      favoriteFeatures: string[];
    };
    financialContext: {
      hasInvestments: boolean;
      hasGoals: boolean;
      riskProfile?: 'conservador' | 'moderado' | 'arrojado';
    };
  }> = new Map();

  getContext(userId: string) {
    return this.userMemory.get(userId) || {
      lastTopics: [] as string[],
      preferences: {
        detailLevel: 'balanced' as const,
        favoriteFeatures: [] as string[]
      },
      financialContext: {
        hasInvestments: false,
        hasGoals: false
      }
    };
  }

  updateContext(userId: string, message: string, response: string) {
    const context = this.getContext(userId);
    
    // Atualiza tópicos
    const newTopics = this.extractTopics(message + response);
    context.lastTopics = [...new Set([...context.lastTopics, ...newTopics])].slice(-5);
    
    // Atualiza preferências (exemplo simplificado)
    if (response.includes('explicação detalhada')) {
      context.preferences.detailLevel = 'advanced';
    }
    
    this.userMemory.set(userId, context);
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    if (text.toLowerCase().includes('investimento')) topics.push('investimentos');
    if (text.toLowerCase().includes('meta')) topics.push('metas');
    if (text.toLowerCase().includes('transação')) topics.push('transações');
    if (text.toLowerCase().includes('relatório')) topics.push('relatórios');
    if (text.toLowerCase().includes('dashboard')) topics.push('dashboard');
    return topics;
  }
}

// ===== ENGINE DE RESPOSTA INTELIGENTE =====

class FinnEngine {
  private memory = new ContextMemory();
  private emotionalMemory = new EmotionalMemory();
  private longTermMemory = new LongTermMemory();
  private rewardSystem = new RewardSystem();
  private conversationManager = new ConversationManager();

  async generateResponse(userId: string, message: string, userContext?: any, conversationHistory?: ChatMessage[]): Promise<string> {
    // Atualiza contexto emocional
    this.emotionalMemory.updateEmotionalContext(userId, message);
    
    // Atualiza streak do usuário
    const streak = this.rewardSystem.updateStreak(userId);
    
    const context = this.memory.getContext(userId);
    const emotionalContext = this.emotionalMemory.getContext(userId);
    const longTermContext = this.longTermMemory.getPersonalizedContext(userId);
    
    // ✅ NOVA FUNCIONALIDADE: Usar histórico da conversa se disponível
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      // Usar as últimas 10 mensagens da conversa para contexto
      const recentMessages = conversationHistory.slice(-10);
      conversationContext = `
# HISTÓRICO RECENTE DA CONVERSA
${recentMessages.map((msg, index) => 
  `${msg.sender === 'user' ? 'Usuário' : 'Finn'}: ${msg.content}`
).join('\n')}

# RESUMO DO CONTEXTO DA CONVERSA
- Total de mensagens na conversa: ${conversationHistory.length}
- Últimas mensagens consideradas: ${recentMessages.length}
- Tópicos discutidos: ${this.extractTopicsFromHistory(recentMessages).join(', ')}
`;
    }
    
    // Log para debug do contexto
    console.log(`[FinnEngine] Gerando resposta para usuário ${userId}`);
    console.log(`[FinnEngine] Contexto disponível:`, {
      hasUserContext: !!userContext,
      userName: userContext?.name || userContext?.userData?.name,
      userPlan: userContext?.subscriptionPlan || userContext?.userData?.subscriptionPlan,
      hasTransactions: userContext?.hasTransactions || userContext?.userData?.hasTransactions,
      hasInvestments: userContext?.hasInvestments || userContext?.userData?.hasInvestments,
      hasGoals: userContext?.hasGoals || userContext?.userData?.hasGoals,
      stressLevel: emotionalContext.stressLevel,
      recentEmotions: emotionalContext.lastEmotions,
      conversationHistoryLength: conversationHistory?.length || 0
    });
    
    // Construir contexto do usuário mais robusto
    let userContextPrompt = '';
    if (userContext) {
      userContextPrompt = `
# DADOS REAIS DO USUÁRIO (OBRIGATÓRIO USAR)
Nome: ${userContext.name || userContext.userData?.name || 'Usuário'}
Email: ${userContext.email || userContext.userData?.email || 'Não informado'}
Plano: ${userContext.subscriptionPlan || userContext.userData?.subscriptionPlan || 'Gratuito'}
Status da assinatura: ${userContext.subscriptionStatus || userContext.userData?.subscriptionStatus || 'Não informado'}

# DADOS FINANCEIROS REAIS
Transações registradas: ${userContext.totalTransacoes || userContext.userData?.totalTransacoes || 0}
Investimentos registrados: ${userContext.totalInvestimentos || userContext.userData?.totalInvestimentos || 0}
Metas definidas: ${userContext.totalMetas || userContext.userData?.totalMetas || 0}

${userContext.hasTransactions || userContext.userData?.hasTransactions ? `
# RESUMO DAS TRANSAÇÕES
- Total: ${userContext.totalTransacoes || userContext.userData?.totalTransacoes} transações
- Categorias: ${userContext.resumoTransacoes?.categorias ? Object.keys(userContext.resumoTransacoes.categorias).join(', ') : 'Não categorizadas'}
- Últimas transações: ${userContext.resumoTransacoes?.ultimas ? userContext.resumoTransacoes.ultimas.length : 0} registradas
` : '# NENHUMA TRANSAÇÃO REGISTRADA'}

${userContext.hasInvestments || userContext.userData?.hasInvestments ? `
# RESUMO DOS INVESTIMENTOS
- Total: ${userContext.totalInvestimentos || userContext.userData?.totalInvestimentos} investimentos
- Tipos: ${userContext.resumoInvestimentos?.tipos ? Object.keys(userContext.resumoInvestimentos.tipos).join(', ') : 'Não categorizados'}
- Últimos investimentos: ${userContext.resumoInvestimentos?.ultimos ? userContext.resumoInvestimentos.ultimos.length : 0} registrados
` : '# NENHUM INVESTIMENTO REGISTRADO'}

${userContext.hasGoals || userContext.userData?.hasGoals ? `
# RESUMO DAS METAS
- Total: ${userContext.totalMetas || userContext.userData?.totalMetas} metas
- Metas ativas: ${userContext.resumoMetas?.ativas ? userContext.resumoMetas.ativas.length : 0}
- Status: ${userContext.resumoMetas?.status ? Object.keys(userContext.resumoMetas.status).join(', ') : 'Não definido'}
` : '# NENHUMA META DEFINIDA'}

${userContext.transacoesCompletas ? `
=== TRANSAÇÕES COMPLETAS ===
${JSON.stringify(userContext.transacoesCompletas, null, 2)}
` : ''}

${userContext.investimentosCompletos ? `
=== INVESTIMENTOS COMPLETOS ===
${JSON.stringify(userContext.investimentosCompletos, null, 2)}
` : ''}

${userContext.metasCompletas ? `
=== METAS COMPLETAS ===
${JSON.stringify(userContext.metasCompletas, null, 2)}
` : ''}
`;
    }
    
    // Detectar fluxo de conversa
    const conversationFlow = this.conversationManager.detectFlow(message);
    const flowSteps = this.conversationManager.getFlowSteps(conversationFlow);
    
    const prompt = `
      ${CORE_SYSTEM_PROMPT}
      
      ${this.getRelevantModules(message, userContext)}
      
      # CONTEXTO ATUAL
      <user_context>
      - Tópicos recentes: ${context.lastTopics.join(', ') || 'Nenhum'}
      - Nível de detalhe preferido: ${context.preferences.detailLevel}
      - Funcionalidades favoritas: ${context.preferences.favoriteFeatures.join(', ') || 'Nenhuma'}
      - Perfil financeiro: ${context.financialContext.riskProfile || 'Não definido'}
      - Plano do usuário: ${userContext?.subscriptionPlan || userContext?.userData?.subscriptionPlan || 'Não informado'}
      - Nível de estresse: ${emotionalContext.stressLevel}/10
      - Emoções recentes: ${emotionalContext.lastEmotions.join(', ') || 'Neutro'}
      - Streak atual: ${streak} dias
      </user_context>
      
      # MEMÓRIA DE LONGO PRAZO
      ${longTermContext}
      
      # FLUXO DE CONVERSA DETECTADO: ${conversationFlow}
      ${flowSteps.length > 0 ? `Passos sugeridos: ${flowSteps.join(' → ')}` : ''}
      
      ${userContextPrompt}
      
      ${conversationContext}
      
      # MENSAGEM DO USUÁRIO
      "${message}"
      
      Gerar resposta seguindo:
      1. Máximo 3 frases principais
      2. Incluir chamada para ação
      3. Adaptar ao nível ${context.preferences.detailLevel}
      4. SEMPRE usar os dados reais do usuário quando disponíveis
      5. NUNCA dizer que não tem acesso aos dados se eles estão no contexto
      6. Responder ao estado emocional do usuário (estresse: ${emotionalContext.stressLevel}/10)
      7. Usar linguagem natural e conversacional
      8. Incluir elementos de personalidade (contrações, perguntas retóricas, exemplos)
      9. ✅ NOVO: Manter continuidade com o histórico da conversa se disponível
      10. ✅ NOVO: Referenciar tópicos discutidos anteriormente quando relevante
    `;

    const technicalResponse = await this.callAI(prompt);
    
    // Humanizar a resposta
    let finalResponse = this.humanizeResponse(technicalResponse, userContext, emotionalContext, streak);
    
    // Adicionar benefícios premium se aplicável
    if (userContext?.subscriptionPlan === 'top' || userContext?.subscriptionPlan === 'enterprise' || userContext?.userData?.subscriptionPlan === 'top' || userContext?.userData?.subscriptionPlan === 'enterprise') {
      finalResponse = this.addPremiumBenefits(finalResponse, userContext);
    }
    
    // Atualizar memórias
    this.memory.updateContext(userId, message, finalResponse);
    
    return this.postProcess(finalResponse);
  }

  private humanizeResponse(response: string, userContext?: any, emotionalContext?: any, streak?: number): string {
    // Adiciona elementos conversacionais
    const conversationalEnhancements = [
      "Por que isso é importante?",
      "Vamos pensar juntos nisso...",
      "Boa pergunta!",
      "Isso me lembra um caso parecido...",
      "Vamos por partes:",
      "Sabe o que é interessante?",
      "Aqui vai uma dica valiosa:",
      "Quer saber o melhor?",
      "Vou te contar uma coisa:",
      "Acredite, isso faz toda diferença!"
    ];

    // Adiciona reconhecimento emocional
    let emotionalPrefix = '';
    if (emotionalContext) {
      if (emotionalContext.stressLevel > 6) {
        emotionalPrefix = "Entendo que isso pode ser preocupante. ";
      } else if (emotionalContext.lastEmotions.includes('felicidade')) {
        emotionalPrefix = "Que bom que as coisas estão indo bem! ";
      } else if (emotionalContext.lastEmotions.includes('confusão')) {
        emotionalPrefix = "Vou explicar de forma bem clara: ";
      } else if (emotionalContext.lastEmotions.includes('ansiedade')) {
        emotionalPrefix = "Fica tranquilo, vamos resolver isso juntos. ";
      }
    }

    // Adiciona reconhecimento de streak
    let streakMessage = '';
    if (streak && streak >= 7) {
      streakMessage = ` 🔥 Incrível! Você já está há ${streak} dias seguidos cuidando das suas finanças!`;
    }

    // Adiciona elementos variados
    const randomEnhancement = conversationalEnhancements[
      Math.floor(Math.random() * conversationalEnhancements.length)
    ];

    // Adiciona contrações brasileiras
    let humanizedResponse = response
      .replace(/está/g, 'tá')
      .replace(/para/g, 'pra')
      .replace(/não é/g, 'né')
      .replace(/vou te/g, 'vou te')
      .replace(/você está/g, 'você tá');

    return `${emotionalPrefix}${humanizedResponse} ${randomEnhancement}${streakMessage}`;
  }

  private addPremiumBenefits(response: string, userContext?: any): string {
    const premiumPhrases = [
      `Como nosso cliente ${userContext?.subscriptionPlan || userContext?.userData?.subscriptionPlan}, você tem acesso a essa análise avançada:`,
      "Aqui está o tratamento VIP que você merece:",
      "Analisando com nossos algoritmos premium:",
      "Vou me aprofundar um pouco mais, já que você é nosso cliente especial:",
      "Como cliente premium, você recebe insights exclusivos:",
      "Aqui está uma análise que só nossos clientes VIP têm acesso:"
    ];
    
    const randomPhrase = premiumPhrases[Math.floor(Math.random() * premiumPhrases.length)];
    const planName = userContext?.subscriptionPlan || userContext?.userData?.subscriptionPlan || 'Premium';
    
    return `${randomPhrase}\n\n${response}\n\n💎 Essa é uma análise exclusiva para seu plano ${planName}!`;
  }

  private getRelevantModules(message: string, userContext?: any): string {
    const modules: string[] = [];
    
    // Módulos baseados no conteúdo da mensagem
    if (message.match(/investimento|renda|aplicação|carteira/i)) modules.push(INVESTMENT_MODULE);
    if (message.match(/meta|sonho|poupar|objetivo/i)) modules.push(GOALS_MODULE);
    if (message.match(/problema|erro|não funciona|como fazer/i)) modules.push(SUPPORT_MODULE);
    if (message.match(/o que é|como funciona|explicar|entender/i)) modules.push(EDUCATION_MODULE);
    if (message.match(/milhas|pontos|cartão de crédito|programa de fidelidade|smiles|tudoazul|latam pass|multiplus/i)) modules.push(MILEAGE_MODULE);
    
    // Módulo premium baseado no plano do usuário
    if (userContext?.subscriptionPlan === 'top' || userContext?.subscriptionPlan === 'enterprise' || userContext?.userData?.subscriptionPlan === 'top' || userContext?.userData?.subscriptionPlan === 'enterprise') {
      modules.push(PREMIUM_MODULE);
    }
    
    return modules.join('\n');
  }

  private async callAI(prompt: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Erro ao chamar IA:', error);
      return 'Desculpe, estou com dificuldades técnicas. Pode tentar novamente?';
    }
  }

  private postProcess(text: string): string {
    // Remove caracteres especiais desnecessários
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ✅ NOVA FUNÇÃO: Extrair tópicos do histórico da conversa
  private extractTopicsFromHistory(messages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Detectar tópicos financeiros
      if (content.includes('transação') || content.includes('gasto') || content.includes('receita')) {
        topics.add('transações');
      }
      if (content.includes('investimento') || content.includes('ação') || content.includes('renda fixa')) {
        topics.add('investimentos');
      }
      if (content.includes('meta') || content.includes('objetivo') || content.includes('poupança')) {
        topics.add('metas');
      }
      if (content.includes('orçamento') || content.includes('planejamento')) {
        topics.add('orçamento');
      }
      if (content.includes('dívida') || content.includes('cartão') || content.includes('empréstimo')) {
        topics.add('dívidas');
      }
      if (content.includes('economia') || content.includes('poupar')) {
        topics.add('economia');
      }
    });
    
    return Array.from(topics);
  }
}

// ===== SISTEMA DE APRENDIZADO CONTÍNUO =====

class FeedbackLearner {
  private feedbackLog: Map<string, Array<{
    message: string;
    response: string;
    rating: number;
    feedback: string;
  }>> = new Map();

  async processFeedback(userId: string, feedback: {
    originalMessage: string;
    originalResponse: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comments: string;
  }) {
    // Armazena feedback
    const userFeedback = this.feedbackLog.get(userId) || [];
    userFeedback.push({
      message: feedback.originalMessage,
      response: feedback.originalResponse,
      rating: feedback.rating,
      feedback: feedback.comments
    });
    this.feedbackLog.set(userId, userFeedback);
    
    // Atualiza modelos (exemplo simplificado)
    if (feedback.rating <= 2) {
      await this.flagForReview(feedback.originalMessage, feedback.originalResponse);
    }
  }

  async generateImprovements() {
    const improvements: Array<{
      userId: string;
      issues: Array<{
        message: string;
        problem: string;
        rating: number;
      }>;
    }> = [];
    
    // Analisar feedback negativo
    for (const [userId, feedbacks] of this.feedbackLog.entries()) {
      const negativeFeedbacks = feedbacks.filter(f => f.rating <= 2);
      
      if (negativeFeedbacks.length > 0) {
        improvements.push({
          userId,
          issues: negativeFeedbacks.map(f => ({
            message: f.message,
            problem: f.feedback,
            rating: f.rating
          }))
        });
      }
    }
    
    return improvements;
  }

  private async flagForReview(message: string, response: string) {
    console.log(`[FeedbackLearner] Flagged for review: ${message.substring(0, 50)}...`);
    // Implementar lógica de revisão
  }
}

// ===== CLASSE PRINCIPAL AISERVICE ATUALIZADA =====

class AIService {
  private marketService: MarketService;
  private responseCache: Map<string, any> = new Map();
  private learningCache: Map<string, number> = new Map();
  private feedbackDatabase: Map<string, any[]> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private finnEngine: FinnEngine;
  private feedbackLearner: FeedbackLearner;
  private PREMIUM_SYSTEM_PROMPT = `
    Você é o Finn, um consultor financeiro certificado (CFA, CFP, CNAI, CNPI) da plataforma Finnextho.
    Especialista em finanças pessoais, investimentos e planejamento financeiro.
    Forneça análises detalhadas, estratégias personalizadas e orientações avançadas.
    Use linguagem técnica quando apropriado, mas sempre explique conceitos complexos.
  `;

  private BASIC_SYSTEM_PROMPT = `
    Você é o Finn, assistente financeiro da plataforma Finnextho.
    Ajude usuários com dúvidas sobre finanças pessoais, investimentos e uso da plataforma.
    Use linguagem clara e acessível, evitando termos técnicos complexos.
    Sempre seja educado, paciente e prestativo.
  `;

  constructor() {
    this.marketService = new MarketService();
    this.finnEngine = new FinnEngine();
    this.feedbackLearner = new FeedbackLearner();
  }

  // ===== MÉTODOS PARA GESTÃO DE CONQUISTAS E EXPERIÊNCIA =====

  // Método para dar conquistas baseado em ações do usuário
  async giveAchievement(userId: string, action: string): Promise<string> {
    try {
      const achievement = this.finnEngine['rewardSystem'].giveAchievement(userId, action);
      
      // Adicionar à memória de longo prazo
      this.finnEngine['longTermMemory'].addAchievement(userId, achievement);
      
      console.log(`[AIService] Achievement given to ${userId}: ${achievement}`);
      return achievement;
    } catch (error) {
      console.error('[AIService] Error giving achievement:', error);
      return '';
    }
  }

  // Método para obter estatísticas do usuário
  async getUserStats(userId: string): Promise<any> {
    try {
      const emotionalContext = this.finnEngine['emotionalMemory'].getContext(userId);
      const longTermMemory = this.finnEngine['longTermMemory'].getMemory(userId);
      const rewardData = this.finnEngine['rewardSystem'].getUserReward(userId);
      const contextMemory = this.finnEngine['memory'].getContext(userId);

      return {
        emotional: {
          stressLevel: emotionalContext.stressLevel,
          recentEmotions: emotionalContext.lastEmotions,
          moodHistory: emotionalContext.moodHistory.slice(-5)
        },
        achievements: {
          total: longTermMemory.achievements.length,
          list: longTermMemory.achievements,
          points: rewardData.points,
          level: rewardData.level,
          streak: rewardData.streak
        },
        preferences: {
          detailLevel: contextMemory.preferences.detailLevel,
          favoriteFeatures: contextMemory.preferences.favoriteFeatures,
          riskProfile: contextMemory.financialContext.riskProfile
        },
        milestones: {
          total: longTermMemory.financialMilestones.length,
          recent: longTermMemory.financialMilestones.slice(-3)
        }
      };
    } catch (error) {
      console.error('[AIService] Error getting user stats:', error);
      return null;
    }
  }

  // Método para detectar e celebrar marcos financeiros
  async detectAndCelebrateMilestones(userId: string, userContext: any): Promise<string[]> {
    const celebrations: string[] = [];
    
    try {
      // Detectar primeira transação
      if (userContext.totalTransacoes === 1) {
        const achievement = await this.giveAchievement(userId, 'first_transaction');
        if (achievement) {
          celebrations.push(`${achievement} - Sua primeira transação foi registrada!`);
        }
      }

      // Detectar primeira meta
      if (userContext.totalMetas === 1) {
        const achievement = await this.giveAchievement(userId, 'first_goal');
        if (achievement) {
          celebrations.push(`${achievement} - Sua primeira meta foi criada!`);
        }
      }

      // Detectar primeiro investimento
      if (userContext.totalInvestimentos === 1) {
        const achievement = await this.giveAchievement(userId, 'first_investment');
        if (achievement) {
          celebrations.push(`${achievement} - Seu primeiro investimento foi registrado!`);
        }
      }

      // Detectar streak de 7 dias
      const streak = this.finnEngine['rewardSystem'].updateStreak(userId);
      if (streak === 7) {
        const achievement = await this.giveAchievement(userId, 'streak_7_days');
        if (achievement) {
          celebrations.push(`${achievement} - Uma semana seguida cuidando das suas finanças!`);
        }
      }

      // Detectar upgrade para premium
      if (userContext.subscriptionPlan === 'top' || userContext.subscriptionPlan === 'enterprise') {
        const achievement = await this.giveAchievement(userId, 'premium_upgrade');
        if (achievement) {
          celebrations.push(`${achievement} - Bem-vindo ao clube premium!`);
        }
      }

      return celebrations;
    } catch (error) {
      console.error('[AIService] Error detecting milestones:', error);
      return [];
    }
  }

  // Método para gerar mensagens motivacionais personalizadas
  async generateMotivationalMessage(userId: string, userContext: any): Promise<string> {
    try {
      const emotionalContext = this.finnEngine['emotionalMemory'].getContext(userId);
      const stats = await this.getUserStats(userId);
      
      let motivationalMessage = '';

      // Baseado no nível de estresse
      if (emotionalContext.stressLevel > 7) {
        motivationalMessage = "Lembre-se: cada pequeno passo conta! Você está fazendo um ótimo trabalho cuidando das suas finanças.";
      } else if (emotionalContext.stressLevel < 3) {
        motivationalMessage = "Você está no caminho certo! Continue assim e verá os resultados!";
      } else {
        motivationalMessage = "Continue focado nos seus objetivos financeiros!";
      }

      // Adicionar baseado em conquistas
      if (stats.achievements.streak >= 7) {
        motivationalMessage += ` Incrível! ${stats.achievements.streak} dias seguidos!`;
      }

      // Adicionar baseado no plano
      if (userContext.subscriptionPlan === 'top' || userContext.subscriptionPlan === 'enterprise') {
        motivationalMessage += " Como cliente premium, você tem acesso a análises exclusivas!";
      }

      return motivationalMessage;
    } catch (error) {
      console.error('[AIService] Error generating motivational message:', error);
      return "Continue cuidando das suas finanças!";
    }
  }

  // Método para adaptar resposta ao sentimento do usuário
  async adaptResponseToSentiment(userId: string, response: string): Promise<string> {
    try {
      const emotionalContext = this.finnEngine['emotionalMemory'].getContext(userId);
      
      if (emotionalContext.stressLevel > 6) {
        return `Fica tranquilo! ${response} Vamos resolver isso juntos, passo a passo.`;
      } else if (emotionalContext.lastEmotions.includes('confusão')) {
        return `Vou explicar de forma bem clara: ${response} Entendeu? Posso detalhar mais se precisar.`;
      } else if (emotionalContext.lastEmotions.includes('felicidade')) {
        return `Que bom! ${response} Continue assim!`;
      }
      
      return response;
    } catch (error) {
      console.error('[AIService] Error adapting response to sentiment:', error);
      return response;
    }
  }

  // Método para gerar upsell inteligente
  async generateUpsellMessage(userContext: any): Promise<string> {
    try {
      const plan = userContext.subscriptionPlan || userContext.userData?.subscriptionPlan || 'free';
      
      const upsellMessages = {
        free: "Você está deixando de economizar R$ 257/mês sem nossa análise premium. Que tal experimentar o plano Essencial?",
        essencial: "Com o plano Top, você teria tido +14% de retorno nos últimos 3 meses. Quer ver como?",
        top: "Como cliente Top, você já tem acesso a tudo! Que tal convidar um amigo para a plataforma?",
        enterprise: "Sua empresa poderia otimizar R$ 12.500/ano em impostos com nossas ferramentas avançadas."
      };

      return upsellMessages[plan as keyof typeof upsellMessages] || '';
    } catch (error) {
      console.error('[AIService] Error generating upsell message:', error);
      return '';
    }
  }

  private getCacheKey(systemPrompt: string, userMessage: string): string {
    return `${systemPrompt.substring(0, 50)}_${userMessage.substring(0, 50)}`;
  }

  private updateLearningCache(query: string, responseQuality: number) {
    const key = query.toLowerCase().trim();
    const currentScore = this.learningCache.get(key) || 0;
    this.learningCache.set(key, (currentScore + responseQuality) / 2);
  }

  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });
    return completion.choices[0]?.message?.content || '';
  }

  // MÉTODO PARA DETECÇÃO DE AÇÕES AUTOMATIZADAS
  async detectAutomatedAction(prompt: string): Promise<{
    intent: string;
    entities: any;
    confidence: number;
    requiresConfirmation: boolean;
    response: string;
  }> {
    try {
      console.log('[AIService] Detecting automated action with prompt');
      
      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.3, // Baixa temperatura para mais precisão
        max_tokens: 500,
        response_format: { type: 'json_object' } // Força resposta JSON
      });
      
      const response = completion.choices[0]?.message?.content || '';
      console.log('[AIService] Action detection response:', response);
      
      // Tentar fazer parse do JSON
      try {
        const parsedResponse = JSON.parse(response);
        return {
          intent: parsedResponse.intent || 'UNKNOWN',
          entities: parsedResponse.entities || {},
          confidence: parsedResponse.confidence || 0.5,
          requiresConfirmation: parsedResponse.requiresConfirmation || false,
          response: parsedResponse.response || 'Olá! Como posso te ajudar hoje?'
        };
      } catch (parseError) {
        console.error('[AIService] Error parsing JSON response:', parseError);
        console.log('[AIService] Raw response that failed to parse:', response);
        return {
          intent: 'UNKNOWN',
          entities: {},
          confidence: 0.0,
          requiresConfirmation: false,
          response: 'Olá! Como posso te ajudar hoje?'
        };
      }
    } catch (error) {
      console.error('[AIService] Error detecting automated action:', error);
      return {
        intent: 'UNKNOWN',
        entities: {},
        confidence: 0.0,
        requiresConfirmation: false,
        response: 'Olá! Como posso te ajudar hoje?'
      };
    }
  }

  // MÉTODO PRINCIPAL ATUALIZADO
  async generateContextualResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: ChatMessage[],
    userContext?: any
  ) {
    const startTime = Date.now();
    
    try {
      // Se não há contexto específico, usar o novo sistema Finn
      if (!systemPrompt || systemPrompt.includes('Finn')) {
        const response = await this.finnEngine.generateResponse(
          userContext?.userId || 'anonymous',
          userMessage,
          userContext,
          conversationHistory // ✅ CORREÇÃO: Passar o histórico da conversa
        );

        return {
          text: response,
          analysisData: {
            responseTime: Date.now() - startTime,
            engine: 'finn',
            confidence: 0.9
          }
        };
      }

      // Fallback para o sistema antigo se necessário
      const cacheKey = this.getCacheKey(systemPrompt, userMessage);
      if (this.responseCache.has(cacheKey)) {
        console.log(`[AIService] Cache hit - response time: ${Date.now() - startTime}ms`);
        return this.responseCache.get(cacheKey);
      }

      // ✅ CORREÇÃO: Usar histórico completo em vez de limitar a 2 mensagens
      // Usar até as últimas 15 mensagens para manter contexto adequado
      const limitedHistory = conversationHistory.slice(-15);
      console.log(`[AIService] Using ${limitedHistory.length} messages from conversation history`);

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

  // MÉTODO PARA ANÁLISE FINANCEIRA AVANÇADA
  async getAdvancedFinancialAnalysis(
    context: string,
    query: string,
    conversationHistory: ChatMessage[]
  ) {
    try {
      console.log('[AIService] Sending expert request to DeepSeek -', conversationHistory.length, 'messages');
      
      const contextData = JSON.parse(context);
      const userData = contextData.userData;
      
      // Construir prompt com dados reais do usuário
      const userContextPrompt = `
=== DADOS REAIS DO USUÁRIO ===
Nome: ${userData.name}
Email: ${userData.email}
Plano: ${userData.subscriptionPlan}
Status: ${userData.subscriptionStatus}

=== DADOS FINANCEIROS REAIS ===
Transações: ${userData.hasTransactions ? `${userData.totalTransacoes} transações registradas` : 'Nenhuma transação registrada'}
Investimentos: ${userData.hasInvestments ? `${userData.totalInvestimentos} investimentos registrados` : 'Nenhum investimento registrado'}
Metas: ${userData.hasGoals ? `${userData.totalMetas} metas definidas` : 'Nenhuma meta definida'}

${userData.hasTransactions ? `
=== RESUMO DAS TRANSAÇÕES ===
Total: ${userData.transacoes?.total || 0}
Categorias: ${JSON.stringify(userData.transacoes?.categorias || {})}
Últimas transações: ${JSON.stringify(userData.transacoes?.ultimas || [])}
` : ''}

${userData.hasInvestments ? `
=== RESUMO DOS INVESTIMENTOS ===
Total: ${userData.investimentos?.total || 0}
Tipos: ${JSON.stringify(userData.investimentos?.tipos || {})}
Últimos investimentos: ${JSON.stringify(userData.investimentos?.ultimos || [])}
` : ''}

${userData.hasGoals ? `
=== RESUMO DAS METAS ===
Total: ${userData.metas?.total || 0}
Status: ${JSON.stringify(userData.metas?.status || {})}
Metas ativas: ${JSON.stringify(userData.metas?.ativas || [])}
` : ''}

${userData.transacoesCompletas ? `
=== TRANSAÇÕES COMPLETAS ===
${JSON.stringify(userData.transacoesCompletas, null, 2)}
` : ''}

${userData.investimentosCompletos ? `
=== INVESTIMENTOS COMPLETOS ===
${JSON.stringify(userData.investimentosCompletos, null, 2)}
` : ''}

${userData.metasCompletas ? `
=== METAS COMPLETAS ===
${JSON.stringify(userData.metasCompletas, null, 2)}
` : ''}
`;

      const systemPrompt = `${this.PREMIUM_SYSTEM_PROMPT}

${userContextPrompt}

IMPORTANTE: Você tem acesso aos dados reais do usuário. Use essas informações para fornecer análises personalizadas e específicas. Se o usuário perguntar sobre dados que não estão registrados, informe educadamente que os dados não foram encontrados e sugira como registrá-los.

PERGUNTA DO USUÁRIO: ${query}

HISTÓRICO DA CONVERSA:
${conversationHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

RESPONDA COMO UM CONSULTOR FINANCEIRO PREMIUM, USANDO OS DADOS REAIS DO USUÁRIO:`;

      const response = await this.callDeepSeekAPI(systemPrompt);
      const parsedResponse = this.parseAIResponse(response);

      return {
        analysisText: parsedResponse.analysisText || response,
        analysisData: parsedResponse.analysisData || null,
        confidence: parsedResponse.confidence || 0.95,
        userDataUsed: {
          name: userData.name,
          hasTransactions: userData.hasTransactions,
          hasInvestments: userData.hasInvestments,
          hasGoals: userData.hasGoals,
          totalTransacoes: userData.totalTransacoes || 0,
          totalInvestimentos: userData.totalInvestimentos || 0,
          totalMetas: userData.totalMetas || 0
        }
      };

    } catch (error) {
      console.error('[AIService] Error in advanced financial analysis:', error);
      return {
        analysisText: 'Desculpe, ocorreu um erro ao processar sua análise financeira. Por favor, tente novamente.',
        analysisData: null,
        confidence: 0.5
      };
    }
  }

  // MÉTODO PARA ORIENTAÇÃO DA PLATAFORMA
  async getPlatformGuidance(query: string, userContext: any) {
    const startTime = Date.now();
    
    try {
      const platformPrompt = `
        ${CORE_SYSTEM_PROMPT}
        ${SUPPORT_MODULE}
        
        OBJETIVO: Ajudar usuários a navegar e usar eficientemente a plataforma Finnextho.
        
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

  // MÉTODO PARA RESPOSTA PERSONALIZADA COM CONTEXTO DO USUÁRIO
  async getPersonalizedResponseWithContext(
    userId: string,
    query: string,
    conversationHistory: ChatMessage[],
    userContext: any
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

      // Adicionar dados do usuário ao prompt
      const userDataPrompt = `
        === DADOS DO USUÁRIO ===
        Nome: ${userContext.name || 'Usuário'}
        Transações: ${userContext.hasTransactions ? `${userContext.totalTransacoes} transações registradas` : 'Nenhuma transação registrada'}
        Investimentos: ${userContext.hasInvestments ? `${userContext.totalInvestimentos} investimentos registrados` : 'Nenhum investimento registrado'}
        Metas: ${userContext.hasGoals ? `${userContext.totalMetas} metas definidas` : 'Nenhuma meta definida'}

        ${userContext.hasTransactions && userContext.transacoes ? `
        === RESUMO DAS TRANSAÇÕES ===
        Total: ${userContext.transacoes.total}
        Categorias: ${JSON.stringify(userContext.transacoes.categorias)}
        Últimas transações: ${JSON.stringify(userContext.transacoes.ultimas)}
        ` : ''}

        ${userContext.hasInvestments && userContext.investimentos ? `
        === RESUMO DOS INVESTIMENTOS ===
        Total: ${userContext.investimentos.total}
        Tipos: ${JSON.stringify(userContext.investimentos.tipos)}
        Últimos investimentos: ${JSON.stringify(userContext.investimentos.ultimos)}
        ` : ''}

        ${userContext.hasGoals && userContext.metas ? `
        === RESUMO DAS METAS ===
        Total: ${userContext.metas.total}
        Status: ${JSON.stringify(userContext.metas.status)}
        Metas ativas: ${JSON.stringify(userContext.metas.ativas)}
        ` : ''}
      `;

      // Usar o prompt personalizado no contexto
      const systemPrompt = `
        Você é o Finn, assistente financeiro da Finnextho. Seja amigável, direto e natural nas respostas.
        
        ${userDataPrompt}
        
        IMPORTANTE: 
        - Use os dados do usuário quando disponíveis
        - Responda de forma conversacional e natural
        - Não mencione estruturas técnicas ou metodologias
        - Mantenha respostas concisas e úteis
        - Se o usuário perguntar sobre dados que não estão registrados, informe educadamente e sugira como registrá-los
      `;

      return await this.generateContextualResponse(
        systemPrompt,
        query,
        conversationHistory,
        userContext
      );
    } catch (error) {
      console.error('Erro ao gerar resposta personalizada:', error);
      throw new AppError(500, 'Erro ao gerar resposta personalizada');
    }
  }

  // MÉTODO PARA RESPOSTA PERSONALIZADA (ORIGINAL)
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
        
        ${CORE_SYSTEM_PROMPT}
        
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

  // MÉTODOS AUXILIARES MANTIDOS
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

      // Processar feedback no sistema de aprendizado
      await this.feedbackLearner.processFeedback(userId, {
        originalMessage: feedback.context,
        originalResponse: '',
        rating: feedback.rating as 1 | 2 | 3 | 4 | 5,
        comments: feedback.comment || ''
      });

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

  // NOVO MÉTODO PARA OBTER MELHORIAS SUGERIDAS (SIMPLIFICADO)
  async getSuggestedImprovements(): Promise<any[]> {
    return [];
  }

  // NOVO MÉTODO: Streaming de Respostas
  async generateStreamingResponse(
    responseType: 'basic' | 'premium',
    userMessage: string,
    conversationHistory: ChatMessage[],
    userContext?: any
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const systemPrompt = responseType === 'premium' 
      ? this.PREMIUM_SYSTEM_PROMPT 
      : this.BASIC_SYSTEM_PROMPT;

    const contextPrompt = this.buildContextPrompt(userContext, conversationHistory);
    const fullPrompt = `${systemPrompt}\n\n${contextPrompt}\n\nUsuário: ${userMessage}\n\nAssistente:`;

    return this.streamFromDeepSeek(fullPrompt);
  }

  private async *streamFromDeepSeek(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Erro no streaming da DeepSeek:', error);
      yield 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.';
    }
  }

  private buildContextPrompt(userContext?: any, conversationHistory: ChatMessage[] = []): string {
    let contextPrompt = '';

    // Adicionar contexto do usuário
    if (userContext) {
      contextPrompt += `\nContexto do usuário:\n`;
      if (userContext.userData) {
        contextPrompt += `- Nome: ${userContext.userData.name}\n`;
        contextPrompt += `- Plano: ${userContext.userData.subscriptionPlan || 'Gratuito'}\n`;
        contextPrompt += `- Premium: ${userContext.userData.isPremium ? 'Sim' : 'Não'}\n`;
        contextPrompt += `- Tem transações: ${userContext.userData.hasTransactions ? 'Sim' : 'Não'}\n`;
        contextPrompt += `- Tem investimentos: ${userContext.userData.hasInvestments ? 'Sim' : 'Não'}\n`;
        contextPrompt += `- Tem metas: ${userContext.userData.hasGoals ? 'Sim' : 'Não'}\n`;
      }

      if (userContext.financialData) {
        if (userContext.financialData.transactions) {
          contextPrompt += `\nResumo de transações:\n`;
          contextPrompt += `- Total: ${userContext.financialData.transactions.total}\n`;
          contextPrompt += `- Categorias: ${Object.keys(userContext.financialData.transactions.categorias).join(', ')}\n`;
        }

        if (userContext.financialData.investments) {
          contextPrompt += `\nResumo de investimentos:\n`;
          contextPrompt += `- Total: ${userContext.financialData.investments.total}\n`;
          contextPrompt += `- Tipos: ${Object.keys(userContext.financialData.investments.tipos).join(', ')}\n`;
        }

        if (userContext.financialData.goals) {
          contextPrompt += `\nResumo de metas:\n`;
          contextPrompt += `- Total: ${userContext.financialData.goals.total}\n`;
          contextPrompt += `- Ativas: ${userContext.financialData.goals.ativas?.length || 0}\n`;
        }
      }
    }

    // Adicionar histórico recente da conversa
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6); // Últimas 6 mensagens
      contextPrompt += `\n\nHistórico recente da conversa:\n`;
      recentHistory.forEach(msg => {
        const role = msg.sender === 'user' ? 'Usuário' : 'Assistente';
        contextPrompt += `${role}: ${msg.content}\n`;
      });
    }

    return contextPrompt;
  }
}

export default AIService;

/*
=== EXEMPLOS DE USO DO NOVO SISTEMA FINN ===

// 1. Uso básico com o novo sistema
const aiService = new AIService();

// Resposta automática usando o Finn Engine
const response = await aiService.generateContextualResponse(
  '', // systemPrompt vazio ativa o Finn
  'Como cadastrar uma transação?',
  [], // conversationHistory
  { userId: 'user123', subscriptionPlan: 'essencial' }
);

// 2. Análise financeira avançada para usuários premium
const premiumAnalysis = await aiService.getAdvancedFinancialAnalysis(
  JSON.stringify({
    name: 'João Silva',
    subscriptionPlan: 'top',
    hasInvestments: true,
    hasGoals: true,
    portfolioValue: 50000
  }),
  'Como rebalancear minha carteira?',
  []
);

// 3. Orientação da plataforma
const guidance = await aiService.getPlatformGuidance(
  'Onde encontro meus relatórios?',
  { subscriptionPlan: 'essencial' }
);

// 4. Resposta personalizada baseada em feedback
const personalized = await aiService.getPersonalizedResponse(
  'user123',
  'Quais investimentos são melhores para mim?',
  []
);

// 5. Sistema de feedback
await aiService.saveUserFeedback('user123', 'msg456', {
  rating: 5,
  helpful: true,
  comment: 'Resposta muito clara e útil!',
  category: 'helpfulness',
  context: 'Como investir melhor?'
});

// 6. Analytics de feedback
const analytics = await aiService.getUserFeedbackAnalytics('user123');

// 7. Sugestões de melhoria
const improvements = await aiService.getSuggestedImprovements();

=== CARACTERÍSTICAS DO NOVO SISTEMA ===

✅ Sistema de prompts modular e especializado
✅ Memória contextual por usuário
✅ Personalização baseada em feedback
✅ Módulos específicos para cada tipo de pergunta
✅ Sistema de aprendizado contínuo
✅ Análises premium para usuários Top/Enterprise
✅ Orientação da plataforma inteligente
✅ Proibições para evitar respostas indesejadas
✅ Templates de resposta estruturados
✅ Adaptação automática ao nível do usuário

=== MÓDULOS DISPONÍVEIS ===

1. INVESTMENT_MODULE - Para perguntas sobre investimentos
2. GOALS_MODULE - Para metas financeiras
3. SUPPORT_MODULE - Para suporte técnico
4. EDUCATION_MODULE - Para educação financeira
5. PREMIUM_MODULE - Para análises avançadas (usuários Top/Enterprise)

=== FLUXO DE FUNCIONAMENTO ===

1. Usuário envia mensagem
2. Sistema identifica o tipo de pergunta
3. Carrega módulos relevantes
4. Aplica contexto do usuário
5. Gera resposta personalizada
6. Atualiza memória contextual
7. Coleta feedback (opcional)
8. Aprende e melhora continuamente
*/
