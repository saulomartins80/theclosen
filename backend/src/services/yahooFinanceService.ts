// src/services/yahooFinanceService.ts
import axios from 'axios';

interface StockData {
  symbol: string;
  name?: string; // Added optional name field
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
}

const YAHOO_FINANCE_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const REQUEST_TIMEOUT = 10000;

// Categorias completas de ativos
const symbolMappings: Record<string, string> = {
  // ========== ÍNDICES BRASILEIROS ==========
  'IBOVESPA': '^BVSP',
  'IBOV': '^BVSP',
  'IBXL': '^IBXL', // Índice Brasil 50
  'IBXX': '^IBXX', // Índice Brasil 100
  'IDIV': '^IDIV', // Índice Dividendos
  'IFNC': '^IFNC', // Índice Financeiro
  'IGCT': '^IGCT', // Índice Governança Corporativa
  'IMAT': '^IMAT', // Índice Materiais Básicos
  'ICON': '^ICON', // Índice Consumo
  'IEEX': '^IEEX', // Índice Energia Elétrica
  'IFIX': '^IFIX', // Índice de Fundos Imobiliários
  'IMOB': '^IMOB', // Índice Imobiliário
  'IVBX': '^IVBX', // Índice Valor
  'SMLL': '^SMLL', // Índice Small Cap

  // ========== MOEDAS ==========
  'DOLAR': 'BRL=X',
  'DOLARCOM': 'BRL=X',
  'EURO': 'EURBRL=X',
  'LIBRA': 'GBPBRL=X',
  'PESOARG': 'ARSBRL=X',
  'YUAN': 'CNYBRL=X',
  'YEN': 'JPYBRL=X',
  'FRANCO': 'CHFBRL=X',
  'DOLARAUS': 'AUDBRL=X',
  'DOLARCAN': 'CADBRL=X',
  'BITCOIN': 'BTC-USD',

  // ========== COMMODITIES ==========
  'OURO': 'GC=F',
  'PETROLEO': 'CL=F',
  'PRATA': 'SI=F',
  'SOJA': 'ZS=F',
  'CAFE': 'KC=F',
  'MILHO': 'ZC=F',
  'BOI': 'LE=F',
  'ALGODAO': 'CT=F',
  'SUCO': 'OJ=F',
  'GASNAT': 'NG=F',
  'COBRE': 'HG=F',
  'ETANOL': 'RB=F',
  'TRIGO': 'ZW=F',
  'ACUCAR': 'SB=F',

  // ========== ÍNDICES INTERNACIONAIS ==========
  // Americas
  'SP500': '^GSPC',
  'NASDAQ': '^IXIC',
  'DOWJONES': '^DJI',
  'RUSSELL2000': '^RUT',
  'SP400': '^MID',
  'TSX': '^GSPTSE', // Canadá
  'MERVAL': '^MERV', // Argentina
  'IPSA': '^IPSA', // Chile
  'MEXBOL': '^MXX', // México
  'BOVESHK': '^BOVESHK', // Índice Brasil em Hong Kong

  // Europa
  'FTSE100': '^FTSE', // Reino Unido
  'DAX': '^GDAXI', // Alemanha
  'CAC40': '^FCHI', // França
  'IBEX35': '^IBEX', // Espanha
  'FTSE MIB': '^FTSEMIB', // Itália
  'AEX': '^AEX', // Holanda
  'PSI20': '^PSI20', // Portugal
  'SMI': '^SSMI', // Suíça
  'OMXS30': '^OMX', // Suécia

  // Ásia/Pacífico
  'NIKKEI': '^N225', // Japão
  'HANG SENG': '^HSI', // Hong Kong
  'SSE': '000001.SS', // Shanghai Composite
  'SZSE': '399001.SZ', // Shenzhen
  'STI': '^STI', // Singapura
  'KOSPI': '^KS11', // Coreia do Sul
  'TSEC': '^TWII', // Taiwan
  'ASX200': '^AXJO', // Austrália
  'NZX50': '^NZ50', // Nova Zelândia
  'SENSEX': '^BSESN', // Índia
  'NIFTY50': '^NSEI', // Índia

  // ========== AÇÕES BRASILEIRAS ==========
  // Petrobras
  'PETROBRAS': 'PETR4.SA',
  'PETR3': 'PETR3.SA',
  'PETR4': 'PETR4.SA',
  
  // Vale
  'VALE': 'VALE3.SA',
  'VALE3': 'VALE3.SA',
  'VALE5': 'VALE5.SA',
  
  // Bancos
  'ITAU': 'ITUB4.SA',
  'ITUB3': 'ITUB3.SA',
  'ITUB4': 'ITUB4.SA',
  'BRADESCO': 'BBDC4.SA',
  'BBDC3': 'BBDC3.SA',
  'BBDC4': 'BBDC4.SA',
  'BBAS3': 'BBAS3.SA',
  'BANRISUL': 'BRSR6.SA',
  'SANTANDER': 'SANB11.SA',
  
  // Energia
  'ELETROBRAS': 'ELET3.SA',
  'ELET6': 'ELET6.SA',
  'ENGIE': 'EGIE3.SA',
  'COPEL': 'CPLE6.SA',
  'CPFL': 'CPFE3.SA',
  'NEOENERGIA': 'NEOE3.SA',
  
  // Varejo
  'MAGALU': 'MGLU3.SA',
  'VIA': 'VIIA3.SA',
  'AMERICANAS': 'LAME4.SA',
  'LJCD': 'LVTC3.SA',
  'GRENDENE': 'GRND3.SA',
  'NATURA': 'NTCO3.SA',
  
  // Outras grandes empresas
  'AMBEV': 'ABEV3.SA',
  'WEG': 'WEGE3.SA',
  'B3': 'B3SA3.SA',
  'SUZANO': 'SUZB3.SA',
  'JBS': 'JBSS3.SA',
  'LOCALIZA': 'RENT3.SA',
  'RAIADROGASIL': 'RADL3.SA',
  'RUMO': 'RAIL3.SA',
  'CCR': 'CCRO3.SA',
  'GERDAU': 'GGBR4.SA',
  'USIMINAS': 'USIM5.SA',
  'CSN': 'CSNA3.SA',
  'BRF': 'BRFS3.SA',
  'BRASKEM': 'BRKM5.SA',
  'EMBRAER': 'EMBR3.SA',
  'AZUL': 'AZUL4.SA',
  'GOL': 'GOLL4.SA',
  'CVC': 'CVCB3.SA',
  'HAPVIDA': 'HAPV3.SA',
  'QUALICORP': 'QUAL3.SA',
  
  // ========== FIIs (Fundos Imobiliários) ==========
  'HGLG11': 'HGLG11.SA',
  'XPML11': 'XPML11.SA',
  'KNRI11': 'KNRI11.SA',
  'HGBS11': 'HGBS11.SA',
  'HGRE11': 'HGRE11.SA',
  'XPLG11': 'XPLG11.SA',
  'BCFF11': 'BCFF11.SA',
  'BRCR11': 'BRCR11.SA',
  'VISC11': 'VISC11.SA',
  'HFOF11': 'HFOF11.SA',
  
  // ========== ETFs BRASILEIROS ==========
  'BOVA11': 'BOVA11.SA',
  'SMAL11': 'SMAL11.SA',
  'IVVB11': 'IVVB11.SA',
  'BRAX11': 'BRAX11.SA',
  'ECOO11': 'ECOO11.SA',
  'DIVO11': 'DIVO11.SA',
  'FIND11': 'FIND11.SA',
  'GOLD11': 'GOLD11.SA',
  'SPXI11': 'SPXI11.SA',
  'BBSD11': 'BBSD11.SA',
  
  // ========== AÇÕES INTERNACIONAIS ==========
  // EUA - Tecnologia
  'APPLE': 'AAPL',
  'MICROSOFT': 'MSFT',
  'AMAZON': 'AMZN',
  'GOOGLE': 'GOOGL',
  'META': 'META',
  'TESLA': 'TSLA',
  'NVIDIA': 'NVDA',
  'NETFLIX': 'NFLX',
  'ADOBE': 'ADBE',
  'SALESFORCE': 'CRM',
  'ORACLE': 'ORCL',
  'INTEL': 'INTC',
  'AMD': 'AMD',
  'QUALCOMM': 'QCOM',
  
  // EUA - Financeiras
  'BERKSHIRE': 'BRK-B',
  'VISA': 'V',
  'JPMORGAN': 'JPM',
  'MASTERCARD': 'MA',
  'GOLDMAN': 'GS',
  'MORGANSTANLEY': 'MS',
  'BOFA': 'BAC',
  'WELLSFARGO': 'WFC',
  'BLACKROCK': 'BLK',
  
  // EUA - Varejo e Consumo
  'WALMART': 'WMT',
  'COSTCO': 'COST',
  'NIKE': 'NKE',
  'DISNEY': 'DIS',
  'STARBUCKS': 'SBUX',
  'MCDONALDS': 'MCD',
  'COCACOLA': 'KO',
  'PEPSI': 'PEP',
  'PROCTER': 'PG',
  
  // EUA - Saúde
  'JOHNSON': 'JNJ',
  'PFIZER': 'PFE',
  'MODERNA': 'MRNA',
  'NOVAVAX': 'NVAX',
  'MERCK': 'MRK',
  'ABBVIE': 'ABBV',
  'ELILILLY': 'LLY',
  'AMGEN': 'AMGN',
  
  // Europa
  'NESTLE': 'NESN.SW', // Suíça
  'NOVARTIS': 'NOVN.SW', // Suíça
  'SAP': 'SAP.DE', // Alemanha
  'SIEMENS': 'SIE.DE', // Alemanha
  'LVMH': 'MC.PA', // França
  'TOTAL': 'TTE.PA', // França
  'UNILEVER': 'ULVR.L', // UK
  'HSBC': 'HSBA.L',
  
  // Ásia
  'ALIBABA': 'BABA',
  'TENCENT': '0700.HK',
  'SAMSUNG': '005930.KS', // Coreia
  'TOYOTA': '7203.T', // Japão
  'SONY': '6758.T', // Japão
  'HONDA': '7267.T', // Japão
  'CANON': '7751.T', // Japão
  
  // ========== ETFs INTERNACIONAIS ==========
  'SPY': 'SPY', // S&P 500
  'QQQ': 'QQQ', // Nasdaq 100
  'DIA': 'DIA', // Dow Jones
  'IWM': 'IWM', // Russell 2000
  'EEM': 'EEM', // Mercados Emergentes
  'IVV': 'IVV', // S&P 500 (iShares)
  'VTI': 'VTI', // Total Stock Market
  'VOO': 'VOO', // S&P 500 (Vanguard)
  'ARKK': 'ARKK', // ARK Innovation
  'GLD': 'GLD', // Ouro
  'SLV': 'SLV', // Prata
  'USO': 'USO', // Petróleo
  'TLT': 'TLT', // Títulos longos
  'HYG': 'HYG', // High Yield Bonds
  
  // ========== CRIPTOMOEDAS ==========
  'ETHEREUM': 'ETH-USD',
  'BNB': 'BNB-USD',
  'XRP': 'XRP-USD',
  'SOLANA': 'SOL-USD',
  'CARDANO': 'ADA-USD',
  'DOGECOIN': 'DOGE-USD',
  'POLKADOT': 'DOT-USD',
  'AVALANCHE': 'AVAX-USD',
  'POLYGON': 'MATIC-USD',
  'LITECOIN': 'LTC-USD',
  'BITCOINCASH': 'BCH-USD',
  'STELLAR': 'XLM-USD',
  'CHAINLINK': 'LINK-USD',
  'UNISWAP': 'UNI-USD',
  'FILECOIN': 'FIL-USD'
};

