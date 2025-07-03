import axios from 'axios';
import { User } from '../models/User';
import { Mileage } from '../models/Mileage';
import { calculateMiles } from '../utils/mileageCalculator';

const PLUGGY_API_URL = 'https://api.pluggy.ai';

export interface PluggyItem {
  id: string;
  status: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PluggyAccount {
  id: string;
  type: string;
  subtype: string;
  name: string;
  number: string;
  balance: number;
  currency: string;
}

export interface PluggyTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  merchantName?: string;
  cardNumber?: string;
  type: string;
}

export class PluggyService {
  private apiKey: string;

  constructor() {
    if (!process.env.PLUGGY_API_KEY) {
      throw new Error('PLUGGY_API_KEY não está configurada no ambiente');
    }
    this.apiKey = process.env.PLUGGY_API_KEY;
  }

  private async makeRequest(endpoint: string, method = 'GET', data?: any) {
    try {
      const response = await axios({
        method,
        url: `${PLUGGY_API_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey
        },
        data
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro na API Pluggy:', error.response?.data || error.message);
      throw new Error(`Falha na requisição Pluggy API: ${error.message}`);
    }
  }

  async createConnectToken(userId: string) {
    return this.makeRequest('/connect-token', 'POST', {
      clientUserId: userId
    });
  }

  async getItem(itemId: string): Promise<PluggyItem> {
    return this.makeRequest(`/items/${itemId}`);
  }

  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    const response = await this.makeRequest(`/items/${itemId}/accounts`);
    return response.results;
  }

  async getTransactions(accountId: string, from?: string, to?: string): Promise<PluggyTransaction[]> {
    let url = `/accounts/${accountId}/transactions?pageSize=500`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    
    const response = await this.makeRequest(url);
    return response.results;
  }

  async processTransactionsForMiles(userId: string, accountId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    // Busca transações dos últimos 30 dias
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const transactions = await this.getTransactions(accountId, fromDate.toISOString());

    // Processa cada transação e calcula milhas
    const mileageRecords = [];
    for (const transaction of transactions) {
      // Verifica se já foi processada
      const exists = await Mileage.exists({ 
        userId,
        transactionId: transaction.id 
      });
      
      if (!exists && transaction.amount > 0) {
        const milesEarned = calculateMiles({
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          paymentData: {
            cardLastDigits: transaction.cardNumber?.slice(-4),
            establishment: transaction.merchantName
          }
        }, user.mileagePreferences);

        if (milesEarned.points > 0) {
          const record = new Mileage({
            userId,
            transactionId: transaction.id,
            programa: milesEarned.program,
            quantidade: milesEarned.points,
            data: new Date(transaction.date),
            tipo: 'acumulacao',
            cartao: milesEarned.cardName,
            valorEstimado: milesEarned.monetaryValue,
            metadata: {
              originalAmount: transaction.amount,
              description: transaction.description,
              category: transaction.category
            }
          });
          
          await record.save();
          mileageRecords.push(record);
          
          // Atualiza saldo total do usuário
          user.mileageBalance = (user.mileageBalance || 0) + milesEarned.points;
        }
      }
    }

    await user.save();
    return mileageRecords;
  }

  async getMileageSummary(userId: string) {
    const summary = await Mileage.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: "$programa",
          totalPoints: { $sum: "$quantidade" },
          estimatedValue: { $sum: "$valorEstimado" },
          lastUpdated: { $max: "$createdAt" },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);

    return summary;
  }

  async getRecentMileageActivity(userId: string, limit = 10) {
    return await Mileage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email');
  }
} 