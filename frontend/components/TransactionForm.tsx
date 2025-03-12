import React, { useState } from "react";
import { Transacao } from "../src/types/Transacao";

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transacao: Transacao) => void;
  transacaoEditavel?: Transacao;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSave, transacaoEditavel }) => {
  const [transacao, setTransacao] = useState<Transacao>({
    _id: transacaoEditavel?._id || { $oid: "" }, // Use um objeto `{ $oid: "" }` como valor padrão
    descricao: transacaoEditavel?.descricao || "",
    valor: transacaoEditavel?.valor || 0,
    data: transacaoEditavel?.data || { $date: new Date().toISOString() }, // Use um objeto `{ $date: "" }` como valor padrão
    categoria: transacaoEditavel?.categoria || "",
    tipo: transacaoEditavel?.tipo || "receita",
    conta: transacaoEditavel?.conta || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(transacao);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Descrição</label>
        <input
          type="text"
          value={transacao.descricao}
          onChange={(e) => setTransacao({ ...transacao, descricao: e.target.value })}
        />
      </div>
      <div>
        <label>Valor</label>
        <input
          type="number"
          value={transacao.valor}
          onChange={(e) => setTransacao({ ...transacao, valor: parseFloat(e.target.value) })}
        />
      </div>
      <div>
        <label>Data</label>
        <input
          type="date"
          value={new Date(transacao.data.$date).toISOString().split("T")[0]}
          onChange={(e) =>
            setTransacao({
              ...transacao,
              data: { $date: new Date(e.target.value).toISOString() },
            })
          }
        />
      </div>
      <div>
        <label>Categoria</label>
        <input
          type="text"
          value={transacao.categoria}
          onChange={(e) => setTransacao({ ...transacao, categoria: e.target.value })}
        />
      </div>
      <div>
        <label>Tipo</label>
        <select
          value={transacao.tipo}
          onChange={(e) =>
            setTransacao({
              ...transacao,
              tipo: e.target.value as "receita" | "despesa" | "transferencia",
            })
          }
        >
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
          <option value="transferencia">Transferência</option>
        </select>
      </div>
      <div>
        <label>Conta</label>
        <input
          type="text"
          value={transacao.conta}
          onChange={(e) => setTransacao({ ...transacao, conta: e.target.value })}
        />
      </div>
      <button type="submit">Salvar</button>
      <button type="button" onClick={onClose}>
        Cancelar
      </button>
    </form>
  );
};

export default TransactionForm;