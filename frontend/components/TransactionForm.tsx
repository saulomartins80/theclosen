import React, { useState } from "react";

interface Transacao {
  _id?: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: string;
  conta: string; // Propriedade obrigatória
}

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transacao: Transacao) => void;
  transacaoEditavel: Transacao | null;
}

const TransactionForm = ({ onClose, onSave, transacaoEditavel }: TransactionFormProps) => {
  const [descricao, setDescricao] = useState(transacaoEditavel?.descricao || "");
  const [categoria, setCategoria] = useState(transacaoEditavel?.categoria || "");
  const [valor, setValor] = useState(transacaoEditavel?.valor.toString() || "");
  const [data, setData] = useState(transacaoEditavel?.data || "");
  const [tipo, setTipo] = useState(transacaoEditavel?.tipo || "receita");
  const [conta, setConta] = useState(transacaoEditavel?.conta || ""); // Estado para 'conta'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transacaoAtualizada: Transacao = {
      _id: transacaoEditavel?._id,
      descricao,
      categoria,
      valor: parseFloat(valor),
      data,
      tipo,
      conta, // Inclua a propriedade 'conta'
    };
    onSave(transacaoAtualizada);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campos do formulário */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Descrição</label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Compra no mercado"
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
          placeholder="Ex: Alimentação"
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
          placeholder="Ex: 100.00"
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
          placeholder="Ex: Banco XYZ"
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
  );
};

export default TransactionForm;