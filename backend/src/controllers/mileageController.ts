import { Request, Response } from 'express';
import { calculateMiles, getCardRecommendations } from '../utils/mileageCalculator';
import { Mileage } from '../models/Mileage';

// Modelos temporários para desenvolvimento
interface MileageProgram {
  id: string;
  name: string;
  icon: string;
  totalPoints: number;
  estimatedValue: number;
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'pending';
  color: string;
  partners: string[];
}

interface MileageCard {
  id: string;
  name: string;
  bank: string;
  program: string;
  pointsPerReal: number;
  annualFee: number;
  benefits: string[];
  status: 'active' | 'inactive';
}

interface MileageTransaction {
  id: string;
  program: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  date: Date;
  description: string;
  card?: string;
  value: number;
  category?: string;
}

// Dados mockados para desenvolvimento
const mockMileagePrograms: MileageProgram[] = [
  {
    id: 'smiles',
    name: 'Smiles',
    icon: '✈️',
    totalPoints: 15420,
    estimatedValue: 385.50,
    lastUpdated: new Date(),
    status: 'active',
    color: '#00A1E0',
    partners: ['GOL', 'Itaú', 'Santander']
  },
  {
    id: 'tudoazul',
    name: 'TudoAzul',
    icon: '🛩️',
    totalPoints: 8920,
    estimatedValue: 200.70,
    lastUpdated: new Date(),
    status: 'active',
    color: '#0066CC',
    partners: ['Azul', 'Bradesco', 'Nubank']
  },
  {
    id: 'latam',
    name: 'Latam Pass',
    icon: '✈️',
    totalPoints: 5670,
    estimatedValue: 141.75,
    lastUpdated: new Date(),
    status: 'active',
    color: '#D70040',
    partners: ['Latam', 'Itaú', 'Citi']
  }
];

const mockMileageCards: MileageCard[] = [
  {
    id: '1',
    name: 'Itaú Personnalité Visa Infinite',
    bank: 'Itaú',
    program: 'Latam Pass',
    pointsPerReal: 2.5,
    annualFee: 1295,
    benefits: ['Sala VIP', 'Seguro viagem', 'Bônus de boas-vindas'],
    status: 'active'
  },
  {
    id: '2',
    name: 'Nubank Ultravioleta',
    bank: 'Nubank',
    program: 'TudoAzul',
    pointsPerReal: 1.8,
    annualFee: 0,
    benefits: ['Sem anuidade', 'Cashback', 'Cartão virtual'],
    status: 'active'
  }
];

const mockMileageTransactions: MileageTransaction[] = [
  {
    id: '1',
    program: 'Smiles',
    points: 1250,
    type: 'earned',
    date: new Date(),
    description: 'Compra no Supermercado Extra',
    card: 'Itaú Personnalité',
    value: 31.25,
    category: 'Supermercado'
  },
  {
    id: '2',
    program: 'TudoAzul',
    points: 800,
    type: 'earned',
    date: new Date(Date.now() - 86400000),
    description: 'Combustível Shell',
    card: 'Nubank Ultravioleta',
    value: 18.00,
    category: 'Transporte'
  }
];

export const mileageController = {
  // Programas de Milhas
  async getMileagePrograms(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      
      // TODO: Buscar do banco de dados baseado no userId
      // Por enquanto, retorna dados mockados
      res.json({
        success: true,
        programs: mockMileagePrograms
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar programas de milhas',
        details: error.message
      });
    }
  },

  async updateMileageProgram(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const { id } = req.params;
      const updateData = req.body;

      // TODO: Atualizar no banco de dados
      const programIndex = mockMileagePrograms.findIndex(p => p.id === id);
      if (programIndex !== -1) {
        mockMileagePrograms[programIndex] = { ...mockMileagePrograms[programIndex], ...updateData };
      }

      res.json({
        success: true,
        program: mockMileagePrograms[programIndex]
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao atualizar programa de milhas',
        details: error.message
      });
    }
  },

  // Cartões de Milhas
  async getMileageCards(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      
      // TODO: Buscar do banco de dados baseado no userId
      res.json({
        success: true,
        cards: mockMileageCards
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar cartões de milhas',
        details: error.message
      });
    }
  },

  async addMileageCard(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const cardData = req.body;

      const newCard: MileageCard = {
        id: Date.now().toString(),
        ...cardData,
        status: 'active'
      };

      mockMileageCards.push(newCard);

      res.json({
        success: true,
        card: newCard
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao adicionar cartão de milhas',
        details: error.message
      });
    }
  },

  async updateMileageCard(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const { id } = req.params;
      const updateData = req.body;

      const cardIndex = mockMileageCards.findIndex(c => c.id === id);
      if (cardIndex !== -1) {
        mockMileageCards[cardIndex] = { ...mockMileageCards[cardIndex], ...updateData };
      }

      res.json({
        success: true,
        card: mockMileageCards[cardIndex]
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao atualizar cartão de milhas',
        details: error.message
      });
    }
  },

  async deleteMileageCard(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const { id } = req.params;

      const cardIndex = mockMileageCards.findIndex(c => c.id === id);
      if (cardIndex !== -1) {
        mockMileageCards.splice(cardIndex, 1);
      }

      res.json({
        success: true,
        message: 'Cartão removido com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao remover cartão de milhas',
        details: error.message
      });
    }
  },

  // Transações de Milhas
  async getMileageTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const filters = req.query;

      // TODO: Aplicar filtros e buscar do banco de dados
      res.json({
        success: true,
        transactions: mockMileageTransactions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar transações de milhas',
        details: error.message
      });
    }
  },

  async addMileageTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const transactionData = req.body;

      const newTransaction: MileageTransaction = {
        id: Date.now().toString(),
        ...transactionData,
        date: new Date()
      };

      mockMileageTransactions.push(newTransaction);

      res.json({
        success: true,
        transaction: newTransaction
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao adicionar transação de milhas',
        details: error.message
      });
    }
  },

  // Análises de Milhas
  async getMileageAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const { period } = req.query;

      // TODO: Calcular análises baseadas no período
      const analytics = {
        totalPoints: mockMileagePrograms.reduce((sum, p) => sum + p.totalPoints, 0),
        totalValue: mockMileagePrograms.reduce((sum, p) => sum + p.estimatedValue, 0),
        monthlyEarnings: 2500,
        topProgram: 'Smiles',
        topCard: 'Itaú Personnalité',
        categoryBreakdown: {
          'Supermercado': 40,
          'Transporte': 25,
          'Restaurante': 20,
          'Outros': 15
        }
      };

      res.json({
        success: true,
        analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar análises de milhas',
        details: error.message
      });
    }
  },

  // Recomendações de Cartões
  async getCardRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const { monthlySpending, preferredPrograms } = req.body;

      const recommendations = getCardRecommendations(monthlySpending, preferredPrograms);

      res.json({
        success: true,
        recommendations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar recomendações',
        details: error.message
      });
    }
  },

  // Calculadora de Milhas
  async calculateMiles(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id || (req as any).user.id;
      const params = req.body;

      const result = calculateMiles(params);

      res.json({
        success: true,
        result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Falha ao calcular milhas',
        details: error.message
      });
    }
  }
}; 