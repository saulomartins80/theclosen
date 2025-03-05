import React, { useState } from "react";
import { Edit, Trash } from "lucide-react";

interface TransactionTableProps {
  transacoes: any[];
  onEdit: (transacao: any) => void;
  onDelete: (id: string) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transacoes, onEdit, onDelete }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Calcula os itens da página atual
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensPaginaAtual = transacoes.slice(indexPrimeiroItem, indexUltimoItem);

  // Muda de página
  const mudarPagina = (numeroPagina: number) => setPaginaAtual(numeroPagina);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Transações Recentes</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Descrição</th>
            <th className="text-left p-2">Categoria</th>
            <th className="text-left p-2">Valor</th>
            <th className="text-left p-2">Data</th>
            <th className="text-left p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {itensPaginaAtual.map((transacao) => (
            <tr key={transacao._id} className="border-b">
              <td className="p-2">{transacao.descricao}</td>
              <td className="p-2">{transacao.categoria}</td>
              <td className={`p-2 ${transacao.tipo === "receita" ? "text-green-500" : "text-red-500"}`}>
                {transacao.tipo === "receita" ? "+" : "-"}R$ {transacao.valor.toFixed(2)}
              </td>
              <td className="p-2">{new Date(transacao.data).toLocaleDateString()}</td>
              <td className="p-2">
                <button
                  onClick={() => onEdit(transacao)}
                  className="p-2 text-blue-500 hover:text-blue-600"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(transacao._id)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  <Trash size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: Math.ceil(transacoes.length / itensPorPagina) }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => mudarPagina(index + 1)}
            className={`px-4 py-2 mx-1 rounded-lg ${
              paginaAtual === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransactionTable;