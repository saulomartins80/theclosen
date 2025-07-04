import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { marketDataAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

interface ManualAsset {
  symbol: string;
  price: number;
  change: number;
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
  marketCap?: number;
  name?: string;
  exchange?: string;
}

interface MarketData {
  stocks: StockData[];
  cryptos: StockData[];
  indices: StockData[]; 
  fiis: StockData[];
  etfs: StockData[];
  commodities: StockData[];
  currencies: StockData[];
  lastUpdated: string;
}

export interface CustomIndex {
  symbol: string;
  name: string;
}

export interface DashboardContextType {
  marketData: MarketData | null;
  loadingMarketData: boolean;
  marketError: string | null;
  selectedStocks: string[];
  selectedCryptos: string[];
  selectedCommodities: string[];
  selectedFiis: string[];
  selectedEtfs: string[];
  selectedCurrencies: string[];
  manualAssets: ManualAsset[];
  customIndices: CustomIndex[]; // Único estado para índices
  setCustomIndices: (indices: CustomIndex[]) => void; // Substitui setSelectedIndices
  refreshMarketData: (options?: { silent?: boolean }) => Promise<void>;
  addCustomIndex: (index: { symbol: string; name: string }) => void;
  removeCustomIndex: (symbol: string) => void;
  updateCustomIndex: (oldSymbol: string, newIndex: CustomIndex) => void;
  removeStock: (symbol: string) => void;
  removeCrypto: (symbol: string) => void;
  removeCommodity: (symbol: string) => void;
  removeFii: (symbol: string) => void;
  removeEtf: (symbol: string) => void;
  removeCurrency: (symbol: string) => void;
  setManualAssets: (assets: ManualAsset[]) => void;
  setSelectedStocks: (stocks: string[]) => void;
  setSelectedCryptos: (cryptos: string[]) => void;
  setSelectedCommodities: (commodities: string[]) => void;
  setSelectedFiis: (fiis: string[]) => void;
  setSelectedEtfs: (etfs: string[]) => void;
  setSelectedCurrencies: (currencies: string[]) => void;
  availableStocks: string[];
  availableCryptos: string[];
  availableCommodities: string[];
  availableFiis: string[];
  availableEtfs: string[];
  availableCurrencies: string[];
  availableIndices: string[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Valores padrão atualizados
const DEFAULT_STOCKS = ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA'];
const DEFAULT_CRYPTOS = ['BTC-USD', 'ETH-USD'];
const DEFAULT_COMMODITIES = ['GC=F', 'CL=F'];
const DEFAULT_FIIS = ['HGLG11.SA', 'KNRI11.SA'];
const DEFAULT_ETFS = ['BOVA11.SA', 'IVVB11.SA'];
const DEFAULT_CURRENCIES = ['BRL=X', 'EURBRL=X'];
const DEFAULT_CUSTOM_INDICES = [
  { symbol: '^BVSP', name: 'IBOVESPA' },
  { symbol: '^GSPC', name: 'S&P 500' }
];

// Listas completas de ativos disponíveis
const EXAMPLE_AVAILABLE_STOCKS = [
  // Ações brasileiras
  'PETR3.SA', 'PETR4.SA', 'VALE3.SA', 'ITUB3.SA', 'ITUB4.SA', 
  'BBDC3.SA', 'BBDC4.SA', 'BBAS3.SA', 'ABEV3.SA', 'WEGE3.SA',
  'B3SA3.SA', 'SUZB3.SA', 'JBSS3.SA', 'RENT3.SA', 'RADL3.SA',
  
  // Ações internacionais
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA',
  'JPM', 'V', 'MA', 'JNJ', 'PG', 'WMT', 'DIS', 'NFLX'
];

const EXAMPLE_AVAILABLE_CRYPTOS = [
  'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD',
  'ADA-USD', 'DOGE-USD', 'DOT-USD', 'AVAX-USD', 'MATIC-USD'
];

const EXAMPLE_AVAILABLE_COMMODITIES = [
  'GC=F', 'SI=F', 'CL=F', 'NG=F', 'ZC=F', 'ZS=F', 'KC=F',
  'LE=F', 'CT=F', 'OJ=F', 'HG=F', 'RB=F', 'ZW=F', 'SB=F'
];

const EXAMPLE_AVAILABLE_FIIS = [
  'HGLG11.SA', 'XPML11.SA', 'KNRI11.SA', 'HGBS11.SA', 'HGRE11.SA',
  'XPLG11.SA', 'BCFF11.SA', 'BRCR11.SA', 'VISC11.SA', 'HFOF11.SA'
];

const EXAMPLE_AVAILABLE_ETFS = [
  'BOVA11.SA', 'SMAL11.SA', 'IVVB11.SA', 'BRAX11.SA', 'ECOO11.SA',
  'DIVO11.SA', 'FIND11.SA', 'GOLD11.SA', 'SPXI11.SA', 'BBSD11.SA'
];

const EXAMPLE_AVAILABLE_CURRENCIES = [
  'BRL=X', 'EURBRL=X', 'GBPBRL=X', 'ARSBRL=X', 'CNYBRL=X',
  'JPYBRL=X', 'CHFBRL=X', 'AUDBRL=X', 'CADBRL=X'
];

const EXAMPLE_AVAILABLE_INDICES = [
  '^BVSP', '^IBXL', '^IBXX', '^IDIV', '^IFNC', '^IGCT',
  '^GSPC', '^IXIC', '^DJI', '^FTSE', '^GDAXI', '^FCHI',
  '^N225', '^HSI', '^STI', '^KS11', '^TWII', '^AXJO'
];

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  // Estados para ativos selecionados
  const [selectedStocks, setSelectedStocks] = useState<string[]>(DEFAULT_STOCKS);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(DEFAULT_CRYPTOS);
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>(DEFAULT_COMMODITIES);
  const [selectedFiis, setSelectedFiis] = useState<string[]>(DEFAULT_FIIS);
  const [selectedEtfs, setSelectedEtfs] = useState<string[]>(DEFAULT_ETFS);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(DEFAULT_CURRENCIES);
  const [manualAssets, setManualAssets] = useState<ManualAsset[]>([]);
  const [customIndices, setCustomIndices] = useState<CustomIndex[]>(DEFAULT_CUSTOM_INDICES);

  // Estados para ativos disponíveis
  const [availableStocks, setAvailableStocks] = useState<string[]>(EXAMPLE_AVAILABLE_STOCKS);
  const [availableCryptos, setAvailableCryptos] = useState<string[]>(EXAMPLE_AVAILABLE_CRYPTOS);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>(EXAMPLE_AVAILABLE_COMMODITIES);
  const [availableFiis, setAvailableFiis] = useState<string[]>(EXAMPLE_AVAILABLE_FIIS);
  const [availableEtfs, setAvailableEtfs] = useState<string[]>(EXAMPLE_AVAILABLE_ETFS);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(EXAMPLE_AVAILABLE_CURRENCIES);
  const [availableIndices, setAvailableIndices] = useState<string[]>(EXAMPLE_AVAILABLE_INDICES);

  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const { isAuthReady, user } = useAuth();

  const refreshMarketData = useCallback(async ({ silent = false } = {}) => {
    if (!user) {
      console.log('[DashboardContext] No authenticated user, skipping market data refresh');
      return;
    }

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
      const requestBody = {
        symbols: selectedStocks,
        cryptos: selectedCryptos,
        commodities: selectedCommodities,
        fiis: selectedFiis,
        etfs: selectedEtfs,
        currencies: selectedCurrencies,
        manualAssets,
        customIndicesList: customIndices.map(index => index.symbol)
      };
      console.log('[DashboardContext] requestBody:', requestBody);

      const data = await marketDataAPI.getMarketData(requestBody);
      setMarketData(data);
      console.log('[DashboardContext] Market data after setMarketData:', data);

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      if (!silent) {
        setMarketError(error instanceof Error ? error.message : 'Erro ao buscar dados do mercado.');
        setMarketData(null);
      }
    } finally {
      if (!silent) setLoadingMarketData(false);
    }
  }, [
    selectedStocks,
    selectedCryptos,
    selectedCommodities,
    selectedFiis,
    selectedEtfs,
    selectedCurrencies,
    manualAssets,
    customIndices,
    user
  ]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      console.log('[DashboardContext] Auth not ready or no user, skipping market data refresh');
      return;
    }

    // Lista de rotas que precisam de dados de mercado
    const protectedRoutes = ['/dashboard', '/investimentos', '/metas', '/transacoes', '/configuracoes', '/profile', '/assinaturas', '/milhas'];
    const isProtectedRoute = protectedRoutes.some(route => router.pathname.startsWith(route));

    if (!isProtectedRoute) {
      console.log('[DashboardContext] Not on protected route, skipping market data refresh. Path:', router.pathname);
      return;
    }

    console.log('[DashboardContext] useEffect: refreshing market data...');
    refreshMarketData();
    // Fetch every 5 minutes (300000 ms)
    const intervalId = setInterval(() => refreshMarketData({ silent: true }), 300000);
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [refreshMarketData, isAuthReady, user, router.pathname]);

  const addCustomIndex = (index: { symbol: string; name: string }) => {
    const symbolToAdd = index.symbol;
    // Add a basic check if the symbol is already a default index or another selected type
    const isAlreadySelected = customIndices.some(idx => idx.symbol === symbolToAdd) ||
                              selectedStocks.includes(symbolToAdd) ||
                              selectedCryptos.includes(symbolToAdd) ||
                              selectedCommodities.includes(symbolToAdd) ||
                              selectedFiis.includes(symbolToAdd) ||
                              selectedEtfs.includes(symbolToAdd) ||
                              selectedCurrencies.includes(symbolToAdd) ||
                              manualAssets.some(asset => asset.symbol === symbolToAdd);

    if (!isAlreadySelected) {
      setCustomIndices(prevIndices => [...prevIndices, { symbol: symbolToAdd, name: index.name.trim() || symbolToAdd }]);
    } else {
      console.warn(`Index or asset with symbol ${symbolToAdd} is already selected or added.`);
    }
  };

  const removeCustomIndex = (symbol: string) => {
    setCustomIndices(prevIndices => prevIndices.filter(index => index.symbol !== symbol));
  };

  const updateCustomIndex = (oldSymbol: string, newIndex: CustomIndex) => {
    const newSymbol = newIndex.symbol;
    const newName = newIndex.name.trim() || newSymbol;

    // Prevent updating to a symbol that already exists in any selected list
     const isAlreadySelected = customIndices.some(idx => idx.symbol === newSymbol && idx.symbol !== oldSymbol) ||
                               selectedStocks.includes(newSymbol) ||
                               selectedCryptos.includes(newSymbol) ||
                               selectedCommodities.includes(newSymbol) ||
                               selectedFiis.includes(newSymbol) ||
                               selectedEtfs.includes(newSymbol) ||
                               selectedCurrencies.includes(newSymbol) ||
                               manualAssets.some(asset => asset.symbol === newSymbol);

    if (!isAlreadySelected) {
        setCustomIndices(prevIndices =>
          prevIndices.map(index =>
            index.symbol === oldSymbol ? { symbol: newSymbol, name: newName } : index
          )
        );
    } else {
         console.warn(`Cannot update index. Symbol ${newSymbol} is already selected or added.`);
    }
  };

  // Funções para remover ativos - Logic seems correct, just ensuring they are present
  const removeStock = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s !== symbol));
  };

  const removeCrypto = (symbol: string) => {
    setSelectedCryptos(prev => prev.filter(s => s !== symbol));
  };

  const removeCommodity = (symbol: string) => {
    setSelectedCommodities(prev => prev.filter(s => s !== symbol));
  };

  const removeFii = (symbol: string) => {
    setSelectedFiis(prev => prev.filter(s => s !== symbol));
  };

  const removeEtf = (symbol: string) => {
    setSelectedEtfs(prev => prev.filter(s => s !== symbol));
  };

  const removeCurrency = (symbol: string) => {
    setSelectedCurrencies(prev => prev.filter(s => s !== symbol));
  };

  const contextValue: DashboardContextType = {
    marketData,
    loadingMarketData,
    marketError,
    selectedStocks,
    selectedCryptos,
    selectedCommodities,
    selectedFiis,
    selectedEtfs,
    selectedCurrencies,
    manualAssets,
    customIndices,
    setCustomIndices, // Use diretamente no lugar de setSelectedIndices
    refreshMarketData,
    addCustomIndex,
    removeCustomIndex,
    updateCustomIndex,
    removeStock,
    removeCrypto,
    removeCommodity,
    removeFii,
    removeEtf,
    removeCurrency,
    setManualAssets,
    setSelectedStocks,
    setSelectedCryptos,
    setSelectedCommodities,
    setSelectedFiis,
    setSelectedEtfs,
    setSelectedCurrencies,
    availableStocks,
    availableCryptos,
    availableCommodities,
    availableFiis,
    availableEtfs,
    availableCurrencies,
    availableIndices
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