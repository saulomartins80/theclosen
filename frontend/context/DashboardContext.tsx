// context/DashboardContext.tsx
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

interface MarketData {
  stocks: StockData[];
  cryptos: CryptoData[];
  indices: Record<string, number>;
  commodities: StockData[];
  lastUpdated: string;
}

interface CustomIndex {
  symbol: string;
  name: string;
}

interface DashboardContextType {
  marketData: MarketData | null;
  loadingMarketData: boolean;
  marketError: string | null;
  selectedStocks: string[];
  selectedCryptos: string[];
  selectedCommodities: string[];
  manualAssets: string[];
  customIndices: CustomIndex[];
  refreshMarketData: (options?: { silent?: boolean }) => Promise<void>;
  setManualAssets: (assets: string[]) => void;
  setSelectedStocks: (stocks: string[]) => void;
  setSelectedCryptos: (cryptos: string[]) => void;
  setSelectedCommodities: (commodities: string[]) => void;
  setCustomIndices: (indices: CustomIndex[]) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Valores padrão
const DEFAULT_STOCKS = ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA'];
const DEFAULT_CRYPTOS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];
const DEFAULT_COMMODITIES = ['GC=F']; // Ouro
const DEFAULT_CUSTOM_INDICES = [
  { symbol: '^BVSP', name: 'IBOVESPA' },
  { symbol: 'BRL=X', name: 'Dólar Americano' }
];

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<string[]>(DEFAULT_STOCKS);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(DEFAULT_CRYPTOS);
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>(DEFAULT_COMMODITIES);
  const [manualAssets, setManualAssets] = useState<string[]>([]);
  const [customIndices, setCustomIndices] = useState<CustomIndex[]>(DEFAULT_CUSTOM_INDICES);
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
        },
        body: JSON.stringify({
          symbols: selectedStocks,
          cryptos: selectedCryptos,
          commodities: selectedCommodities,
          manualAssets,
          customIndices: customIndices.map(index => index.symbol)
        }),
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch market data');
      }

      const data = await response.json();
      setMarketData(data);
    } catch (error: unknown) {
      if (!silent) {
        setMarketError(error instanceof Error ? error.message : 'Unknown error');
        setMarketData(prev => prev || {
          stocks: [],
          cryptos: [],
          indices: {},
          commodities: [],
          lastUpdated: new Date().toISOString()
        });
      }
    } finally {
      if (!silent) {
        setLoadingMarketData(false);
      }
    }
  }, [selectedStocks, selectedCryptos, selectedCommodities, manualAssets, customIndices]);

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
    selectedCommodities,
    manualAssets,
    customIndices,
    refreshMarketData,
    setManualAssets,
    setSelectedStocks,
    setSelectedCryptos,
    setSelectedCommodities,
    setCustomIndices
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};