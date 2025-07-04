import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Transacoes } from '../models/Transacoes';
import Investimento from '../models/Investimento';
import { Goal } from '../models/Goal';
import AIService from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';

const aiService = new AIService();

// Interfaces para tipos de payload
interface TransactionPayload {
  valor: number;
  descricao: string;
  tipo: string;
  categoria: string;
  conta: string;
  data: string;
}

interface InvestmentPayload {
  nome: string;
  valor: number;
  tipo: string;
  data: string;
  instituicao?: string;
}

interface GoalPayload {
  meta: string;
  valor_total: number;
  data_conclusao: string;
  categoria: string;
}

interface AnalysisPayload {
  analysisType: string;
}

interface ReportPayload {
  reportType: string;
}

interface DetectedAction {
  type: 'CREATE_TRANSACTION' | 'CREATE_INVESTMENT' | 'CREATE_GOAL' | 'ANALYZE_DATA' | 'GENERATE_REPORT' | 'UNKNOWN';
  payload: TransactionPayload | InvestmentPayload | GoalPayload | AnalysisPayload | ReportPayload | {};
  confidence: number;
  requiresConfirmation: boolean;
  successMessage: string;
  errorMessage: string;
  response: string;
  followUpQuestions?: string[];
}

// Prompt para detecção de ações automatizadas
const ACTION_DETECTION_PROMPT = `Você é um assistente financeiro amigável e humanizado. Analise a mensagem do usuário e identifique se ele quer:

CRIAR META:
- "Quero juntar R$ X para Y" → CREATE_GOAL (se X e Y estiverem claros)
- "Meta de R$ X para Y" → CREATE_GOAL (se X e Y estiverem claros)
- "Quero economizar R$ X" → CREATE_GOAL (se X estiver claro)
- "Preciso guardar R$ X" → CREATE_GOAL (se X estiver claro)
- "estou querendo add uma nova meta" → CREATE_GOAL (solicitar detalhes)
- "quero criar uma meta" → CREATE_GOAL (solicitar detalhes)

CRIAR TRANSAÇÃO:
- "Gastei R$ X no Y" → CREATE_TRANSACTION (se X e Y estiverem claros)
- "Recebi salário de R$ X" → CREATE_TRANSACTION (se X estiver claro)
- "Paguei conta de Y R$ X" → CREATE_TRANSACTION (se X e Y estiverem claros)
- "Comprei X por R$ Y" → CREATE_TRANSACTION (se X e Y estiverem claros)
- "estou querendo add uma nova transação" → CREATE_TRANSACTION (solicitar detalhes)
- "quero registrar uma transação" → CREATE_TRANSACTION (solicitar detalhes)
- "quero registrar um despesa" → CREATE_TRANSACTION (solicitar detalhes)

CRIAR INVESTIMENTO:
- "Comprei ações da X por R$ Y" → CREATE_INVESTMENT (se X e Y estiverem claros)
- "Investi R$ X em Y" → CREATE_INVESTMENT (se X e Y estiverem claros)
- "Apliquei R$ X em Y" → CREATE_INVESTMENT (se X e Y estiverem claros)
- "estou querendo add um novo investimento" → CREATE_INVESTMENT (solicitar detalhes)
- "quero criar um investimento" → CREATE_INVESTMENT (solicitar detalhes)

CONTINUAÇÃO DE CONVERSAS:
- Se o usuário mencionar "valor é X reais" e na conversa anterior foi mencionada uma transação → CREATE_TRANSACTION
- Se o usuário disser "é uma despesa" e na conversa anterior foi mencionada uma transação → CREATE_TRANSACTION
- Se o usuário disser "outras informações já passei" → usar contexto da conversa anterior

REGRAS CRÍTICAS:
1. SEMPRE ser natural e humanizado nas respostas
2. NUNCA repetir o nome do usuário em todas as mensagens
3. Se o usuário só mencionar a intenção sem detalhes, SEMPRE perguntar de forma natural:
   - Para metas: "Que legal! Qual valor você quer juntar e para qual objetivo?"
   - Para transações: "Perfeito! Qual valor e o que foi essa transação?"
   - Para investimentos: "Ótimo! Qual valor, tipo e nome do investimento?"
4. Evitar ser robótico - ser conversacional e amigável
5. Manter respostas naturais e humanizadas
6. IMPORTANTE: Se o usuário mencionar "outras informações já passei" ou "já te passei antes", considerar o contexto da conversa anterior
7. Para cumprimentos simples como "oi", "tudo bem", "boa noite", retornar UNKNOWN com resposta natural

CONFIRMAÇÕES E CONTINUAÇÕES:
- "vamos nessa" → UNKNOWN (confirmação)
- "ok" → UNKNOWN (confirmação)
- "sim" → UNKNOWN (confirmação)
- "claro" → UNKNOWN (confirmação)

PERGUNTAS E DÚVIDAS:
- "como funciona" → UNKNOWN (dúvida)
- "o que posso fazer" → UNKNOWN (dúvida)
- "tudo bem" → UNKNOWN (cumprimento)
- "tudo joia" → UNKNOWN (cumprimento)
- "beleza" → UNKNOWN (cumprimento)
- "tudo certo" → UNKNOWN (cumprimento)
- "oi" → UNKNOWN (cumprimento)
- "boa noite" → UNKNOWN (cumprimento)
- "bom dia" → UNKNOWN (cumprimento)

EXTRAGA as seguintes informações:
- intent: tipo de ação (CREATE_TRANSACTION, CREATE_INVESTMENT, CREATE_GOAL, ANALYZE_DATA, GENERATE_REPORT, UNKNOWN)
- entities: dados extraídos em formato JSON
- confidence: confiança da detecção (0.0 a 1.0)
- response: resposta natural e humanizada SEMPRE perguntando detalhes se faltar informação
- requiresConfirmation: SEMPRE true se faltar detalhes essenciais

Para metas, extraia:
- valor_total: valor total da meta (só se mencionado)
- meta: descrição da meta (só se mencionado)
- data_conclusao: prazo (só se mencionado)
- categoria: tipo da meta (só se mencionado)

Para transações, extraia:
- valor: valor da transação (só se mencionado)
- descricao: descrição (só se mencionado)
- tipo: receita/despesa (só se mencionado)
- categoria: categoria (só se mencionado)

Para investimentos, extraia:
- nome: nome do investimento (só se mencionado)
- valor: valor investido (só se mencionado)
- tipo: tipo do investimento (só se mencionado)

RESPONDA APENAS COM JSON válido.`;

