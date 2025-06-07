//frontend/services/yahooFinance.ts
interface YahooFinanceResponse {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  currency: string;
}

const SYMBOL_MAP: Record<string, string> = {
  '^BVSP': '^BVSP', // Formato correto para o Ibovespa
  'BRL=X': 'BRL=X', // Dólar comercial
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  'SOL': 'SOL-USD'
};

const FALLBACK_VALUES: Record<string, YahooFinanceResponse> = {
  '^BVSP': {
    symbol: '^BVSP',
    price: 120000,
    change: 0,
    changePercent: 0,
    volume: 0,
    currency: 'BRL'
  }
};

export const fetchYahooFinanceData = async (symbol: string): Promise<YahooFinanceResponse> => {
  try {
    const effectiveSymbol = SYMBOL_MAP[symbol] || symbol;

    // Verifica se o símbolo termina com .SA ou é um índice
    const shouldAddSuffix = !effectiveSymbol.endsWith('.SA') && 
                          !effectiveSymbol.startsWith('^') && 
                          !effectiveSymbol.includes('=') &&
                          !effectiveSymbol.endsWith('-USD');

    const symbolVariations = [
      effectiveSymbol,
      shouldAddSuffix ? `${effectiveSymbol}.SA` : effectiveSymbol,
      effectiveSymbol.replace('.SA', '.BR')
    ];

    let lastError: Error | null = null;

    for (const variation of symbolVariations) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${variation}?interval=1d`,
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();

          if (!data.chart?.result?.[0]?.meta) {
            throw new Error('Invalid data structure');
          }

          const meta = data.chart.result[0].meta;
          const previousClose = meta.chartPreviousClose || 0;
          const currentPrice = meta.regularMarketPrice || 0;
          const change = currentPrice - previousClose;
          const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

          return {
            symbol: symbol, // Mantém o símbolo original solicitado
            price: currentPrice,
            change,
            changePercent,
            volume: meta.regularMarketVolume || 0,
            currency: meta.currency || (variation.endsWith('.SA') ? 'BRL' : 'USD')
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    // Fallback para símbolos conhecidos quando a API falha
    if (FALLBACK_VALUES[symbol]) {
      console.warn(`Using fallback value for ${symbol}`);
      return FALLBACK_VALUES[symbol];
    }

    throw lastError || new Error(`All variations failed for ${symbol}`);
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    throw new Error(`Failed to fetch data for ${symbol}`);
  }
};