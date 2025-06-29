import axios from 'axios';
import { getAuth, getIdToken } from 'firebase/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-hzmhqdxnw-saulomartins80s-projects.vercel.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autenticação
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      const token = await getIdToken(user, true);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      throw new Error('Falha na autenticação');
    }
  }

  return config;
});

// Métodos de exclusão para o chatbot
export const chatbotDeleteAPI = {
  deleteSession: async (chatId: string) => {
    console.log('[chatbotDeleteAPI] Deletando sessão:', chatId);
    try {
      const response = await api.delete(`/api/chatbot/sessions/${chatId}`);
      console.log('[chatbotDeleteAPI] Sessão deletada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotDeleteAPI] Erro ao deletar sessão:', error);
      throw error;
    }
  },
  
  deleteAllSessions: async () => {
    console.log('[chatbotDeleteAPI] Deletando todas as sessões');
    try {
      const response = await api.delete('/api/chatbot/sessions');
      console.log('[chatbotDeleteAPI] Todas as sessões deletadas com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotDeleteAPI] Erro ao deletar todas as sessões:', error);
      throw error;
    }
  }
}; 