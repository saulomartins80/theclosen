import React, { useState } from "react";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ReactPaginate from "react-paginate";

// Interface Transacao
interface Transacao {
  _id: { $oid: string }; // MongoDB usa `_id` com um campo `$oid`
  descricao: string;
  valor: number;
  data: { $date: string }; // MongoDB usa `data` com um campo `$date`
  categoria: string;
  tipo: "receita" | "despesa" | "transferencia";
  conta: string;
  __v?: number; // Adicione `__v` se necessário
}

interface TransactionTableProps {
  transacoes: Transacao[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transacoes, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transacao; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Ordenação
  const sortedTransacoes = React.useMemo(() => {
    if (!sortConfig) return transacoes;

    return [...transacoes].sort((a, b) => {
      const key = sortConfig.key;
      const valueA = a[key];
      const valueB = b[key];

      if (valueA === undefined || valueB === undefined) return 0;

      // Tratamento especial para valores numéricos
      if (key === "valor") {
        const numA = Number(valueA);
        const numB = Number(valueB);
        if (isNaN(numA)) return -1; // Se valueA não for um número, coloca no início
        if (isNaN(numB)) return 1; // Se valueB não for um número, coloca no final
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      // Tratamento especial para datas
      if (key === "data") {
        // Verifica se valueA e valueB são do tipo { $date: string }
        if (typeof valueA === "object" && "$date" in valueA && typeof valueB === "object" && "$date" in valueB) {
          const dateA = new Date(valueA.$date).getTime();
          const dateB = new Date(valueB.$date).getTime();
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          return 0; // Caso não sejam do tipo esperado, retorna 0
        }
      }

      // Ordenação padrão para strings
      if (typeof valueA === "string" && typeof valueB === "string") {
        if (valueA < valueB) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
      }

      return 0;
    });
  }, [transacoes, sortConfig]);

  // Paginação
  const pageCount = Math.ceil(sortedTransacoes.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentTransacoes = sortedTransacoes.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
  };

  // Função para solicitar ordenação
  const requestSort = (key: keyof Transacao) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Transações Recentes</h2>

      {/* Tabela para Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th
                className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                onClick={() => requestSort("descricao")}
              >
                <div className="flex items-center">
                  Descrição
                  {sortConfig?.key === "descricao" && (
                    <span className="ml-2">
                      {sortConfig.direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                onClick={() => requestSort("categoria")}
              >
                <div className="flex items-center">
                  Categoria
                  {sortConfig?.key === "categoria" && (
                    <span className="ml-2">
                      {sortConfig.direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                onClick={() => requestSort("valor")}
              >
                <div className="flex items-center">
                  Valor
                  {sortConfig?.key === "valor" && (
                    <span className="ml-2">
                      {sortConfig.direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                onClick={() => requestSort("data")}
              >
                <div className="flex items-center">
                  Data
                  {sortConfig?.key === "data" && (
                    <span className="ml-2">
                      {sortConfig.direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentTransacoes.map((transacao) => (
              <tr
                key={transacao._id.$oid} // Use o $oid como chave
                className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transacao.descricao}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transacao.categoria}</td>
                <td className={`px-6 py-4 text-sm ${
                  transacao.tipo === "receita" ? "text-green-500" : "text-red-500"
                }`}>
                  R$ {transacao.valor.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {new Date(transacao.data.$date).toLocaleDateString()} {/* Acessa o campo $date */}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => onEdit({ ...transacao, conta: transacao.conta || "" })}
                      className="p-2 text-blue-500 hover:text-blue-600 transition"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => transacao._id && onDelete(transacao._id.$oid)} // Use o $oid para deletar
                      className="p-2 text-red-500 hover:text-red-600 transition"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards para Mobile */}
      <div className="sm:hidden space-y-4">
        {currentTransacoes.map((transacao) => (
          <div
            key={transacao._id.$oid} // Use o $oid como chave
            className="bg-white dark:bg-gray-800 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{transacao.descricao}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{transacao.categoria}</p>
              </div>
              <p className={`text-sm ${
                transacao.tipo === "receita" ? "text-green-500" : "text-red-500"
              }`}>
                R$ {transacao.valor.toFixed(2)}
              </p>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(transacao.data.$date).toLocaleDateString()} {/* Acessa o campo $date */}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit({ ...transacao, conta: transacao.conta || "" })}
                  className="p-1 text-blue-500 hover:text-blue-600 transition"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => transacao._id && onDelete(transacao._id.$oid)} // Use o $oid para deletar
                  className="p-1 text-red-500 hover:text-red-600 transition"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <ReactPaginate
        previousLabel={"Anterior"}
        nextLabel={"Próximo"}
        pageCount={pageCount}
        onPageChange={handlePageClick}
        containerClassName={"flex justify-center space-x-2 mt-6"}
        activeClassName={"bg-blue-500 text-white"}
        pageClassName={"px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"}
        previousClassName={`px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white ${
          currentPage === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        nextClassName={`px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white ${
          currentPage === pageCount - 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabledClassName={"opacity-50 cursor-not-allowed"}
      />
    </div>
  );
};

export default TransactionTable;