import { Check, X, Edit } from 'lucide-react';

interface GoalConfirmationProps {
  suggestion: {
    meta: string;
    valor_total: number;
    data_conclusao: string;
    categoria?: string;
    mensagem?: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export const GoalConfirmation = ({
  suggestion,
  onConfirm,
  onEdit,
  onReject
}: GoalConfirmationProps) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-purple-50 dark:bg-purple-900/20">
      <h4 className="font-bold text-lg dark:text-white mb-2">
        {suggestion.mensagem || "Confirme a meta"}
      </h4>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="col-span-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">Meta:</p>
          <p className="font-medium dark:text-white">{suggestion.meta}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Valor Total:</p>
          <p className="font-medium dark:text-white">R$ {suggestion.valor_total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Data de Conclusão:</p>
          <p className="font-medium dark:text-white">
            {new Date(suggestion.data_conclusao).toLocaleDateString()}
          </p>
        </div>
        {suggestion.categoria && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Categoria:</p>
            <p className="font-medium dark:text-white">{suggestion.categoria}</p>
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