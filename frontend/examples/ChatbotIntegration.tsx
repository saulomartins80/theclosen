import React, { useState } from 'react';
import ChatbotAdvanced from '../components/ChatbotAdvanced';
import { useAuth } from '../context/AuthContext';

// Exemplo de integração do ChatbotAdvanced
export default function ChatbotIntegration() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, subscription } = useAuth();

  // Verificar se o usuário está logado
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Faça login para acessar o chatbot</h2>
          <p className="text-gray-600">O assistente Finn está disponível para usuários logados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header da página */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Finnextho Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bem-vindo, {user.displayName || user.email}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status do plano */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Plano: {subscription?.plan || 'Gratuito'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status: {subscription?.status || 'Inativo'}
                </p>
              </div>
              
              {/* Botão para abrir chat manualmente */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Abrir Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card de informações do usuário */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Usuário
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</label>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome:</label>
                <p className="text-gray-900 dark:text-white">{user.displayName || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plano Atual:</label>
                <p className="text-gray-900 dark:text-white">{subscription?.plan || 'Gratuito'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  subscription?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscription?.status || 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Card de funcionalidades do chatbot */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assistente Finn
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                O Finn é seu assistente financeiro inteligente, disponível 24/7 para ajudar com:
              </p>
              
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Dúvidas sobre a plataforma
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Conceitos financeiros
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Análise de investimentos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Planejamento de metas
                </li>
                {subscription?.status === 'active' && (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Análises premium personalizadas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Consultoria financeira avançada
                    </li>
                  </>
                )}
              </ul>

              <div className="pt-4">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  Conversar com o Finn
                </button>
              </div>
            </div>
          </div>

          {/* Card de estatísticas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estatísticas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">24/7</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Disponibilidade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">5s</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tempo Médio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">50k+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Usuários</div>
              </div>
            </div>
          </div>

          {/* Card de recursos premium */}
          {subscription?.status === 'active' && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700 p-6">
              <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                🏆 Recursos Premium
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">✨</span>
                  <span className="text-sm text-purple-800 dark:text-purple-200">
                    Análises personalizadas de investimentos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">📊</span>
                  <span className="text-sm text-purple-800 dark:text-purple-200">
                    Relatórios avançados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">🎯</span>
                  <span className="text-sm text-purple-800 dark:text-purple-200">
                    Metas ilimitadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">🚀</span>
                  <span className="text-sm text-purple-800 dark:text-purple-200">
                    Suporte prioritário
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção de dicas */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 Dicas para usar o Finn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🎯</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Seja Específico</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Quanto mais específica sua pergunta, melhor será a resposta do Finn
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 dark:text-green-400 text-xl">📈</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Use o Feedback</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Avalie as respostas para ajudar o Finn a melhorar continuamente
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 dark:text-purple-400 text-xl">🔄</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Mantenha Contexto</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                O Finn lembra do histórico da conversa para respostas mais precisas
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Chatbot Advanced */}
      <ChatbotAdvanced 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />
    </div>
  );
}

// Exemplo de uso em uma página específica
export function DashboardPage() {
  return (
    <div>
      <ChatbotIntegration />
    </div>
  );
}

// Exemplo de uso em layout global
export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header global */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Finnextho
            </h1>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsChatOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <span>💬</span>
                Assistente
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main>
        {children}
      </main>

      {/* Chatbot global */}
      <ChatbotAdvanced 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />
    </div>
  );
} 