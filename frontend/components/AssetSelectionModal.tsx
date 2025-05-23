// components/AssetSelectionModal.tsx
import React, { useState, useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

type AssetType = 'stocks' | 'cryptos' | 'commodities';

interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selected: string[]) => void;
  currentSelected: string[];
  type: AssetType;
  allOptions: string[];
  title?: string;
}

const getAssetDisplayName = (symbol: string, type: AssetType): string => {
  if (type === 'commodities') {
    switch (symbol) {
      case 'GC=F': return 'Ouro';
      case 'SI=F': return 'Prata';
      case 'CL=F': return 'Petróleo';
      case 'NG=F': return 'Gás Natural';
      case 'ZC=F': return 'Milho';
      default: return symbol.replace('=F', '');
    }
  }
  return symbol.replace('.SA', '').replace('-USD', '');
};

const AssetSelectionModal: React.FC<AssetSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSelected,
  type,
  allOptions,
  title = `Selecionar ${type === 'stocks' ? 'Ações' : type === 'cryptos' ? 'Criptomoedas' : 'Commodities'}`
}) => {
  const { resolvedTheme } = useTheme();
  const [selected, setSelected] = useState<string[]>(currentSelected);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSelected(currentSelected);
  }, [currentSelected, isOpen]); // Reset quando o modal abre ou currentSelected muda

  const filteredOptions = allOptions
    .filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Ordena com os selecionados primeiro
      const aSelected = selected.includes(a);
      const bSelected = selected.includes(b);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.localeCompare(b);
    });

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col ${
        resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <div className="p-4">
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
          
          <div className="max-h-[50vh] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <ul className="space-y-2">
                {filteredOptions.map(option => {
                  const isSelected = selected.includes(option);
                  return (
                    <li key={option}>
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
                          onChange={() => toggleAsset(option)}
                          className={`rounded ${
                            resolvedTheme === 'dark' 
                              ? 'text-blue-400 bg-gray-600 border-gray-500' 
                              : 'text-blue-600 bg-white border-gray-300'
                          } focus:ring-blue-500`}
                        />
                        <span className="ml-2">
                          {getAssetDisplayName(option, type)}
                          <span className="ml-2 text-xs opacity-70">
                            ({option})
                          </span>
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
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
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