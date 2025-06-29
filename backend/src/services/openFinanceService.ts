import axios from 'axios';

interface OpenFinanceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
}

interface Account {
  id: string;
  type: string;
  currency: string;
  balance: number;
  institution: string;
}

interface Investment {
  id: string;
  type: string;
  amount: number;
  institution: string;
  product: string;
  maturityDate?: string;
  rate?: number;
}

export class OpenFinanceService {
  private config: OpenFinanceConfig;
  private accessToken?: string;

  constructor(config: OpenFinanceConfig) {
    this.config = config;
  }

  // Autenticação OAuth2
  async authenticate(authCode: string): Promise<void> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth/token`, {
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });

      this.accessToken = response.data.access_token;
    } catch (error) {
      console.error('Erro na autenticação Open Finance:', error);
      throw new Error('Falha na autenticação Open Finance');
    }
  }

  // Buscar contas do usuário
  async getAccounts(): Promise<Account[]> {
    if (!this.accessToken) {
      throw new Error('Token de acesso não disponível');
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.accounts;
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw new Error('Falha ao buscar contas');
    }
  }

  // Buscar investimentos do usuário
  async getInvestments(): Promise<Investment[]> {
    if (!this.accessToken) {
      throw new Error('Token de acesso não disponível');
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/investments`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.investments;
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
      throw new Error('Falha ao buscar investimentos');
    }
  }

  // Sincronizar investimentos com o banco local
  async syncInvestments(userId: string): Promise<void> {
    try {
      const investments = await this.getInvestments();
      
      // Aqui você implementaria a lógica para salvar no banco local
      // Mapeando os investimentos do Open Finance para o formato local
      
      console.log(`Sincronizados ${investments.length} investimentos para usuário ${userId}`);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }
}

// Configurações para diferentes instituições
export const openFinanceConfigs = {
  itau: {
    clientId: process.env.ITAÚ_CLIENT_ID || '',
    clientSecret: process.env.ITAÚ_CLIENT_SECRET || '',
    redirectUri: process.env.ITAÚ_REDIRECT_URI || '',
    baseUrl: 'https://api.itau.com.br/open-banking'
  },
  bradesco: {
    clientId: process.env.BRADESCO_CLIENT_ID || '',
    clientSecret: process.env.BRADESCO_CLIENT_SECRET || '',
    redirectUri: process.env.BRADESCO_REDIRECT_URI || '',
    baseUrl: 'https://api.bradesco.com.br/open-banking'
  },
  xp: {
    clientId: process.env.XP_CLIENT_ID || '',
    clientSecret: process.env.XP_CLIENT_SECRET || '',
    redirectUri: process.env.XP_REDIRECT_URI || '',
    baseUrl: 'https://api.xp.com.br/open-banking'
  }
}; 