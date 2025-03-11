import React, { useState } from "react";
import { Transacao } from "../src/types/Transacao"; // Importe a interface correta

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transacao: Transacao) => void;
  transacaoEditavel?: Transacao; // transacaoEditavel é opcional (Transacao | undefined)
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSave, transacaoEditavel }) => {
  const [transacao, setTransacao] = useState<Transacao>({
    _id: transacaoEditavel?._id || "", // Garanta que `_id` seja sempre uma string
    id: transacaoEditavel?.id || "",
    descricao: transacaoEditavel?.descricao || "",
    valor: transacaoEditavel?.valor || 0,
    data: transacaoEditavel?.data || "",
    categoria: transacaoEditavel?.categoria || "",
    tipo: transacaoEditavel?.tipo || "receita",
    conta: transacaoEditavel?.conta || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransacao((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(transacao); // Passa a transação para a função onSave
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Descrição</label>
        <input
          type="text"
          name="descricao"
          value={transacao.descricao}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Valor</label>
        <input
          type="number"
          name="valor"
          value={transacao.valor}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Data</label>
        <input
          type="date"
          name="data"
          value={transacao.data}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Categoria</label>
        <input
          type="text"
          name="categoria"
          value={transacao.categoria}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
        <select
          name="tipo"
          value={transacao.tipo}
          onChange={handleChange}
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
          name="conta"
          value={transacao.conta}
          onChange={handleChange}
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
  );
};

export default TransactionForm;