import React, { useState } from "react";
import { createTransacao, updateTransacao } from "../services/api";

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transacao: any) => void;
  transacaoEditavel: any;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  onSave,
  transacaoEditavel,
}) => {
  const [descricao, setDescricao] = useState(transacaoEditavel?.descricao || "");
  const [valor, setValor] = useState(transacaoEditavel?.valor || "");
  const [data, setData] = useState(transacaoEditavel?.data || "");
  const [categoria, setCategoria] = useState(transacaoEditavel?.categoria || "");
  const [tipo, setTipo] = useState<"receita" | "despesa" | "transferencia">(
    transacaoEditavel?.tipo || "receita"
  );
  const [conta, setConta] = useState(transacaoEditavel?.conta || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const transacao = {
      descricao,
      valor: parseFloat(valor),
      data: new Date(data).toISOString(),
      categoria,
      tipo,
      conta,
    };

    try {
      if (transacaoEditavel) {
        await updateTransacao(transacaoEditavel._id, transacao);
      } else {
        await createTransacao(transacao);
      }

      onSave(transacao);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Descrição
        </label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Compra no mercado"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Valor
        </label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Ex: 100.00"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Data
        </label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Categoria
        </label>
        <input
          type="text"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Ex: Alimentação"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Tipo
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "receita" | "despesa" | "transferencia")}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="despesa">🔴 Despesa</option>
          <option value="receita">🟢 Receita</option>
          <option value="transferencia">🟣 Transferência</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Conta
        </label>
        <input
          type="text"
          value={conta}
          onChange={(e) => setConta(e.target.value)}
          placeholder="Ex: Conta Corrente"
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
