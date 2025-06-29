import { Check, X, Edit } from 'lucide-react';

interface TransactionConfirmationProps {
  suggestion: {
    valor: number;
    tipo: string;
    categoria: string;
    descricao: string;
    conta: string;
    data?: string;
    mensagem?: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export const TransactionConfirmation = ({
  suggestion,
  onConfirm,
  onEdit,
  onReject
}: TransactionConfirmationProps) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-green-50 dark:bg-green-900/20">
      <h4 className="font-bold text-lg dark:text-white mb-2">
        {suggestion.mensagem || "Confirme a transação"}
      </h4>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Valor:</p>
          <p className={`font-medium dark:text-white ${
            suggestion.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
          }`}>
            R$ {suggestion.valor.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Tipo:</p>
          <p className={`font-medium dark:text-white ${
            suggestion.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
          }`}>
            {suggestion.tipo === 'receita' ? 'Receita' : 'Despesa'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Categoria:</p>
          <p className="font-medium dark:text-white">{suggestion.categoria}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Conta:</p>
          <p className="font-medium dark:text-white">{suggestion.conta}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">Descrição:</p>
          <p className="font-medium dark:text-white">{suggestion.descricao}</p>
        </div>
        {suggestion.data && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Data:</p>
            <p className="font-medium dark:text-white">
              {new Date(suggestion.data).toLocaleDateString()}
            </p>
          </div>
        )}
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