// Função para detectar intenção do usuário
export async function detectUserIntent(message: string, userContext: any, conversationHistory?: any[]): Promise<DetectedAction | null> {
  try {
    console.log('[DETECT_USER_INTENT] Analyzing message:', message);
    
    // Analisar contexto da conversa para entender melhor
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-3); // Últimas 3 mensagens
      conversationContext = `\n\nContexto da conversa recente:\n${recentMessages.map((msg, index) => 
        `${index + 1}. ${msg.sender === 'user' ? 'Usuário' : 'Bot'}: ${msg.content}`
      ).join('\n')}`;
    }
    
    const prompt = `${ACTION_DETECTION_PROMPT}

Contexto do usuário:
- Nome: ${userContext.name}
- Plano: ${userContext.subscriptionPlan}
- Transações: ${userContext.totalTransacoes}
- Investimentos: ${userContext.totalInvestimentos}
- Metas: ${userContext.totalMetas}${conversationContext}

Mensagem do usuário: "${message}"

IMPORTANTE: Se o usuário mencionar "outras informações já passei", "já te passei antes", "valor é X reais", ou "é uma despesa", considere o contexto da conversa anterior para completar as informações faltantes.

Analise a mensagem e retorne um JSON com:
- intent: tipo de ação (CREATE_TRANSACTION, CREATE_INVESTMENT, CREATE_GOAL, ANALYZE_DATA, GENERATE_REPORT, UNKNOWN)
- entities: dados extraídos (valor, descrição, categoria, prazo, etc.)
- confidence: confiança da detecção (0.0 a 1.0)
- response: resposta natural
- requiresConfirmation: se precisa confirmação

Exemplos de detecção:
- "Quero juntar R$ 5000 para uma viagem" → CREATE_GOAL com valor=5000, descrição="Viagem"
- "Gastei R$ 100 no mercado" → CREATE_TRANSACTION com valor=100, categoria="Alimentação"
- "Comprei ações da Petrobras" → CREATE_INVESTMENT com tipo="Ações", nome="Petrobras"
- "o valor é 310 reais" + contexto anterior de transação → CREATE_TRANSACTION com valor=310
- "é uma despesa" + contexto anterior de transação → CREATE_TRANSACTION com tipo="despesa"

JSON:`;

    const aiResponse = await aiService.detectAutomatedAction(prompt);
    console.log('[DETECT_USER_INTENT] Raw AI response:', aiResponse);
    
    // Se a intenção é UNKNOWN, retornar a resposta da IA mas sem ação
    if (!aiResponse || aiResponse.intent === 'UNKNOWN') {
      console.log('[DETECT_USER_INTENT] UNKNOWN intent, returning response only');
      return {
        type: 'UNKNOWN' as any,
        payload: {},
        confidence: aiResponse?.confidence || 0.0,
        requiresConfirmation: false,
        successMessage: '',
        errorMessage: '',
        response: aiResponse?.response || 'Olá! Como posso te ajudar hoje?'
      };
    }

    if (!aiResponse.intent) {
      console.log('[DETECT_USER_INTENT] No valid intent detected');
      return null;
    }

    // Mapear entidades para payload
    let payload: any = {};
    let successMessage = '';
    let errorMessage = '';

    switch (aiResponse.intent) {
      case 'CREATE_TRANSACTION':
        payload = mapTransactionData(aiResponse.entities);
        successMessage = `Perfeito! Registrei sua transação: ${payload.descricao || 'Nova transação'} - R$ ${payload.valor}`;
        errorMessage = 'Ops! Tive um problema ao registrar sua transação. Pode tentar novamente?';
        break;
        
      case 'CREATE_INVESTMENT':
        payload = mapInvestmentData(aiResponse.entities);
        successMessage = `Excelente! Investimento registrado: ${payload.nome || 'Novo investimento'} - R$ ${payload.valor}`;
        errorMessage = 'Ops! Tive um problema ao registrar seu investimento. Pode tentar novamente?';
        break;
        
      case 'CREATE_GOAL':
        payload = mapGoalData(aiResponse.entities);
        successMessage = `Que legal! Meta criada: ${payload.meta || 'Nova meta'} - R$ ${payload.valor_total}`;
        errorMessage = 'Ops! Tive um problema ao criar sua meta. Pode tentar novamente?';
        break;
        
      case 'ANALYZE_DATA':
        payload = { analysisType: aiResponse.entities.analysisType || 'general' };
        successMessage = 'Pronto! Análise concluída. Dá uma olhada nos resultados no seu dashboard!';
        errorMessage = 'Ops! Tive um problema ao analisar seus dados. Pode tentar novamente?';
        break;
        
      case 'GENERATE_REPORT':
        payload = { reportType: aiResponse.entities.reportType || 'general' };
        successMessage = 'Perfeito! Relatório gerado. Verifique seu email ou dashboard!';
        errorMessage = 'Ops! Tive um problema ao gerar o relatório. Pode tentar novamente?';
        break;
        
      default:
        return null;
    }

    const followUpQuestions = generateFollowUpQuestions(aiResponse.intent, aiResponse.entities);

    const detectedAction: DetectedAction = {
      type: aiResponse.intent as any,
      payload,
      confidence: aiResponse.confidence || 0.8,
      requiresConfirmation: aiResponse.requiresConfirmation || false,
      successMessage,
      errorMessage,
      response: aiResponse.response || '',
      followUpQuestions
    };

    console.log('[DETECT_USER_INTENT] Parsed response:', detectedAction);
    return detectedAction;

  } catch (error) {
    console.error('[DETECT_USER_INTENT] Error detecting intent:', error);
    return null;
  }
} 

