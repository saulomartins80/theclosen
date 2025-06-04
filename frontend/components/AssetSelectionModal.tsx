// frontend/components/AssetSelectionModal.tsx
import React, { useState, useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

// Tipos de ativos suportados
type AssetType = 'stocks' | 'cryptos' | 'commodities' | 'fiis' | 'etfs' | 'currencies' | 'indices';

// Estrutura para opções de ativos
interface AssetOption {
  symbol: string;
  name: string;
  isPopular?: boolean;
}
type AssetOptionOrString = string | AssetOption;

interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selected: string[]) => void;
  currentSelected: string[];
  type: AssetType;
  allOptions: AssetOptionOrString[];
  title?: string;
  defaultOptions?: string[];
}

// Mapeamento de nomes amigáveis para cada tipo de ativo - EXPANDED
const getAssetDisplayName = (symbol: string, type: AssetType): string => {
  const mappings: Record<string, Record<string, string>> = {
    cryptos: {
      'BTC-USD': 'Bitcoin',
      'ETH-USD': 'Ethereum',
      'BNB-USD': 'Binance Coin',
      'XRP-USD': 'Ripple',
      'SOL-USD': 'Solana',
      'ADA-USD': 'Cardano',
      'DOGE-USD': 'Dogecoin',
      'POLKADOT': 'Polkadot',
      'AVALANCHE': 'Avalanche',
      'POLYGON': 'Polygon',
      'LITECOIN': 'Litecoin',
      'BITCOINCASH': 'Bitcoin Cash',
      'STELLAR': 'Stellar',
      'CHAINLINK': 'Chainlink',
      'UNISWAP': 'Uniswap',
      'FILECOIN': 'Filecoin'
    },
    stocks: {
      // Brasileiras
      'PETR4.SA': 'Petrobras PN', 'PETR3.SA': 'Petrobras ON',
      'VALE3.SA': 'Vale ON',
      'ITUB4.SA': 'Itaú ON', 'ITUB3.SA': 'Itaú PN',
      'BBDC4.SA': 'Bradesco ON', 'BBDC3.SA': 'Bradesco PN',
      'BBAS3.SA': 'Banco do Brasil', 'BRSR6.SA': 'Banrisul PN', 'SANB11.SA': 'Santander Unit',
      'ELET3.SA': 'Eletrobras ON', 'ELET6.SA': 'Eletrobras PN', 'EGIE3.SA': 'Engie Brasil', 'CPLE6.SA': 'Copel PN', 'CPFE3.SA': 'CPFL Energia', 'NEOE3.SA': 'Neoenergia',
      'MGLU3.SA': 'Magalu', 'VIIA3.SA': 'Via', 'LAME4.SA': 'Americanas PN', 'LVTC3.SA': 'Locaweb', 'GRND3.SA': 'Grendene', 'NTCO3.SA': 'Natura &Co',
      'ABEV3.SA': 'Ambev', 'WEGE3.SA': 'WEG', 'B3SA3.SA': 'B3', 'SUZB3.SA': 'Suzano',
      'JBS': 'JBSS3.SA', 'LOCALIZA': 'RENT3.SA', 'RAIADROGASIL': 'RADL3.SA', 'RUMO': 'RAIL3.SA', 'CCR': 'CCRO3.SA', 'GERDAU': 'GGBR4.SA', 'USIM5.SA': 'Usiminas PNA', 'CSNA3.SA': 'CSN', 'BRFS3.SA': 'BRF', 'BRKM5.SA': 'Braskem PNA', 'EMBR3.SA': 'Embraer', 'AZUL4.SA': 'Azul PN', 'GOLL4.SA': 'Gol PN', 'CVCB3.SA': 'CVC', 'HAPV3.SA': 'Hapvida', 'QUAL3.SA': 'Qualicorp',

      // Internacionais
      'AAPL': 'Apple', 'MSFT': 'Microsoft', 'AMZN': 'Amazon', 'GOOGL': 'Alphabet Class A', 'META': 'Meta Platforms', 'TSLA': 'Tesla', 'NVDA': 'NVIDIA', 'NFLX': 'Netflix', 'ADBE': 'Adobe', 'CRM': 'Salesforce', 'ORCL': 'Oracle', 'INTC': 'Intel', 'AMD': 'AMD', 'QCOM': 'Qualcomm',
      'BRK-B': 'Berkshire Hathaway B', 'V': 'Visa', 'JPM': 'JP Morgan Chase', 'MA': 'Mastercard', 'GS': 'Goldman Sachs', 'MS': 'Morgan Stanley', 'BAC': 'Bank of America', 'WFC': 'Wells Fargo', 'BLK': 'BlackRock',
      'WMT': 'Walmart', 'COST': 'Costco', 'NKE': 'Nike', 'DIS': 'Disney', 'SBUX': 'Starbucks', 'MCD': "McDonald's", 'KO': 'Coca-Cola', 'PEP': 'PepsiCo', 'PG': 'Procter & Gamble',
      'JNJ': 'Johnson & Johnson', 'PFE': 'Pfizer', 'MRNA': 'Moderna', 'NVAX': 'Novavax', 'MRK': 'Merck & Co', 'ABBV': 'AbbVie', 'LLY': 'Eli Lilly', 'AMGN': 'Amgen',
      // European (examples)
      'NESN.SW': 'Nestlé', 'NOVN.SW': 'Novartis', 'SAP.DE': 'SAP', 'SIE.DE': 'Siemens', 'MC.PA': 'LVMH', 'TTE.PA': 'TotalEnergies', 'ULVR.L': 'Unilever', 'HSBA.L': 'HSBC',
      // Asian (examples)
      '0700.HK': 'Tencent Holdings', '005930.KS': 'Samsung Electronics', '7203.T': 'Toyota Motor', '6758.T': 'Sony Group', '7267.T': 'Honda Motor', '7751.T': 'Canon'
    },
    commodities: {
      'GC=F': 'Ouro', 'SI=F': 'Prata', 'CL=F': 'Petróleo WTI', 'NG=F': 'Gás Natural', 'ZC=F': 'Milho', 'ZS=F': 'Soja', 'KC=F': 'Café', 'LE=F': 'Boi Gordo', 'CT=F': 'Algodão', 'OJ=F': 'Suco de Laranja', 'HG=F': 'Cobre', 'RB=F': 'Etanol', 'ZW=F': 'Trigo', 'SB=F': 'Açúcar'
    },
    fiis: {
      'HGLG11.SA': 'CSHG Logística', 'XPML11.SA': 'XP Malls', 'KNRI11.SA': 'Kinea Renda Imobiliária', 'HGBS11.SA': 'Hedge Brasil Shopping', 'HGRE11.SA': 'CSHG Real Estate', 'XPLG11.SA': 'XP Log', 'BCFF11.SA': 'BC Fundo de Fundos', 'BRCR11.SA': 'FII BC Fundo de Fundos', 'VISC11.SA': 'Vinci Shopping Centers', 'HFOF11.SA': 'Hedge Top FOFII'
    },
    etfs: {
      'BOVA11.SA': 'ETF Ibovespa', 'SMAL11.SA': 'ETF Small Caps', 'IVVB11.SA': 'ETF S&P 500 (Brasil)', 'BRAX11.SA': 'ETF IBrX', 'ECOO11.SA': 'ETF Carbono', 'DIVO11.SA': 'ETF Dividendos (Brasil)', 'FIND11.SA': 'ETF Índice Financeiro', 'GOLD11.SA': 'ETF Ouro (Brasil)', 'SPXI11.SA': 'ETF S&P 500 (SPXI)', 'BBSD11.SA': 'ETF Dividendos (BBSD)',
      // Internacionais
      'SPY': 'SPDR S&P 500', 'QQQ': 'Invesco QQQ Trust', 'DIA': 'SPDR Dow Jones Industrial Average', 'IWM': 'iShares Russell 2000', 'EEM': 'iShares MSCI Emerging Markets', 'IVV': 'iShares Core S&P 500', 'VTI': 'Vanguard Total Stock Market', 'VOO': 'Vanguard S&P 500', 'ARKK': 'ARK Innovation ETF', 'GLD': 'SPDR Gold Trust', 'SLV': 'iShares Silver Trust', 'USO': 'United States Oil Fund', 'TLT': 'iShares 20+ Year Treasury Bond', 'HYG': 'iShares iBoxx High Yield Corporate Bond'
    },
    currencies: {
      'BRL=X': 'Dólar Americano', 'EURBRL=X': 'Euro', 'GBPBRL=X': 'Libra Esterlina', 'ARSBRL=X': 'Peso Argentino', 'CNYBRL=X': 'Yuan Chinês', 'JPYBRL=X': 'Iene Japonês', 'CHFBRL=X': 'Franco Suíço', 'AUDBRL=X': 'Dólar Australiano', 'CADBRL=X': 'Dólar Canadense'
    },
    indices: {
      // Brasileiros
      '^BVSP': 'Ibovespa', '^IBXL': 'IBrX 50', '^IBXX': 'IBrX 100', '^IDIV': 'IDIV', '^IFNC': 'IFNC', '^IGCT': 'IGCT', '^IMAT': 'IMAT', '^ICON': 'ICON', '^IEEX': 'IEEX', '^IFIX': 'IFIX', '^IMOB': 'IMOB', '^IVBX': 'IVBX', '^SMLL': 'Small Cap',
      // Internacionais
      '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ Composite', '^DJI': 'Dow Jones Industrial Average', '^RUT': 'Russell 2000', '^MID': 'S&P 400 MidCap', '^GSPTSE': 'S&P/TSX Composite (Canadá)', '^MERV': 'MERVAL (Argentina)', '^IPSA': 'IPSA (Chile)', '^MXX': 'IPC (México)', '^BOVESHK': 'IBOVESPA (Hong Kong)',
      '^FTSE': 'FTSE 100 (Reino Unido)', '^GDAXI': 'DAX (Alemanha)', '^FCHI': 'CAC 40 (França)', '^IBEX': 'IBEX 35 (Espanha)', '^FTSEMIB': 'FTSE MIB (Itália)', '^AEX': 'AEX (Holanda)', '^PSI20': 'PSI 20 (Portugal)', '^SSMI': 'SMI (Suíça)', '^OMX': 'OMXS30 (Suécia)',
      '^N225': 'Nikkei 225 (Japão)', '^HSI': 'Hang Seng (Hong Kong)', '000001.SS': 'Shanghai Composite (China)', '399001.SZ': 'SZSE Component (China)', '^STI': 'Straits Times Index (Singapura)', '^KS11': 'KOSPI (Coreia do Sul)', '^TWII': 'Taiwan Weighted Index', '^AXJO': 'S&P/ASX 200 (Austrália)', '^NZ50': 'NZX 50 (Nova Zelândia)', '^BSESN': 'SENSEX (Índia)', '^NSEI': 'NIFTY 50 (Índia)'
    }
  };

  const typeMappings = mappings[type];

  // Caso para índices
  if (type === 'indices') {
    const cleanSymbol = symbol.replace('^', '');
    return typeMappings?.[symbol] || cleanSymbol;
  }

  // Outros casos...
  if (typeMappings && typeMappings[symbol]) {
    return typeMappings[symbol];
  }

  // Fallbacks padrões
  if (symbol.endsWith('.SA')) return symbol.replace('.SA', '');
  if (symbol.endsWith('-USD')) return symbol.replace('-USD', '');
  if (symbol.endsWith('=X')) return symbol.replace('=X', '');
  if (symbol.endsWith('=F')) return symbol.replace('=F', '');
  if (symbol.startsWith('^')) return symbol.replace('^', '');

  return symbol;
};

