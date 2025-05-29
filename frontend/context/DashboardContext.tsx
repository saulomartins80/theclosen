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

export interface DashboardContextType {
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
  addCustomIndex: (index: { symbol: string; name: string }) => void;
  removeCustomIndex: (symbol: string) => void;
  updateCustomIndex: (oldSymbol: string, newIndex: CustomIndex) => void;
  removeStock: (symbol: string) => void;
  removeCrypto: (symbol: string) => void;
  removeCommodity: (symbol: string) => void;
  availableStocks: string[];
  availableCryptos: string[];
  availableCommodities: string[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Valores padrão
const DEFAULT_STOCKS = ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA'];
const DEFAULT_CRYPTOS = ['BTC-USD', 'ETH-USD'];
const DEFAULT_COMMODITIES = ['GC=F']; // Ouro
const DEFAULT_CUSTOM_INDICES = [
  { symbol: '^BVSP', name: 'IBOVESPA' },
  { symbol: 'BRL=X', name: 'Dólar Americano' }
];

// Adicione este mapeamento no início do arquivo
const SYMBOL_MAPPING: Record<string, string> = {
  'IBOVESPA': '^BVSP',
  'DOLAR': 'BRL=X',
  'DÓLAR': 'BRL=X',
  'SP500': '^GSPC',
  'S&P500': '^GSPC',
  'NASDAQ': '^IXIC',
  'DOWJONES': '^DJI',
  'BITCOIN': 'BTC-USD',
  'BTC': 'BTC-USD',
  'OURO': 'GC=F',
  'PETROLEO': 'CL=F',
  'PETRÓLEO': 'CL=F'
  // Adicione outros mapeamentos conforme necessário
};

// Listas estáticas de exemplo para ativos disponíveis
const EXAMPLE_AVAILABLE_STOCKS = [
    'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA', // B3
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', // EUA
    // Adicione mais conforme necessário
];

const EXAMPLE_AVAILABLE_CRYPTOS = [
    'BTC-USD', 'ETH-USD', 'USDT-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD', 'ADA-USD', 'DOGE-USD',
    // Adicione mais conforme necessário
];

const EXAMPLE_AVAILABLE_COMMODITIES = [
    'GC=F', 'SI=F', 'CL=F', 'NG=F', 'ZC=F', // Metais e Energia
    // Adicione mais conforme necessário
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

  // NOVOS ESTADOS para listas disponíveis
  const [availableStocks, setAvailableStocks] = useState<string[]>(EXAMPLE_AVAILABLE_STOCKS);
  const [availableCryptos, setAvailableCryptos] = useState<string[]>(EXAMPLE_AVAILABLE_CRYPTOS);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>(EXAMPLE_AVAILABLE_COMMODITIES);


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
      // Converte nomes simples para símbolos técnicos
      const convertSymbols = (items: string[]) =>
        items.map(item => SYMBOL_MAPPING[item.toUpperCase()] || item);

      // ADICIONADO LOGS AQUI
      console.log('[refreshMarketData] Fetching market data...');
      console.log('[refreshMarketData] Selected Stocks:', selectedStocks);
      console.log('[refreshMarketData] Selected Cryptos:', selectedCryptos);
      console.log('[refreshMarketData] Selected Commodities:', selectedCommodities);
      console.log('[refreshMarketData] Manual Assets:', manualAssets);
      console.log('[refreshMarketData] Custom Indices:', customIndices);
      const requestBody = {
          symbols: convertSymbols(selectedStocks),
          cryptos: convertSymbols(selectedCryptos),
          commodities: convertSymbols(selectedCommodities),
          manualAssets: convertSymbols(manualAssets),
          customIndices: convertSymbols(customIndices.map(index => index.symbol))
        };
      console.log('[refreshMarketData] Request body:', JSON.stringify(requestBody));

      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        credentials: 'include' // ADICIONADO: Envia cookies com a requisição
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // ADICIONADO LOGS DE ERRO AQUI
        console.error('[refreshMarketData] API Error Response Status:', response.status);
        console.error('[refreshMarketData] API Error Response Data:', errorData);
        throw new Error(errorData.error || `Failed to fetch market data with status ${response.status}`); // Adicionado status ao erro
      }

      const data = await response.json();
      // ADICIONADO LOG DE SUCESSO AQUI
      console.log('[refreshMarketData] Successful Response Data:', data);
      setMarketData(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Market data fetch aborted.');
        return;
      }
      console.error('Error fetching market data:', error);
      if (!silent) {
        setMarketError(error instanceof Error ? error.message : 'Erro ao buscar dados do mercado.');
        // Mantenha dados anteriores em caso de erro silencioso, limpe se não for silencioso
        if (!silent) {
             setMarketData(null); // Limpa dados se houver erro não silencioso
        }
      }
    } finally {
      if (!silent) {
        setLoadingMarketData(false);
      }
    }
  }, [selectedStocks, selectedCryptos, selectedCommodities, manualAssets, customIndices]); // DEPENDÊNCIAS ATUALIZADAS

  useEffect(() => {
    refreshMarketData();
    const intervalId = setInterval(() => refreshMarketData({ silent: true }), 300000);
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [refreshMarketData]); // refreshMarketData agora tem todas as dependências, só precisa dela aqui

  const addCustomIndex = (index: { symbol: string; name: string }) => {
    // Converte símbolo de entrada se for nome amigável
    const symbolToAdd = SYMBOL_MAPPING[index.symbol.toUpperCase()] || index.symbol;
    const nameToAdd = index.name.trim() || symbolToAdd; // Usa símbolo como nome se nenhum for fornecido

    // Verifica se já existe (evita duplicados)
    if (!customIndices.some(idx => idx.symbol === symbolToAdd)) {
       setCustomIndices(prevIndices => [...prevIndices, { symbol: symbolToAdd, name: nameToAdd }]);
       // Não chamar refreshMarketData aqui, ele será chamado pelo useEffect devido à mudança em customIndices
    } else {
       console.warn(`Index with symbol ${symbolToAdd} already exists.`);
    }
  };

  const removeCustomIndex = (symbol: string) => {
    setCustomIndices(prevIndices => prevIndices.filter(index => index.symbol !== symbol));
     // Não chamar refreshMarketData aqui, ele será chamado pelo useEffect
  };

  // Atualiza um índice customizado (edição)
  const updateCustomIndex = (oldSymbol: string, newIndex: CustomIndex) => {
     // Converte novo símbolo se for nome amigável
    const newSymbol = SYMBOL_MAPPING[newIndex.symbol.toUpperCase()] || newIndex.symbol;
    const newName = newIndex.name.trim() || newSymbol;

     setCustomIndices(prevIndices =>
       prevIndices.map(index =>
         index.symbol === oldSymbol ? { symbol: newSymbol, name: newName } : index
       )
     );
      // Não chamar refreshMarketData aqui, ele será chamado pelo useEffect
  };

  // Remove uma ação e atualiza o mercado
  const removeStock = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s !== symbol));
     // Não chamar refreshMarketData aqui, ele será chamado pelo useEffect
  };

  // Remove uma cripto e atualiza o mercado
  const removeCrypto = (symbol: string) => {
    setSelectedCryptos(prev => prev.filter(s => s !== symbol));
     // Não chamar refreshMarketData aqui, ele será chamado pelo useEffect
  };

  // Remove uma commodity e atualiza o mercado
  const removeCommodity = (symbol: string) => {
    setSelectedCommodities(prev => prev.filter(s => s !== symbol));
     // Não chamar refreshMarketData aqui, ele será chamado pelo useEffect
  };

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
    setCustomIndices,
    addCustomIndex,
    removeCustomIndex,
    updateCustomIndex,
    removeStock,
    removeCrypto,
    removeCommodity,
    // NOVOS: listas de ativos disponíveis exportadas
    availableStocks,
    availableCryptos,
    availableCommodities,
  };

   // Adicione logs para verificar o estado das listas no contexto
   useEffect(() => {
       console.log('[DashboardContext] selectedStocks:', selectedStocks);
       console.log('[DashboardContext] selectedCryptos:', selectedCryptos);
       console.log('[DashboardContext] selectedCommodities:', selectedCommodities);
       console.log('[DashboardContext] manualAssets:', manualAssets);
       console.log('[DashboardContext] customIndices:', customIndices);
   }, [selectedStocks, selectedCryptos, selectedCommodities, manualAssets, customIndices]);


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