// Funções de mapeamento de dados
function mapTransactionData(entities: any): TransactionPayload {
  console.log('[mapTransactionData] Mapping entities:', entities);
  
  // Determinar o tipo baseado na descrição ou contexto
  let tipo = entities.tipo || 'despesa';
  
  // Se não foi especificado, inferir baseado na descrição
  if (!entities.tipo) {
    const descricao = entities.descricao?.toLowerCase() || '';
    if (descricao.includes('salário') || descricao.includes('receita') || descricao.includes('pagamento')) {
    tipo = 'receita';
    } else if (descricao.includes('transferência') || descricao.includes('transferencia')) {
      tipo = 'transferencia';
    } else {
      tipo = 'despesa'; // Padrão
    }
  }
  
  // Determinar categoria baseada na descrição
  let categoria = entities.categoria || 'Outros';
  if (!entities.categoria) {
    const descricao = entities.descricao?.toLowerCase() || '';
    if (descricao.includes('mercado') || descricao.includes('supermercado') || descricao.includes('alimentação') || descricao.includes('gas') || descricao.includes('gás')) {
      categoria = 'Alimentação';
    } else if (descricao.includes('combustível') || descricao.includes('gasolina') || descricao.includes('etanol')) {
      categoria = 'Transporte';
    } else if (descricao.includes('salário') || descricao.includes('receita')) {
      categoria = 'Trabalho';
    } else if (descricao.includes('manutenção') || descricao.includes('manutencao')) {
      categoria = 'Manutenção';
    }
  }
  
  const payload: TransactionPayload = {
    valor: parseFloat(entities.valor) || 0,
    descricao: entities.descricao || 'Transação',
    tipo: tipo,
    categoria: categoria,
    conta: entities.conta || 'Conta Corrente',
    data: entities.data || new Date().toISOString().split('T')[0]
  };
  
  console.log('[mapTransactionData] Mapped payload:', payload);
  return payload;
}

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

