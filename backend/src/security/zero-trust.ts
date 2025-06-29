import crypto from 'crypto';
import { CryptoArmor } from '../utils/security';

// Simulação de HSM Client (em produção, use AWS CloudHSM ou Google Cloud HSM)
class HSMClient {
  private endpoint: string;
  private apiKey: string;

  constructor(config: { endpoint: string; apiKey: string }) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
  }

  async generateKey(config: { type: string; context: any }) {
    // Em produção, isso seria uma chamada para o HSM real
    const keyId = crypto.randomBytes(32).toString('hex');
    const key = crypto.randomBytes(32).toString('hex');
    
    console.log(`[HSM] Gerada chave ${keyId} para operação: ${config.context.operation}`);
    
    return {
      id: keyId,
      key: key,
      type: config.type,
      context: config.context
    };
  }

  async encrypt(config: { keyId: string; data: string; aad: string }) {
    // Simulação de criptografia HSM
    const key = await this.getKeyById(config.keyId);
    const encrypted = CryptoArmor.encrypt(config.data, key);
    
    return {
      ciphertext: encrypted.content,
      iv: encrypted.iv,
      tag: encrypted.tag,
      aad: config.aad,
      keyId: config.keyId
    };
  }

  async decrypt(config: { keyId: string; ciphertext: string; iv: string; tag: string; aad: string }) {
    const key = await this.getKeyById(config.keyId);
    return CryptoArmor.decrypt({
      content: config.ciphertext,
      iv: config.iv,
      tag: config.tag
    }, key);
  }

  private async getKeyById(keyId: string): Promise<string> {
    // Em produção, isso buscaria a chave no HSM
    return crypto.randomBytes(32).toString('hex');
  }
}

// Cliente HSM
const hsm = new HSMClient({
  endpoint: process.env.HSM_ENDPOINT || 'https://hsm.example.com',
  apiKey: process.env.HSM_API_KEY || 'hsm-api-key'
});

export class TransactionVault {
  private static async getKey(operation: string) {
    return hsm.generateKey({
      type: 'aes-256-gcm',
      context: {
        operation,
        user: 'openfinance',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV
      }
    });
  }

  static async encryptFinancialData(data: any) {
    const key = await this.getKey('encrypt');
    return hsm.encrypt({
      keyId: key.id,
      data: JSON.stringify(data),
      aad: 'openfinance-pci' // Additional Authenticated Data
    });
  }

  static async decryptFinancialData(encryptedData: any) {
    return hsm.decrypt({
      keyId: encryptedData.keyId,
      ciphertext: encryptedData.ciphertext,
      iv: encryptedData.iv,
      tag: encryptedData.tag,
      aad: encryptedData.aad
    });
  }
}

// Proteção PCI DSS
export class PCITokenizer {
  private static readonly MASK_PATTERNS = {
    creditCard: /(\d{4})\d{8}(\d{4})/,
    cpf: /(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/,
    cnpj: /(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})/
  };

  static tokenizeCreditCard(cardNumber: string): string {
    if (!cardNumber) return '';
    
    // Remove espaços e hífens
    const clean = cardNumber.replace(/[\s-]/g, '');
    
    // Validação básica de cartão
    if (clean.length < 13 || clean.length > 19) {
      throw new Error('Número de cartão inválido');
    }

    // Tokenização: mantém apenas os primeiros 4 e últimos 4 dígitos
    return clean.replace(this.MASK_PATTERNS.creditCard, '$1********$2');
  }

  static tokenizeCPF(cpf: string): string {
    if (!cpf) return '';
    
    const clean = cpf.replace(/[^\d]/g, '');
    
    if (clean.length !== 11) {
      throw new Error('CPF inválido');
    }

    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  }

  static tokenizeCNPJ(cnpj: string): string {
    if (!cnpj) return '';
    
    const clean = cnpj.replace(/[^\d]/g, '');
    
    if (clean.length !== 14) {
      throw new Error('CNPJ inválido');
    }

    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-$5');
  }

  static protectCreditCard(cardData: {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
  }) {
    return {
      token: this.tokenizeCreditCard(cardData.number),
      holder: this.maskName(cardData.holder),
      expiry: cardData.expiry, // Não armazene - calcule dinamicamente
      cvv: '***', // JAMAIS armazene
      hash: this.generateCardHash(cardData.number)
    };
  }

  private static maskName(name: string): string {
    if (!name) return '';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0) + '*'.repeat(parts[0].length - 1);
    }
    
    return parts.map((part, index) => {
      if (index === 0 || index === parts.length - 1) {
        return part.charAt(0) + '*'.repeat(part.length - 1);
      }
      return '*'.repeat(part.length);
    }).join(' ');
  }

  private static generateCardHash(cardNumber: string): string {
    const clean = cardNumber.replace(/[\s-]/g, '');
    return crypto.createHash('sha256').update(clean).digest('hex');
  }
}

// Validador PSD2/Open Finance
export class PSD2Validator {
  private cert: string;
  private privateKey: string;
  private sandbox: boolean;

