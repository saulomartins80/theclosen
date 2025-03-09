import React, { useState } from "react";
import { X } from "lucide-react"; // Importe o ícone X

interface Transacao {
  _id?: string; // ID opcional
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: string;
  conta: string; // Propriedade obrigatória
}

interface EditTransactionModalProps {
  onClose: () => void;
  onSave: (transacao: Transacao) => void;
  transacaoEditavel: Transacao | null;
}

const EditTransactionModal = ({ onClose, onSave, transacaoEditavel }: EditTransactionModalProps) => {
  // Estados para os campos do formulário
  const [descricao, setDescricao] = useState(transacaoEditavel?.descricao || "");
  const [categoria, setCategoria] = useState(transacaoEditavel?.categoria || "");
  const [valor, setValor] = useState(transacaoEditavel?.valor.toString() || "");
  const [data, setData] = useState(transacaoEditavel?.data || "");
  const [tipo, setTipo] = useState(transacaoEditavel?.tipo || "receita");
  const [conta, setConta] = useState(transacaoEditavel?.conta || "");

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Cria um objeto de transação com os dados do formulário
    const transacaoAtualizada: Transacao = {
      _id: transacaoEditavel?._id, // Mantém o ID se estiver editando
      descricao,
      categoria,
      valor: parseFloat(valor), // Converte o valor para número
      data,
      tipo,
      conta,
    };

    // Chama a função onSave passando a transação atualizada
    onSave(transacaoAtualizada);

    // Fecha o modal após salvar
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} /> {/* Ícone X para fechar o modal */}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo: Descrição */}
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

          {/* Campo: Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Categoria</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Campo: Valor */}
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

          {/* Campo: Data */}
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

          {/* Campo: Tipo */}
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

          {/* Campo: Conta */}
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

          {/* Botões de Ação */}
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