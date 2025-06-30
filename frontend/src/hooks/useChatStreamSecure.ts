import { useState, useCallback, useRef } from 'react';
import { sanitizeInput, validateMessageSize, logSuspiciousActivity, SECURITY_CONFIG } from '../utils/security';

interface StreamData {
  content: string;
  isComplete: boolean;
  metadata?: {
    processingTime?: number;
    chunkCount?: number;
    analysisData?: unknown;
    error?: boolean;
    errorMessage?: string;
  };
}

interface UseChatStreamReturn {
  streamData: StreamData | null;
  isStreaming: boolean;
  error: string | null;
  startStream: (message: string, chatId: string) => Promise<void>;
  stopStream: () => void;
  resetStream: () => void;
}

export const useChatStreamSecure = (): UseChatStreamReturn => {
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (message: string, chatId: string) => {
    try {
      // VALIDAÇÕES DE SEGURANÇA
      if (!message || typeof message !== 'string') {
        throw new Error('Mensagem inválida');
      }

      // Sanitizar input do usuário
      const sanitizedMessage = sanitizeInput(message);
      if (sanitizedMessage !== message) {
        logSuspiciousActivity('Input sanitizado', { original: message, sanitized: sanitizedMessage });
      }

      // Validar tamanho da mensagem
      if (!validateMessageSize(sanitizedMessage, SECURITY_CONFIG.MAX_MESSAGE_LENGTH)) {
        throw new Error(`Mensagem muito longa. Máximo de ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} caracteres.`);
      }

      // Validar chatId
      if (!chatId || typeof chatId !== 'string' || chatId.length < 10) {
        throw new Error('ID de chat inválido');
      }

      // Sanitizar dados antes de enviar
      const sanitizedData = {
        message: sanitizedMessage,
        chatId: chatId
      };

      // Cancelar stream anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo controller para este stream
      abortControllerRef.current = new AbortController();

      setIsStreaming(true);
      setError(null);
      setStreamData({ content: '', isComplete: false });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Validar formato do token
      if (!token.includes('.') || token.length < 50) {
        logSuspiciousActivity('Token com formato suspeito', { tokenLength: token.length });
        throw new Error('Token de autenticação inválido');
      }

      const response = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify(sanitizedData),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Stream não disponível');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let chunkCount = 0;
      const startTime = Date.now();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setStreamData(prev => prev ? {
              ...prev,
              isComplete: true,
              metadata: {
                ...prev.metadata,
                processingTime: Date.now() - startTime,
                chunkCount: chunkCount
              }
            } : null);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          
          // Validar chunk recebido
          if (chunk && typeof chunk === 'string') {
            const sanitizedChunk = sanitizeInput(chunk);
            accumulatedContent += sanitizedChunk;

            setStreamData({
              content: accumulatedContent,
              isComplete: false,
              metadata: {
                processingTime: Date.now() - startTime,
                chunkCount: chunkCount
              }
            });
          }
        }
      } catch (streamError) {
        if (streamError instanceof Error && streamError.name === 'AbortError') {
          console.log('Stream cancelado pelo usuário');
        } else {
          console.error('Erro no stream:', streamError);
          setError('Erro durante o streaming da resposta');
        }
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Log de erro para monitoramento
      if (errorMessage.includes('suspicious') || errorMessage.includes('invalid')) {
        logSuspiciousActivity('Erro de segurança no chat stream', { 
          error: errorMessage, 
          message: message.substring(0, 100),
          chatId: chatId 
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const resetStream = useCallback(() => {
    stopStream();
    setStreamData(null);
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
}; 