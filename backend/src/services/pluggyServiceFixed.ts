import axios from 'axios';

interface PluggyConfig {
  clientId: string;
  apiKey: string;
  baseUrl: string;
}

interface ConnectTokenRequest {
  clientId: string;
  clientSecret: string;
  redirectUrl?: string;
}

interface ConnectTokenResponse {
  accessToken: string;
  expiresIn: number;
}

interface Item {
  id: string;
  status: string;
  institution: {
    name: string;
    type: string;
  };
  accounts: Account[];
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  currency: string;
  balance: {
    current: number;
    available: number;
  };
}

interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category: string;
  type: 'credit' | 'debit';
}

class PluggyService {
  private config: PluggyConfig;

  constructor() {
    this.config = {
      clientId: process.env.PLUGGY_CLIENT_ID!,
      apiKey: process.env.PLUGGY_API_KEY!,
      baseUrl: 'https://api.pluggy.ai'
    };

    if (!this.config.clientId || !this.config.apiKey) {
      throw new Error('Credenciais do Pluggy não configuradas');
    }
  }

  // Gerar token de conexão
  async createConnectToken(redirectUrl?: string): Promise<ConnectTokenResponse> {
    try {
      console.log('[PluggyService] Gerando token de conexão...');
      
      const response = await axios.post(`${this.config.baseUrl}/connect_token`, {
        clientId: this.config.clientId,
        clientSecret: this.config.apiKey,
        redirectUrl: redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect`
      }, {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('[PluggyService] Token de conexão gerado com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('[PluggyService] Erro ao gerar token de conexão:', error.response?.data || error.message);
      throw new Error(`Falha ao gerar token de conexão: ${error.response?.data?.message || error.message}`);
    }
  }

  // Buscar item (conexão) por ID
  async getItem(itemId: string): Promise<Item> {
    try {
      console.log(`[PluggyService] Buscando item ${itemId}...`);
      
      const response = await axios.get(`${this.config.baseUrl}/items/${itemId}`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });

      console.log(`[PluggyService] Item ${itemId} obtido com sucesso`);
      return response.data;
    } catch (error: any) {
      console.error(`[PluggyService] Erro ao buscar item ${itemId}:`, error.response?.data || error.message);
      throw new Error(`Falha ao buscar item: ${error.response?.data?.message || error.message}`);
    }
  }

  // Buscar transações de uma conta
  async getTransactions(itemId: string, accountId: string, from?: string, to?: string): Promise<Transaction[]> {
    try {
      console.log(`[PluggyService] Buscando transações para item ${itemId}, conta ${accountId}...`);
      
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await axios.get(`${this.config.baseUrl}/items/${itemId}/accounts/${accountId}/transactions?${params}`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });

      console.log(`[PluggyService] Transações obtidas com sucesso: ${response.data.results?.length || 0} transações`);
      return response.data.results || [];
    } catch (error: any) {
      console.error(`[PluggyService] Erro ao buscar transações:`, error.response?.data || error.message);
      throw new Error(`Falha ao buscar transações: ${error.response?.data?.message || error.message}`);
    }
  }

  // Listar todos os items do usuário
  async getItems(): Promise<Item[]> {
    try {
      console.log('[PluggyService] Buscando items...');
      
      const response = await axios.get(`${this.config.baseUrl}/items`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });

      console.log(`[PluggyService] Items obtidos com sucesso: ${response.data.results?.length || 0} items`);
      return response.data.results || [];
    } catch (error: any) {
      console.error('[PluggyService] Erro ao buscar items:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar items: ${error.response?.data?.message || error.message}`);
    }
  }

  // Deletar item (desconectar conta)
  async deleteItem(itemId: string): Promise<void> {
    try {
      console.log(`[PluggyService] Deletando item ${itemId}...`);
      
      await axios.delete(`${this.config.baseUrl}/items/${itemId}`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });

      console.log(`[PluggyService] Item ${itemId} deletado com sucesso`);
    } catch (error: any) {
      console.error(`[PluggyService] Erro ao deletar item ${itemId}:`, error.response?.data || error.message);
      throw new Error(`Falha ao deletar item: ${error.response?.data?.message || error.message}`);
    }
  }

  // Buscar instituições disponíveis
  async getInstitutions(country?: string): Promise<any[]> {
    try {
      console.log('[PluggyService] Buscando instituições...');
      
      const params = country ? `?country=${country}` : '';
      const response = await axios.get(`${this.config.baseUrl}/institutions${params}`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });

      console.log(`[PluggyService] Instituições obtidas com sucesso: ${response.data.results?.length || 0} instituições`);
      return response.data.results || [];
    } catch (error: any) {
      console.error('[PluggyService] Erro ao buscar instituições:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar instituições: ${error.response?.data?.message || error.message}`);
    }
  }

  // Calcular milhas baseado em transações
  calculateMilesFromTransactions(transactions: Transaction[]): {
    totalSpent: number;
    totalMiles: number;
    estimatedValue: number;
    categories: { [key: string]: { spent: number; miles: number } };
  } {
    const result = {
      totalSpent: 0,
      totalMiles: 0,
      estimatedValue: 0,
      categories: {} as { [key: string]: { spent: number; miles: number } }
    };

    // Multiplicadores por categoria (exemplo)
    const multipliers = {
      'supermarket': 2.5,
      'gas_station': 1.0,
      'restaurant': 2.0,
      'travel': 3.0,
      'pharmacy': 1.5,
      'default': 1.0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'debit') {
        const amount = Math.abs(transaction.amount);
        const category = transaction.category?.toLowerCase() || 'default';
        const multiplier = multipliers[category as keyof typeof multipliers] || multipliers.default;
        const miles = amount * multiplier;

        result.totalSpent += amount;
        result.totalMiles += miles;

        if (!result.categories[category]) {
          result.categories[category] = { spent: 0, miles: 0 };
        }
        result.categories[category].spent += amount;
        result.categories[category].miles += miles;
      }
    });

    // Valor estimado das milhas (R$ 0,025 por milha)
    result.estimatedValue = result.totalMiles * 0.025;

    return result;
  }
}

export default PluggyService; 