function mapGoalData(entities: any): GoalPayload {
  // Função para converter datas naturais para formato válido
  const parseNaturalDate = (dateString: string): string => {
    if (!dateString) {
      // Data padrão: 1 ano a partir de hoje
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      return futureDate.toISOString().split('T')[0];
    }

    const lowerDate = dateString.toLowerCase();
    
    // Mapear datas naturais para datas específicas
    if (lowerDate.includes('final de dezembro') || lowerDate.includes('dezembro')) {
      const year = new Date().getFullYear();
      return `${year}-12-31`;
    }
    
    if (lowerDate.includes('final do ano') || lowerDate.includes('fim do ano')) {
      const year = new Date().getFullYear();
      return `${year}-12-31`;
    }
    
    if (lowerDate.includes('próximo ano') || lowerDate.includes('ano que vem')) {
      const year = new Date().getFullYear() + 1;
      return `${year}-12-31`;
    }
    
    if (lowerDate.includes('6 meses') || lowerDate.includes('seis meses')) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      return futureDate.toISOString().split('T')[0];
    }
    
    if (lowerDate.includes('3 meses') || lowerDate.includes('três meses')) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      return futureDate.toISOString().split('T')[0];
    }
    
    // Se não conseguir mapear, usar data padrão
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate.toISOString().split('T')[0];
  };

  // Se não há dados suficientes, retornar payload vazio
  if (!entities.valor_total || !entities.meta) {
    return {
      meta: '',
      valor_total: 0,
      data_conclusao: parseNaturalDate(entities.data_conclusao),
      categoria: ''
    };
  }

  // Garantir que o valor seja um número válido
  const valor_total = parseFloat(entities.valor_total) || 0;

  return {
    meta: entities.meta || '',
    valor_total: valor_total,
    data_conclusao: parseNaturalDate(entities.data_conclusao),
    categoria: entities.categoria || 'Outros'
  };
}

// Gerar perguntas de acompanhamento
function generateFollowUpQuestions(intent: string, entities: any): string[] {
  const questions = {
    'CREATE_TRANSACTION': [
      'Quer que eu analise seus gastos do mês?',
      'Posso sugerir formas de economizar?',
      'Quer ver um relatório de suas despesas?'
    ],
    'CREATE_INVESTMENT': [
      'Quer que eu analise seu portfólio?',
      'Posso sugerir outros investimentos?',
      'Quer ver a performance dos seus investimentos?'
    ],
    'CREATE_GOAL': [
      'Quer que eu crie um plano de economia?',
      'Posso analisar se a meta é realista?',
      'Quer ver outras metas relacionadas?'
    ],
    'ANALYZE_DATA': [
      'Quer que eu gere um relatório detalhado?',
      'Posso sugerir melhorias?',
      'Quer comparar com períodos anteriores?'
    ]
  };

  return questions[intent as keyof typeof questions] || [];
}

