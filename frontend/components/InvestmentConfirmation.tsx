import { Check, X, Edit } from 'lucide-react';

interface InvestmentConfirmationProps {
  suggestion: {
    nome: string;
    valor: number;
    data: string;
    tipo: string;
    mensagem?: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export const InvestmentConfirmation = ({
  suggestion,
  onConfirm,
  onEdit,
  onReject
}: InvestmentConfirmationProps) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-blue-50 dark:bg-blue-900/20">
      <h4 className="font-bold text-lg dark:text-white mb-2">
        {suggestion.mensagem || "Confirme o investimento"}
      </h4>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Nome:</p>
          <p className="font-medium dark:text-white">{suggestion.nome}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Valor:</p>
          <p className="font-medium dark:text-white">R$ {suggestion.valor.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Data:</p>
          <p className="font-medium dark:text-white">
            {new Date(suggestion.data).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Tipo:</p>
          <p className="font-medium dark:text-white">{suggestion.tipo}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onReject}
          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full flex items-center gap-1"
        >
          <X size={16} /> Recusar
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 rounded-full flex items-center gap-1"
        >
          <Edit size={16} /> Editar
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full flex items-center gap-1"
        >
          <Check size={16} /> Confirmar
        </button>
      </div>
    </div>
  );
}; 