// Títulos padrão para cada tipo de ativo
const getDefaultTitle = (type: AssetType): string => {
  const titles = {
    'stocks': 'Ações',
    'cryptos': 'Criptomoedas',
    'commodities': 'Commodities',
    'fiis': 'Fundos Imobiliários',
    'etfs': 'ETFs',
    'currencies': 'Moedas',
    'indices': 'Índices'
  };
  return `Selecionar ${titles[type]}`;
};

const AssetSelectionModal: React.FC<AssetSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSelected,
  type,
  allOptions,
  title = getDefaultTitle(type),
  defaultOptions = []
}) => {
  const { resolvedTheme } = useTheme();
  const [selected, setSelected] = useState<string[]>(Array.isArray(currentSelected) ? [...currentSelected] : []);
  const [searchTerm, setSearchTerm] = useState('');

  // Atualiza seleção quando currentSelected muda ou modal abre
  useEffect(() => {
    setSelected(currentSelected);
  }, [currentSelected, isOpen]);

  // Normaliza todas as opções para o formato { symbol, name }
  const normalizedOptions: AssetOption[] = allOptions.map(opt => {
    const symbol = typeof opt === 'string' ? opt : opt.symbol;
    const name = typeof opt === 'string' ? getAssetDisplayName(symbol, type) : opt.name || getAssetDisplayName(symbol, type);
    const isPopular = typeof opt === 'string' ? defaultOptions.includes(symbol) : opt.isPopular ?? defaultOptions.includes(symbol);

    return {
        symbol,
        name,
        isPopular
    };
  });

  // Filtra e ordena opções
  const filteredOptions = normalizedOptions
    .filter(option =>
      option.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Ordena por: selecionados > populares > nome
      const aSelected = Array.isArray(selected) && selected.includes(a.symbol);
      const bSelected = Array.isArray(selected) && selected.includes(b.symbol);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      const aPopular = a.isPopular;
      const bPopular = b.isPopular;
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;

      return a.name.localeCompare(b.name);
    });

  // Alterna seleção de um ativo
  const toggleAsset = (asset: string) => {
    setSelected(prev =>
      prev.includes(asset)
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Adicionado flex flex-col e max-h-[90vh] aqui */}
      <div
        className={`rounded-lg shadow-xl w-[95vw] max-w-md sm:max-w-lg lg:max-w-xl flex flex-col max-h-[90vh] ${
          resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } mx-auto`}
      >
        {/* Cabeçalho */}
        {/* flex-shrink-0 garante que o cabeçalho não encolha */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        {/* Corpo */}
        {/* flex-grow permite que o corpo cresça e overflow-y-auto adiciona scroll interno */}
        <div className="p-4 flex-grow overflow-y-auto">
          {/* Campo de busca */}
          <input
            type="text"
            placeholder="Buscar ativos..."
            className={`w-full p-2 mb-4 border rounded ${
              resolvedTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Lista de ativos */}
          <div>
            {filteredOptions.length > 0 ? (
              <ul className="space-y-2">
                {filteredOptions.map(option => {
                  const isSelected = selected.includes(option.symbol);
                  return (
                    <li key={option.symbol}>
                      <label className={`flex items-center p-2 rounded cursor-pointer ${
                        isSelected
                          ? resolvedTheme === 'dark'
                            ? 'bg-blue-900 text-blue-100'
                            : 'bg-blue-100 text-blue-800'
                          : resolvedTheme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAsset(option.symbol)}
                          className={`rounded ${
                            resolvedTheme === 'dark'
                              ? 'text-blue-400 bg-gray-600 border-gray-500'
                              : 'text-blue-600 bg-white border-gray-300'
                          } focus:ring-blue-500`}
                        />
                        <span className="ml-2 flex items-center">
                          {option.name}
                          <span className="ml-2 text-xs opacity-70">
                            ({option.symbol})
                          </span>
                          {option.isPopular && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Popular
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <ExclamationTriangleIcon className="h-8 w-8 mb-2" />
                <p>Nenhum ativo encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com botões */}
        {/* flex-shrink-0 garante que o rodapé não encolha */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2 flex-shrink-0">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${
              resolvedTheme === 'dark'
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            } transition`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded text-white ${
              resolvedTheme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetSelectionModal;