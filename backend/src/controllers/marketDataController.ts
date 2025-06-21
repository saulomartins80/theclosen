// src/controllers/marketDataController.ts
import { Request, Response } from 'express';
import { getMarketData } from '../services/yahooFinanceService'; // Utilizes comprehensive symbol mapping

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
  name?: string;
  exchange?: string;
}

// Definindo explicitamente a estrutura esperada para indices na resposta
interface MarketDataResponse {
  stocks: StockData[];
  cryptos: StockData[];
  commodities: StockData[];
  fiis: StockData[];
  etfs: StockData[];
  currencies: StockData[];
  indices: StockData[]; // Alterado para ser um array de StockData
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
    // Note: The frontend sends categorized lists, which is good.
    // The getMarketData service should now return data categorized.
    const {
      symbols = [],
      cryptos = [],
      commodities = [],
      fiis = [],
      etfs = [],
      currencies = [],
      manualAssets = [],
      customIndicesList = [] // <-- CORRIGIDO AQUI: Lendo 'customIndicesList'
    } = req.body;

    console.log('getMarketDataController: Received customIndicesList from req.body:', customIndicesList); // Log agora reflete o nome correto

    // Validação dos arrays (mantida)
    if (!Array.isArray(symbols)) {
      res.status(400).json({ error: 'Invalid symbols format', details: 'Symbols must be an array' }); return;
    }
    if (!Array.isArray(cryptos)) {
      res.status(400).json({ error: 'Invalid cryptos format', details: 'Cryptos must be an array' }); return;
    }
    if (!Array.isArray(manualAssets)) {
      res.status(400).json({ error: 'Invalid manualAssets format', details: 'ManualAssets must be an array' }); return;
    }
    // Validate customIndicesList - ensure it's an array before mapping
    if (!Array.isArray(customIndicesList)) { // <-- CORRIGIDO AQUI
         console.error('getMarketDataController: customIndicesList received is not an array:', customIndicesList); // <-- CORRIGIDO AQUI
         res.status(400).json({ error: 'Invalid customIndicesList format', details: 'customIndicesList must be an array' }); // <-- CORRIGIDO AQUI
         return;
    }

    // Correctly map customIndicesList to just symbols (already checked if it's an array above)
    // A variável customIndicesList já contém os símbolos diretamente do frontend
    const indicesSymbols = customIndicesList.map((item: any) => {
       if (typeof item === 'string') return item;
       // Handle the case where item might be an object { symbol: string, name: string } - though frontend sends just symbols now
       return item?.symbol;
    }).filter((symbol): symbol is string => typeof symbol === 'string' && symbol.length > 0); // Filter out any invalid symbols


    // Chamar o serviço com os parâmetros corretos
    const marketData = await getMarketData({
      symbols,
      cryptoList: cryptos,
      commoditiesList: commodities,
      fiisList: fiis,
      etfsList: etfs,
      currenciesList: currencies,
      manualAssets,
      customIndicesList: indicesSymbols // Pass the extracted symbols (which is customIndicesList itself if it contains strings)
    });


    // The service is now expected to return MarketDataResponse where indices is StockData[]
    // So we can return marketData directly without re-structuring indices

    // Basic check if any data was found
    if (
      !marketData.stocks.length &&
      !marketData.cryptos.length &&
      !marketData.commodities.length &&
      !marketData.fiis.length &&
      !marketData.etfs.length &&
      !marketData.currencies.length &&
      !marketData.indices.length
    ) {
      res.status(404).json({
        error: 'No market data found for the provided symbols',
        details: 'Please check the symbols and try again.'
      });
      return;
    }

    // Return the data as received from the service
    res.status(200).json(marketData);

  } catch (error: any) {
    console.error('getMarketData controller: Error fetching market data:', error);

    const statusCode = error instanceof Error && error.name === 'SyntaxError' ? 400 : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(statusCode).json({
      error: 'Failed to fetch market data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};