// Helper to determine asset type based on symbol pattern
const getAssetTypeFromSymbol = (symbol: string): keyof MarketDataResponse | null => {
  if (symbol.endsWith('\.SA')) {
     // Could be Stocks, FIIs, or ETFs. Need more specific mapping or logic if needed.
     // For now, assuming .SA are mainly stocks/FIIs/ETFs and will rely on the input lists.
     return null; // Let's rely on input lists for .SA types for now
  }
  if (symbol.endsWith('-USD')) return 'cryptos';
  if (symbol.endsWith('=X')) return 'currencies';
  if (symbol.endsWith('=F')) return 'commodities';
  if (symbol.startsWith('^')) return 'indices';
  // Defaulting others to stocks if not otherwise identified, but input lists are more reliable
  return null; 
};

export const fetchYahooFinanceData = async (symbol: string): Promise<StockData | null> => {
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!symbol) {
        console.error('Invalid symbol: Symbol cannot be empty');
        return null;
      }

      // Find the key in symbolMappings for the given symbol value (case-insensitive lookup)
      const matchedKey = Object.keys(symbolMappings).find(
          key => symbolMappings[key].toUpperCase() === symbol.toUpperCase()
      );
      const assetName = matchedKey || symbol; // Use the key as a potential friendly name, fallback to symbol

      // Use the provided symbol directly, as it should be the Yahoo Finance format
      const yahooSymbol = symbol;

      try {
        const response = await axios.get(`${YAHOO_FINANCE_API_URL}/${yahooSymbol}`, {
          params: { interval: '1d', range: '1d' },
          timeout: REQUEST_TIMEOUT
        });

        // Log the response from Yahoo Finance API
        console.log(`Response from Yahoo Finance API for ${yahooSymbol}:`, response.data);

        const result = response.data.chart?.result?.[0];
        if (!result) {
           console.warn(`No chart data found for symbol ${yahooSymbol}`);
           return null; // No chart data means no valid asset data
        }

        const meta = result.meta;
         // Basic check if essential data exists
        if (meta.regularMarketPrice === undefined || meta.chartPreviousClose === undefined) {
             console.warn(`Incomplete market data for symbol ${yahooSymbol}`);
             return null; // Incomplete data
        }

        const previousClose = meta.chartPreviousClose || 0;
        const currentPrice = meta.regularMarketPrice || 0;
        const change = currentPrice - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

        return {
          symbol: symbol, // Return the original requested symbol
          name: assetName, // Include potential friendly name from mapping
          price: currentPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume,
          currency: meta.currency || (symbol.endsWith('.SA') ? 'BRL' : 'USD') // Infer currency if not provided
        };
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt} failed for ${symbol} (Yahoo Symbol: ${yahooSymbol}): ${error.message || error}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        console.error(`Error fetching data for ${symbol} (Yahoo Symbol: ${yahooSymbol}) after ${maxRetries} attempts:`, error.message || error);
        return null;
      }

    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt} failed for ${symbol}: ${error.message || error}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      console.error(`Error processing symbol ${symbol} after ${maxRetries} attempts:`, error.message || error);
      return null;
    }
  }

  return null;
};

