import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
}

interface CryptoData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency: string;
}

interface MarketIndices {
  ibovespa: number;
  dollar: number;
}

interface MarketData {
  indices: MarketIndices;
  stocks: StockData[];
  cryptos: CryptoData[];
  lastUpdated: string;
}

interface DashboardContextType {
  marketData: MarketData | null;
  loadingMarketData: boolean;
  marketError: string | null;
  selectedStocks: string[];
  selectedCryptos: string[];
  setSelectedStocks: (stocks: string[]) => void;
  setSelectedCryptos: (cryptos: string[]) => void;
  refreshMarketData: (options?: { silent?: boolean }) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_STOCKS = ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA'];
const DEFAULT_CRYPTOS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) return String((error as { message: unknown }).message);
  return 'Unknown market data error';
}

function getFallbackMarketData(): MarketData {
  return {
    stocks: [],
    cryptos: [],
    indices: { ibovespa: 0, dollar: 0 },
    lastUpdated: new Date().toISOString()
  };
}

function isValidMarketData(data: unknown): data is MarketData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'stocks' in data &&
    'cryptos' in data &&
    'indices' in data &&
    'lastUpdated' in data
  );
}

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<string[]>(DEFAULT_STOCKS);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(DEFAULT_CRYPTOS);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refreshMarketData = useCallback(async ({ silent = false } = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!silent) {
      setLoadingMarketData(true);
      setMarketError(null);
    }

    try {
      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          symbols: selectedStocks,
          cryptos: selectedCryptos,
          indices: ['^BVSP', 'BRL=X']
        }),
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch market data');
      }

      const data = await response.json();
      
      if (!isValidMarketData(data)) {
        throw new Error('Invalid market data structure received from API');
      }

      setMarketData(data);
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        const errorMessage = getErrorMessage(error);
        console.error('Fetch error:', errorMessage);
        if (!silent) setMarketError(errorMessage);
        setMarketData(prev => prev || getFallbackMarketData());
      }
    } finally {
      if (!controller.signal.aborted && !silent) {
        setLoadingMarketData(false);
      }
    }
  }, [selectedStocks, selectedCryptos]);

  useEffect(() => {
    refreshMarketData();
    const intervalId = setInterval(() => refreshMarketData({ silent: true }), 300000);
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [refreshMarketData]);

  const contextValue: DashboardContextType = {
    marketData,
    loadingMarketData,
    marketError,
    selectedStocks,
    selectedCryptos,
    setSelectedStocks,
    setSelectedCryptos,
    refreshMarketData
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
};