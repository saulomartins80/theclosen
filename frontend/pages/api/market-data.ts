// pages/api/market-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchYahooFinanceData } from '../../services/yahooFinance';

interface MarketDataResponse {
  stocks: any[];
  cryptos: any[];
  indices: {
    ibovespa: number;
    dollar: number;
  };
  lastUpdated: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

const DEFAULT_INDICES = {
  '^BVSP': '^BVSP',
  'BRL=X': 'BRL=X'
} as const;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MarketDataResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbols = [], cryptos = [], indices = [] } = req.body as {
      symbols: string[];
      cryptos: string[];
      indices: string[];
    };

    const [stocksData, cryptosData, indicesData] = await Promise.all([
      Promise.all(
        symbols.map(symbol => 
          fetchYahooFinanceData(symbol)
            .catch(e => {
              console.error(`Error fetching stock ${symbol}:`, e);
              return null;
            })
        )
      ),
      Promise.all(
        cryptos.map(crypto => 
          fetchYahooFinanceData(crypto)
            .catch(e => {
              console.error(`Error fetching crypto ${crypto}:`, e);
              return null;
            })
        )
      ),
      Promise.all(
        indices.map(index => {
          const symbol = (DEFAULT_INDICES as Record<string, string>)[index] || index;
          return fetchYahooFinanceData(symbol)
            .catch(e => {
              console.error(`Error fetching index ${index} (${symbol}):`, e);
              return null;
            });
        })
      )
    ]);

    const responseData: MarketDataResponse = {
      stocks: stocksData.filter(item => item !== null),
      cryptos: cryptosData.filter(item => item !== null),
      indices: {
        ibovespa: indicesData.find(i => i?.symbol === '^BVSP')?.price || 0,
        dollar: indicesData.find(i => i?.symbol === 'BRL=X')?.price || 0
      },
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('API error:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal server error'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error instanceof Error ? error.message : 'Unknown error';
    }

    return res.status(500).json(errorResponse);
  }
}