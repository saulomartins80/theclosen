// Utilitários de segurança para o frontend

// Sanitização de input no frontend
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .trim();
};

// Validação de tamanho de mensagem
export const validateMessageSize = (message: string, maxLength: number = 2000): boolean => {
  return message.length <= maxLength;
};

// Validação de formato de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de força de senha
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('A senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
  }

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Adicione letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Adicione letras maiúsculas');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Adicione números');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Adicione caracteres especiais');

  return {
    isValid: score >= 4,
    score,
    feedback
  };
};

// Criptografia simples para dados sensíveis (não para senhas)
export const encryptSensitiveData = (data: string): string => {
  // Implementação básica - em produção, use uma biblioteca de criptografia
  return btoa(encodeURIComponent(data));
};

// Descriptografia
export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    return decodeURIComponent(atob(encryptedData));
  } catch {
    return '';
  }
};

// Validação de token JWT (básica)
export const validateTokenFormat = (token: string): boolean => {
  if (!token || token.length < 10) return false;
  
  // Verificar se tem 3 partes separadas por ponto (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3;
};

// Limpeza de dados antes de enviar para API
export const sanitizeApiData = (data: unknown): unknown => {
  if (typeof data === 'string') {
    return sanitizeInput(data);
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(sanitizeApiData);
    }
    
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeApiData(value);
    }
    return sanitized;
  }
  
  return data;
};

// Proteção contra XSS em conteúdo HTML
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Validação de URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Log de atividades suspeitas
export const logSuspiciousActivity = (activity: string, details?: any) => {
  console.warn(`[SECURITY] Atividade suspeita detectada: ${activity}`, details);
  
  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // Implementar envio para serviço de segurança
    console.log('Enviando alerta de segurança...');
  }
};

// Verificação de ambiente seguro
export const isSecureEnvironment = (): boolean => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Configurações de segurança
export const SECURITY_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8
}; 