// src/services/yahooFinanceService.ts
import axios from 'axios';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
}

const YAHOO_FINANCE_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const REQUEST_TIMEOUT = 10000;

const symbolMappings: Record<string, string> = {
  'SP500': '^GSPC',
  'NASDAQ': '^IXIC',
  'DOWJONES': '^DJI',
  'IBOVESPA': '^BVSP',
  'DOLAR': 'BRL=X',
  'BITCOIN': 'BTC-USD',
  'ETHEREUM': 'ETH-USD'
};

export const fetchYahooFinanceData = async (symbol: string): Promise<StockData | null> => {
  try {
    const resolvedSymbol = symbolMappings[symbol.toUpperCase()] || symbol;
    const symbolVariations = [
      resolvedSymbol,
      resolvedSymbol.endsWith('.SA') ? resolvedSymbol.replace('.SA', '') : `${resolvedSymbol}.SA`,
      resolvedSymbol.replace('-USD', '')
    ];

    for (const variation of symbolVariations) {
      try {
        const response = await axios.get(`${YAHOO_FINANCE_API_URL}/${variation}`, {
          params: { interval: '1d', range: '1d' },
          timeout: REQUEST_TIMEOUT
        });

        const result = response.data.chart?.result?.[0];
        if (!result) continue;

        const meta = result.meta;
        const previousClose = meta.chartPreviousClose || 0;
        const currentPrice = meta.regularMarketPrice || 0;
        const change = currentPrice - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

        return {
          symbol,
          price: currentPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume,
          currency: meta.currency || (variation.endsWith('.SA') ? 'BRL' : 'USD')
        };
      } catch (error) {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error instanceof Error ? error.message : error);
    return null;
  }
};

export const getMarketData = async (
  symbols: string[],
  cryptoList: string[],
  manualAssets: string[] = [],
  customIndices: string[] = []
): Promise<{
  stocks: StockData[];
  cryptos: StockData[];
  indices: Record<string, number>;
  lastUpdated: string;
}> => {
  try {
    const allSymbols = [...new Set([...symbols, ...manualAssets])];
    const allSymbolsToFetch = [...allSymbols, ...cryptoList, ...customIndices];

    const results = await Promise.all(
      allSymbolsToFetch.map(symbol => fetchYahooFinanceData(symbol))
    );

    const stocks: StockData[] = [];
    const cryptos: StockData[] = [];
    const indices: Record<string, number> = {};

    // Process results
    results.forEach((item, index) => {
      if (!item) return;
      
      const originalSymbol = allSymbolsToFetch[index];
      if (symbols.includes(originalSymbol)) {
        stocks.push(item);
      } else if (cryptoList.includes(originalSymbol)) {
        cryptos.push(item);
      } else if (customIndices.includes(originalSymbol)) {
        indices[originalSymbol] = item.price;
      }
    });

    // Add default indices if not already present
    if (!indices['^BVSP']) {
      const ibovData = await fetchYahooFinanceData('^BVSP');
      if (ibovData) indices['^BVSP'] = ibovData.price;
    }

    if (!indices['BRL=X']) {
      const usdData = await fetchYahooFinanceData('BRL=X');
      if (usdData) indices['BRL=X'] = usdData.price;
    }

    return {
      stocks,
      cryptos,
      indices,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getMarketData:', error);
    return {
      stocks: [],
      cryptos: [],
      indices: {},
      lastUpdated: new Date().toISOString()
    };
  }
};