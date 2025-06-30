import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sanitizeInput, validateMessageSize, validateTokenFormat, logSuspiciousActivity, SECURITY_CONFIG } from '../utils/security';

interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  message?: string;
  chunkNumber?: number;
  processingTime?: number;
  totalChunks?: number;
  error?: string;
}

interface UseChatStreamReturn {
  streamData: string;
  isStreaming: boolean;
  error: string | null;
  startStream: (message: string, chatId: string) => Promise<void>;
  stopStream: () => void;
  resetStream: () => void;
}

export function useChatStream(): UseChatStreamReturn {
  const [streamData, setStreamData] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();

  const startStream = useCallback(async (message: string, chatId: string) => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    // Validações de segurança
    if (!message || !chatId) {
      setError('Mensagem e chatId são obrigatórios');
      return;
    }

    // Sanitizar input
    const sanitizedMessage = sanitizeInput(message);
    const sanitizedChatId = sanitizeInput(chatId);

    if (!sanitizedMessage || !sanitizedChatId) {
      setError('Dados inválidos detectados');
      logSuspiciousActivity('Input inválido detectado', { message, chatId });
      return;
    }

    // Validar tamanho da mensagem
    if (!validateMessageSize(sanitizedMessage, SECURITY_CONFIG.MAX_MESSAGE_LENGTH)) {
      setError(`Mensagem muito longa. Máximo ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    // Obter token do usuário
    let token: string;
    try {
      token = await user.getIdToken();
      
      // Validar formato do token
      if (!validateTokenFormat(token)) {
        setError('Token de autenticação inválido');
        logSuspiciousActivity('Token inválido detectado', { userId: user.uid });
        return;
      }
    } catch (error) {
      setError('Erro ao obter token de autenticação');
      return;
    }

    setIsStreaming(true);
    setStreamData('');
    setError(null);

    try {
      // Cancelar request anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Fazer request com streaming
      const response = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          message: sanitizedMessage, 
          chatId: sanitizedChatId 
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'start':
                    console.log('Stream iniciado:', data.message);
                    break;
                    
                  case 'chunk':
                    if (data.content) {
                      // Sanitizar conteúdo recebido
                      const sanitizedContent = sanitizeInput(data.content);
                      setStreamData(prev => prev + sanitizedContent);
                    }
                    break;
                    
                  case 'end':
                    console.log('Stream finalizado:', {
                      processingTime: data.processingTime,
                      totalChunks: data.totalChunks
                    });
                    setIsStreaming(false);
                    return;
                    
                  case 'error':
                    setError(data.error || 'Erro desconhecido');
                    setIsStreaming(false);
                    return;
                }
              } catch (parseError) {
                console.error('Erro ao processar chunk:', parseError);
                // Ignorar chunks inválidos
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream cancelado pelo usuário');
        return;
      }
      
      console.error('Erro ao iniciar stream:', err);
      setError('Erro ao iniciar streaming');
      setIsStreaming(false);
    }
  }, [user]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const resetStream = useCallback(() => {
    stopStream();
    setStreamData('');
    setError(null);
  }, [stopStream]);

  return {
    streamData,
    isStreaming,
    error,
    startStream,
    stopStream,
    resetStream
  };
} 