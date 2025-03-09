import React, { useState } from "react";
import { X } from "lucide-react";

interface Transacao {
  id?: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipo: string;
  conta: string;
}

interface EditTransactionModalProps {
  onClose: () => void;
  onSave: (transacao: Transacao) => void;
  transacaoEditavel: Transacao | null;
}

const EditTransactionModal = ({ onClose, onSave, transacaoEditavel }: EditTransactionModalProps) => {
  const [descricao, setDescricao] = useState(transacaoEditavel?.descricao || "");
  const [valor, setValor] = useState(transacaoEditavel?.valor.toString() || "");
  const [data, setData] = useState(transacaoEditavel?.data || "");
  const [categoria, setCategoria] = useState(transacaoEditavel?.categoria || "");
  const [tipo, setTipo] = useState(transacaoEditavel?.tipo || "receita");
  const [conta, setConta] = useState(transacaoEditavel?.conta || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transacaoAtualizada: Transacao = {
      id: transacaoEditavel?.id,
      descricao,
      valor: parseFloat(valor),
      data,
      categoria,
      tipo,
      conta,
    };
    onSave(transacaoAtualizada);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Valor</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Selecione uma categoria</option>
              <option value="alimentacao">Alimentação</option>
              <option value="casa">Casa</option>
              <option value="servico">Serviço</option>
              <option value="educacao">Educação</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Conta</label>
            <input
              type="text"
              value={conta}
              onChange={(e) => setConta(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;