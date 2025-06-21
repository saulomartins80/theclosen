// backend/src/services/aiService.ts
import OpenAI from 'openai';
import { AppError } from '../core/errors/AppError';
import { MarketService } from './marketService';
import { ChatMessage } from '../types/chat';

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY não está configurada no ambiente');
}

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1', // URL base do DeepSeek
});

class AIService {
  private marketService: MarketService;

  constructor() {
    this.marketService = new MarketService();
  }

  async generateContextualResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: ChatMessage[]
  ) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages as any,
        temperature: 0.7,
      });

      return {
        text: completion.choices[0]?.message?.content || '',
        analysisData: null
      };
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
    try {
      const messages = [
        {
          role: 'system',
          content: `Você é um analista financeiro especializado. Use o seguinte contexto para sua análise: ${context}`
        },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: query }
      ];

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages as any,
        temperature: 0.7,
      });

      return {
        analysisText: completion.choices[0]?.message?.content || '',
        analysisData: null
      };
    } catch (error) {
      console.error('Erro ao gerar análise financeira:', error);
      throw new AppError(500, 'Erro ao processar sua análise. Por favor, tente novamente mais tarde.');
    }
  }

  async getMarketOverview() {
    return this.marketService.getMarketOverview();
  }

  async generateFollowUpQuestions(
    originalQuery: string,
    aiResponse: string
  ): Promise<string[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: 'Gere 3 perguntas de acompanhamento relevantes baseadas na consulta original e na resposta fornecida.'
        },
        {
          role: 'user',
          content: `Consulta original: ${originalQuery}\nResposta: ${aiResponse}`
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages as any,
        temperature: 0.7,
      });

      const followUps = completion.choices[0]?.message?.content || '';
      return followUps.split('\n').filter(q => q.trim());
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
      // Fallback para resposta em texto puro
      return { text: responseContent.trim() };
    }
  }
}

export default AIService;