// Função auxiliar para verificar se os dados necessários para a ação foram completos
function hasCompleteData(action: any): boolean {
  switch (action.type) {
    case 'CREATE_TRANSACTION':
      return !!(action.payload.valor && action.payload.descricao && action.payload.tipo);
    case 'CREATE_INVESTMENT':
      return !!(action.payload.valor && action.payload.nome && action.payload.tipo);
    case 'CREATE_GOAL':
      return !!(action.payload.valor_total && action.payload.meta);
    case 'ANALYZE_DATA':
    case 'GENERATE_REPORT':
      return true;
    default:
      return false;
  }
}

// Controller principal para ações automatizadas
export const handleAutomatedActions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;
    const { message, chatId, context } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    if (!message) {
      res.status(400).json({ success: false, message: 'Mensagem é obrigatória' });
      return;
    }

    // Buscar dados do usuário
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return;
    }

    // Buscar dados financeiros do usuário
    const [transacoes, investimentos, metas] = await Promise.all([
      Transacoes.find({ userId: user._id }),
      Investimento.find({ userId: user._id }),
      Goal.find({ userId: user._id })
    ]);

    const userContext = {
      name: user.name || 'Usuário',
      email: user.email || '',
      subscriptionPlan: user.subscription?.plan || 'Gratuito',
      subscriptionStatus: user.subscription?.status || 'inactive',
      hasTransactions: transacoes.length > 0,
      hasInvestments: investimentos.length > 0,
      hasGoals: metas.length > 0,
      totalTransacoes: transacoes.length,
      totalInvestimentos: investimentos.length,
      totalMetas: metas.length,
      // Dados reais das coleções
      transacoes: transacoes,
      investimentos: investimentos,
      metas: metas,
      // Resumos dos dados
      resumoTransacoes: transacoes.length > 0 ? {
        total: transacoes.length,
        categorias: transacoes.reduce((acc: any, t: any) => {
          const cat = t.categoria || 'Sem categoria';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {}),
        ultimas: transacoes.slice(-5).map(t => ({
          descricao: t.descricao,
          valor: t.valor,
          categoria: t.categoria,
          tipo: t.tipo,
          data: t.data
        }))
      } : null,
      resumoInvestimentos: investimentos.length > 0 ? {
        total: investimentos.length,
        tipos: investimentos.reduce((acc: any, i: any) => {
          const tipo = i.tipo || 'Sem tipo';
          acc[tipo] = (acc[tipo] || 0) + 1;
          return acc;
        }, {}),
        ultimos: investimentos.slice(-5).map(i => ({
          nome: i.nome,
          valor: i.valor,
          tipo: i.tipo,
          data: i.data
        }))
      } : null,
      resumoMetas: metas.length > 0 ? {
        total: metas.length,
        status: metas.reduce((acc: any, m: any) => {
          const status = m.prioridade || 'media';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        ativas: metas.filter((m: any) => m.valor_atual < m.valor_total).slice(-5).map(m => ({
          titulo: m.meta,
          valor: m.valor_total,
          valorAtual: m.valor_atual,
          prazo: m.data_conclusao,
          prioridade: m.prioridade
        }))
      } : null
    };

    console.log('[AUTOMATED_ACTIONS] Contexto do usuário construído:', {
      name: userContext.name,
      subscriptionPlan: userContext.subscriptionPlan,
      subscriptionStatus: userContext.subscriptionStatus,
      totalTransacoes: userContext.totalTransacoes,
      totalInvestimentos: userContext.totalInvestimentos,
      totalMetas: userContext.totalMetas,
      hasTransactions: userContext.hasTransactions,
      hasInvestments: userContext.hasInvestments,
      hasGoals: userContext.hasGoals
    });

    // Detectar ação automatizada
    const detectedAction = await detectUserIntent(message, userContext);
    
    console.log('[AUTOMATED_ACTIONS] Detected action:', JSON.stringify(detectedAction, null, 2));
    console.log('[AUTOMATED_ACTIONS] Confidence threshold check:', detectedAction?.confidence && detectedAction.confidence > 0.85);

    if (detectedAction && detectedAction.confidence && detectedAction.confidence > 0.85) {
      console.log('[AUTOMATED_ACTIONS] High confidence action detected, executing automatically');
      
      // ✅ NOVA LÓGICA: Executar automaticamente se confiança é alta
      try {
        let result;
        switch (detectedAction.type) {
          case 'CREATE_TRANSACTION':
            result = await createTransaction(user._id.toString(), detectedAction.payload);
            break;
          case 'CREATE_INVESTMENT':
            result = await createInvestment(user._id.toString(), detectedAction.payload);
            break;
          case 'CREATE_GOAL':
            result = await createGoal(user._id.toString(), detectedAction.payload);
            break;
          case 'ANALYZE_DATA':
            result = await analyzeData(user._id.toString(), detectedAction.payload);
            break;
          case 'GENERATE_REPORT':
            result = await generateReport(user._id.toString(), detectedAction.payload);
            break;
          default:
            throw new Error('Ação não suportada');
        }

        // Retornar sucesso com confirmação natural
        res.status(200).json({
          success: true,
          type: 'ACTION_DETECTED',
          text: detectedAction.successMessage,
          automatedAction: {
            ...detectedAction,
            executed: true,
            result: result
          }
        });
        return;
      } catch (actionError) {
        console.error('[AUTOMATED_ACTIONS] Error executing action:', actionError);
        // Se falhar, retornar para confirmação manual
        res.status(200).json({
          success: true,
          type: 'ACTION_DETECTED',
          text: 'Detectei uma ação que posso executar. Quer que eu tente novamente?',
          automatedAction: {
            ...detectedAction,
            executed: false,
            error: String(actionError)
          }
        });
        return;
      }
    } else if (detectedAction && detectedAction.confidence && detectedAction.confidence > 0.7) {
      console.log('[AUTOMATED_ACTIONS] Medium confidence action, returning for confirmation');
      // Confiança média - retornar para confirmação
      res.status(200).json({
        success: true,
        type: 'ACTION_DETECTED',
        text: detectedAction.successMessage,
        automatedAction: detectedAction
      });
      return;
    } else {
      console.log('[AUTOMATED_ACTIONS] Processing as normal chat message');
      // Processar como mensagem normal do chatbot
      try {
        const response = await aiService.generateContextualResponse(
          '', // systemPrompt vazio ativa o FinnEngine
          message,
          [],
          userContext // Passar contexto completo do usuário
        );

        res.status(200).json({
          success: true,
          type: 'TEXT_RESPONSE',
          text: response.text || 'Olá! Como posso te ajudar hoje?',
          messageId: uuidv4()
        });
        return;
      } catch (aiError) {
        console.error('Erro ao gerar resposta da IA:', aiError);
        // Fallback para resposta simples
        res.status(200).json({
          success: true,
          type: 'TEXT_RESPONSE',
          text: 'Olá! Como posso te ajudar hoje?',
          messageId: uuidv4()
        });
        return;
      }
    }
  } catch (error) {
    console.error('Erro no processamento automático:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar solicitação' 
    });
    return;
  }
};