  constructor(config: { cert: string; privateKey: string; sandbox: boolean }) {
    this.cert = config.cert;
    this.privateKey = config.privateKey;
    this.sandbox = config.sandbox;
  }

  async checkConsentStatus(consentId: string) {
    // Simulação de validação de consentimento PSD2
    console.log(`[PSD2] Verificando consentimento: ${consentId}`);
    
    // Em produção, isso faria uma chamada para o banco central
    return {
      consentId,
      status: 'VALID',
      permissions: ['ACCOUNTS_READ', 'TRANSACTIONS_READ'],
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
      validatedAt: new Date()
    };
  }

  async validateTransaction(transaction: any) {
    // Validação de transação conforme PSD2
    const validations = [
      this.validateAmount(transaction.amount),
      this.validateCurrency(transaction.currency),
      this.validatePurpose(transaction.purpose)
    ];

    const results = await Promise.all(validations);
    const isValid = results.every(result => result.valid);

    return {
      valid: isValid,
      validations: results,
      timestamp: new Date()
    };
  }

  private async validateAmount(amount: number) {
    return {
      field: 'amount',
      valid: amount > 0 && amount <= 1000000, // Limite de 1M
      message: amount > 1000000 ? 'Valor excede limite máximo' : null
    };
  }

  private async validateCurrency(currency: string) {
    const allowedCurrencies = ['BRL', 'USD', 'EUR'];
    return {
      field: 'currency',
      valid: allowedCurrencies.includes(currency),
      message: !allowedCurrencies.includes(currency) ? 'Moeda não suportada' : null
    };
  }

  private async validatePurpose(purpose: string) {
    const allowedPurposes = ['PAYMENT', 'TRANSFER', 'INVESTMENT'];
    return {
      field: 'purpose',
      valid: allowedPurposes.includes(purpose),
      message: !allowedPurposes.includes(purpose) ? 'Propósito não permitido' : null
    };
  }
}

// Auditoria Financeira em Tempo Real
export class FinancialAudit {
  private apiKey: string;
  private rules: any;

  constructor(config: { apiKey: string; rules: any }) {
    this.apiKey = config.apiKey;
    this.rules = config.rules;
  }

  log(action: string, metadata: any) {
    const auditEntry = {
      severity: this.determineSeverity(action),
      action,
      user: metadata.userId,
      ip: metadata.ip,
      timestamp: new Date().toISOString(),
      sessionId: metadata.sessionId,
      userAgent: metadata.userAgent,
      riskScore: this.calculateRiskScore(metadata),
      compliance: {
        pci: this.rules.pci,
        gdpr: this.rules.gdpr,
        openfinance: this.rules.openfinance
      }
    };

    console.log(`[AUDIT] ${JSON.stringify(auditEntry, null, 2)}`);
    
    // Em produção, enviar para Splunk/Graylog
    this.sendToAuditSystem(auditEntry);
  }

  private determineSeverity(action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalActions = ['PAYMENT', 'TRANSFER', 'ACCOUNT_ACCESS'];
    const highActions = ['LOGIN', 'PASSWORD_CHANGE', 'CONSENT_GRANT'];
    const mediumActions = ['DATA_VIEW', 'REPORT_GENERATE'];

    if (criticalActions.includes(action)) return 'CRITICAL';
    if (highActions.includes(action)) return 'HIGH';
    if (mediumActions.includes(action)) return 'MEDIUM';
    return 'LOW';
  }

  private calculateRiskScore(metadata: any): number {
    let score = 0;
    
    // IP suspeito
    if (this.isSuspiciousIP(metadata.ip)) score += 30;
    
    // User-Agent suspeito
    if (this.isSuspiciousUserAgent(metadata.userAgent)) score += 20;
    
    // Horário suspeito (2h-6h)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) score += 15;
    
    // Múltiplas tentativas
    if (metadata.attemptCount > 3) score += 25;
    
    return Math.min(score, 100);
  }

  private isSuspiciousIP(ip: string): boolean {
    // Lista de IPs suspeitos (em produção, usar serviço de reputação)
    const suspiciousIPs = ['192.168.1.1', '10.0.0.1'];
    return suspiciousIPs.includes(ip);
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [/bot/i, /crawler/i, /scraper/i];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private async sendToAuditSystem(auditEntry: any) {
    // Em produção, enviar para sistema de auditoria
    try {
      // Simulação de envio
      console.log(`[AUDIT-SYSTEM] Enviando entrada para sistema de auditoria`);
    } catch (error) {
      console.error('[AUDIT] Erro ao enviar para sistema de auditoria:', error);
    }
  }
}

// Instâncias globais
export const psd2Validator = new PSD2Validator({
  cert: process.env.QWAC_CERT || 'cert',
  privateKey: process.env.QWAC_KEY || 'key',
  sandbox: process.env.NODE_ENV !== 'production'
});

export const financialAudit = new FinancialAudit({
  apiKey: process.env.AUDIT_API_KEY || 'audit-key',
  rules: {
    pci: true,
    gdpr: true,
    openfinance: true
  }
}); 