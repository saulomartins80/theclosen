// src/controllers/marketDataController.ts
import { Request, Response } from 'express';
import { getMarketData } from '../services/yahooFinanceService';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
}

interface MarketDataResponse {
  stocks: StockData[];
  cryptos: StockData[];
  indices: Record<string, number>;
  lastUpdated: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export const getMarketDataController = async (
  req: Request,
  res: Response<MarketDataResponse | ErrorResponse>
): Promise<void> => {
  try {
    const { symbols = [], cryptos = [], manualAssets = [], customIndices = [] } = req.body;

    // Validação adicional
    if (!Array.isArray(symbols)) {
      res.status(400).json({ 
        error: 'Invalid symbols format',
        details: 'Symbols must be an array'
      });
      return;
    }

    if (!Array.isArray(cryptos)) {
      res.status(400).json({ 
        error: 'Invalid cryptos format',
        details: 'Cryptos must be an array'
      });
      return;
    }

    if (!Array.isArray(manualAssets)) {
      res.status(400).json({
        error: 'Invalid manualAssets format',
        details: 'ManualAssets must be an array'
      });
      return;
    }

    if (!Array.isArray(customIndices)) {
      res.status(400).json({
        error: 'Invalid customIndices format',
        details: 'CustomIndices must be an array'
      });
      return;
    }

    const marketData = await getMarketData(symbols, cryptos, manualAssets, customIndices);
    res.status(200).json(marketData);
    
  } catch (error) {
    console.error('Error in getMarketData controller:', error);
    
    const statusCode = error instanceof Error && error.name === 'SyntaxError' ? 400 : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(statusCode).json({ 
      error: 'Failed to fetch market data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};