// Executar ação confirmada
export const executeAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;
    const { action, payload, chatId } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return;
    }

    let result;

    switch (action) {
      case 'CREATE_TRANSACTION':
        result = await createTransaction(user._id.toString(), payload);
        break;
      case 'CREATE_INVESTMENT':
        result = await createInvestment(user._id.toString(), payload);
        break;
      case 'CREATE_GOAL':
        result = await createGoal(user._id.toString(), payload);
        break;
      case 'ANALYZE_DATA':
        result = await analyzeData(user._id.toString(), payload);
        break;
      case 'GENERATE_REPORT':
        result = await generateReport(user._id.toString(), payload);
        break;
      default:
        res.status(400).json({ success: false, message: 'Ação não suportada' });
        return;
    }

    res.status(200).json({
      success: true,
      message: 'Ação executada com sucesso',
      data: result
    });
    return;

  } catch (error) {
    console.error('Erro ao executar ação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao executar ação' 
    });
    return;
  }
};

// Funções auxiliares para executar ações
export async function createTransaction(userId: string, payload: any) {
  const transacao = new Transacoes({
    userId,
    ...payload,
    createdAt: new Date()
  });
  
  await transacao.save();
  return transacao;
}

export async function createInvestment(userId: string, payload: any) {
  // Validar e mapear o tipo de investimento
  const tipoMapping: { [key: string]: string } = {
    'criptomoeda': 'Criptomoedas',
    'criptomoedas': 'Criptomoedas',
    'crypto': 'Criptomoedas',
    'bitcoin': 'Criptomoedas',
    'btc': 'Criptomoedas',
    'tesouro': 'Tesouro Direto',
    'tesouro direto': 'Tesouro Direto',
    'acoes': 'Ações',
    'ações': 'Ações',
    'fii': 'Fundos Imobiliários',
    'fundos imobiliarios': 'Fundos Imobiliários',
    'fundos imobiliário': 'Fundos Imobiliários',
    'fundos imobiliários': 'Fundos Imobiliários',
    'fundos imobiliario': 'Fundos Imobiliários', // Adicionado sem acento
    'previdencia': 'Previdência Privada',
    'previdência': 'Previdência Privada',
    'etf': 'ETF',
    'internacional': 'Internacional',
    'renda variavel': 'Renda Variável',
    'renda variável': 'Renda Variável',
    'renda fixa': 'Renda Fixa',
    'cdb': 'CDB',
    'lci': 'LCI',
    'lca': 'LCA',
    'cdi': 'CDI'
  };

  // Mapear o tipo se necessário
  let tipo = payload.tipo;
  if (tipoMapping[tipo.toLowerCase()]) {
    tipo = tipoMapping[tipo.toLowerCase()];
  }

  // Validar valor mínimo
  const valor = parseFloat(payload.valor) || 0;
  if (valor < 0.01) {
    throw new Error('O valor do investimento deve ser maior que R$ 0,01');
  }

  // Validar se o tipo é válido
  const tiposValidos = [
    'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários',
    'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável',
    'CDB', 'LCI', 'LCA', 'CDI', 'Poupança', 'Fundos de Investimento',
    'Debêntures', 'CRI', 'CRA', 'Letras de Câmbio', 'Certificados de Operações Estruturadas',
    'Fundos Multimercado', 'Fundos de Ações', 'Fundos Cambiais', 'Fundos de Renda Fixa',
    'Fundos de Previdência', 'Fundos de Investimento Imobiliário'
  ];
  
  if (!tiposValidos.includes(tipo)) {
    throw new Error(`Tipo de investimento inválido. Tipos válidos: ${tiposValidos.join(', ')}`);
  }

  const investimento = new Investimento({
    userId,
    nome: payload.nome || 'Investimento',
    tipo,
    valor,
    data: payload.data ? new Date(payload.data) : new Date(),
    instituicao: payload.instituicao,
    createdAt: new Date()
  });
  
  await investimento.save();
  return investimento;
}

export async function createGoal(userId: string, payload: any) {
  const goal = new Goal({
    userId,
    ...payload,
    valor_atual: 0,
    prioridade: 'media',
    createdAt: new Date()
  });
  
  await goal.save();
  return goal;
}

export async function analyzeData(userId: string, payload: any) {
  // Implementar análise de dados
  const [transacoes, investimentos, metas] = await Promise.all([
    Transacoes.find({ userId }),
    Investimento.find({ userId }),
    Goal.find({ userId })
  ]);

  return {
    analysisType: payload.analysisType,
    summary: {
      totalTransacoes: transacoes.length,
      totalInvestimentos: investimentos.length,
      valorTotalInvestido: investimentos.reduce((sum, inv) => sum + inv.valor, 0),
      valorTotalMetas: metas.reduce((sum, meta) => sum + meta.valor_total, 0)
    }
  };
}

export async function generateReport(userId: string, payload: any) {
  // Implementar geração de relatório
  const analysis = await analyzeData(userId, payload);
  
  return {
    reportId: uuidv4(),
    generatedAt: new Date(),
    type: payload.reportType || 'general',
    data: analysis
  };
} 