interface MarketDataResponse {
  stocks: StockData[];
  cryptos: StockData[];
  commodities: StockData[];
  fiis: StockData[];
  etfs: StockData[];
  currencies: StockData[];
  indices: StockData[];
  lastUpdated: string;
}

export const getMarketData = async ({
  symbols = [],
  cryptoList = [],
  commoditiesList = [],
  fiisList = [],
  etfsList = [],
  currenciesList = [],
  manualAssets = [],
  customIndicesList = []
}: {
  symbols?: string[];
  cryptoList?: string[];
  commoditiesList?: string[];
  fiisList?: string[];
  etfsList?: string[];
  currenciesList?: string[];
  manualAssets?: string[];
  customIndicesList?: string[];
}): Promise<MarketDataResponse> => {
  try {
    console.log('getMarketData: Received customIndicesList:', customIndicesList);

    // Combine all unique symbols requested from frontend
    const allSymbolsToFetchSet = new Set([
      ...symbols,
      ...cryptoList,
      ...commoditiesList,
      ...fiisList,
      ...etfsList,
      ...currenciesList,
      ...manualAssets,
      ...customIndicesList // Include index symbols
    ]);

    const allSymbolsToFetch = Array.from(allSymbolsToFetchSet);
    console.log('getMarketData: Fetching data for symbols:', allSymbolsToFetch);

    // Buscar dados para todos os ativos em uma única Promise.all (mais eficiente)
    const results = await Promise.all(
      allSymbolsToFetch.map(symbol => fetchYahooFinanceData(symbol))
    );

    // Criar um map para lookup rápido, usando o símbolo retornado por fetchYahooFinanceData
    const resultsMap = new Map<string, StockData>();
    results.forEach(item => {
      if (item) {
        // Use the symbol exactly as returned by fetchYahooFinanceData as the map key
        resultsMap.set(item.symbol, item);
      }
    });
    console.log('getMarketData: resultsMap keys:', Array.from(resultsMap.keys()));

    const marketData: MarketDataResponse = {
      stocks: [],
      cryptos: [],
      commodities: [],
      fiis: [],
      etfs: [],
      currencies: [],
      indices: [],
      lastUpdated: new Date().toISOString()
    };

    // Populate the marketData object using the original lists from the frontend
    // Look up in the map using the symbols from the original lists.

    symbols.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (item) marketData.stocks.push(item);
    });

    cryptoList.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (item) marketData.cryptos.push(item);
    });

    commoditiesList.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (item) marketData.commodities.push(item);
    });

    fiisList.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (item) marketData.fiis.push(item);
    });

    etfsList.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (item) marketData.etfs.push(item);
    });

    currenciesList.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (item) marketData.currencies.push(item);
    });

    // Populate indices using symbols from customIndicesList
    customIndicesList.forEach(symbol => {
      // Look up using the symbol as it is in the customIndicesList (should include ^)
      const item = resultsMap.get(symbol);
      if (item) marketData.indices.push(item);
    });

    // Handle manualAssets - potencialmente mistos
    manualAssets.forEach(symbol => {
      const item = resultsMap.get(symbol);
      if (
        item &&
        !marketData.stocks.some(s => s.symbol === symbol) &&
        !marketData.cryptos.some(c => c.symbol === symbol) &&
        !marketData.commodities.some(c => c.symbol === symbol) &&
        !marketData.fiis.some(f => f.symbol === symbol) &&
        !marketData.etfs.some(e => e.symbol === symbol) &&
        !marketData.currencies.some(c => c.symbol === symbol) &&
        !marketData.indices.some(i => i.symbol === symbol)
      ) {
        // If it's not already categorized, add it to stocks as a fallback
        marketData.stocks.push(item);
      }
    });

    console.log('getMarketData: Returning marketData with indices:', marketData.indices.map(i => i.symbol));

    return marketData;

  } catch (error: any) {
    console.error('getMarketData: Error in getMarketData:', error);
    // Return empty arrays on error to prevent frontend crashes
    return {
      stocks: [],
      cryptos: [],
      commodities: [],
      fiis: [],
      etfs: [],
      currencies: [],
      indices: [],
      lastUpdated: new Date().toISOString()
    };
  }
};