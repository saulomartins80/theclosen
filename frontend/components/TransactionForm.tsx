import React, { useState } from "react";
import { Transacao } from "../types/Transacao";

interface TransactionFormProps {
  transacaoEditavel: Transacao | null;
  onSave: (transacao: Transacao) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transacaoEditavel,
  onSave,
  onClose,
}) => {
  const [transacao, setTransacao] = useState<Transacao>(
    transacaoEditavel || {
      _id: { $oid: "" },
      descricao: "",
      valor: 0,
      data: { $date: new Date().toISOString() },
      categoria: "",
      tipo: "despesa",
      conta: "",
    }
  );

  const [erros, setErros] = useState<{ [key: string]: string }>({});

  const validarFormulario = () => {
    const novosErros: { [key: string]: string } = {};

    if (!transacao.descricao) {
      novosErros.descricao = "Descrição é obrigatória.";
    }

    if (transacao.valor <= 0) {
      novosErros.valor = "Valor deve ser maior que zero.";
    }

    if (!transacao.data?.$date) {
      novosErros.data = "Data é obrigatória.";
    }

    if (!transacao.categoria) {
      novosErros.categoria = "Categoria é obrigatória.";
    }

    if (!transacao.conta) {
      novosErros.conta = "Conta é obrigatória.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validarFormulario()) {
      onSave(transacao);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <label className="block">
        Descrição:
        <input
          type="text"
          value={transacao.descricao}
          onChange={(e) => setTransacao({ ...transacao, descricao: e.target.value })}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Salário"
          required
        />
        {erros.descricao && <span className="text-red-500 text-sm">{erros.descricao}</span>}
      </label>

      <label className="block">
        Valor:
        <input
          type="number"
          value={transacao.valor}
          onChange={(e) => setTransacao({ ...transacao, valor: Number(e.target.value) })}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
          placeholder="Ex: 1000"
          required
        />
        {erros.valor && <span className="text-red-500 text-sm">{erros.valor}</span>}
      </label>

      <label className="block">
        Data:
        <input
          type="date"
          value={transacao.data?.$date?.split("T")[0] || ""}
          onChange={(e) => {
            const dateValue = e.target.value;
            if (dateValue) {
              setTransacao({
                ...transacao,
                data: { $date: new Date(dateValue).toISOString() },
              });
            }
          }}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
          required
        />
        {erros.data && <span className="text-red-500 text-sm">{erros.data}</span>}
      </label>

      <label className="block">
        Categoria:
        <input
          type="text"
          value={transacao.categoria}
          onChange={(e) => setTransacao({ ...transacao, categoria: e.target.value })}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Alimentação"
          required
        />
        {erros.categoria && <span className="text-red-500 text-sm">{erros.categoria}</span>}
      </label>

      <label className="block">
        Tipo:
        <select
          value={transacao.tipo}
          onChange={(e) =>
            setTransacao({
              ...transacao,
              tipo: e.target.value as "receita" | "despesa" | "transferencia",
            })
          }
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
        >
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
          <option value="transferencia">Transferência</option>
        </select>
      </label>

      <label className="block">
        Conta:
        <input
          type="text"
          value={transacao.conta}
          onChange={(e) => setTransacao({ ...transacao, conta: e.target.value })}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Conta Corrente"
          required
        />
        {erros.conta && <span className="text-red-500 text-sm">{erros.conta}</span>}
      </label>

      <div className="flex justify-between mt-4">
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md">
          Salvar
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 bg-red-500 text-white rounded-md">
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;