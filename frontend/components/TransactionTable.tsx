import React, { useState, useMemo } from "react";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ReactPaginate from "react-paginate";
import { Transacao } from "../types/Transacao";

interface TransactionTableProps {
  transacoes: Transacao[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => Promise<void>;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transacoes, 
  onEdit, 
  onDelete 
}) => {
  const [sortConfig, setSortConfig] = useState<{ 
    key: keyof Transacao; 
    direction: "asc" | "desc" 
  } | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Função para extrair o ID como string
  const getIdString = (transacao: Transacao): string => {
    return typeof transacao._id === 'object' ? transacao._id.$oid : transacao._id;
  };

  // Função para formatar a data
  const formatDate = (dateString: string | { $date: string }): string => {
    const date = typeof dateString === 'string' 
      ? new Date(dateString) 
      : new Date(dateString.$date);
    return date.toLocaleDateString('pt-BR');
  };

  // Ordenação
  const sortedTransacoes = useMemo(() => {
    if (!sortConfig) return transacoes;

    return [...transacoes].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) return 0;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
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
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Função para lidar com exclusão
  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('ID inválido para exclusão');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        alert('Erro ao excluir transação. Por favor, tente novamente.');
      }
    }
  };

  // Função para determinar a cor do valor baseado no tipo
  const getValueColor = (tipo: string) => {
    switch (tipo) {
      case "receita": return "text-green-500";
      case "transferencia": return "text-yellow-500";
      case "despesa": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Transações Recentes</h2>

      {/* Tabela para Desktop */}
      <div className="hidden md:block overflow-x-auto">
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
            {currentTransacoes.map((transacao, index) => (
              <tr
                key={getIdString(transacao)}
                className={`${
                  index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-750"
                } hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
              >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transacao.descricao}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transacao.categoria}</td>
                <td className={`px-6 py-4 text-sm ${getValueColor(transacao.tipo)}`}>
                  R$ {transacao.valor.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatDate(transacao.data)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => onEdit(transacao)}
                      className="p-2 text-blue-500 hover:text-blue-600 transition"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(getIdString(transacao))}
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

      {/* Lista para Mobile */}
      <div className="md:hidden space-y-4">
        {currentTransacoes.map((transacao) => (
          <div 
            key={getIdString(transacao)} 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{transacao.descricao}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{transacao.categoria}</p>
              </div>
              <p className={`text-sm ${getValueColor(transacao.tipo)}`}>
                R$ {transacao.valor.toFixed(2)}
              </p>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(transacao.data)}
              </span>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(transacao)}
                  className="p-1 text-blue-500 hover:text-blue-600 transition"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(getIdString(transacao))}
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
        containerClassName={"flex justify-center space-x-2 mt-6 flex-wrap"}
        activeClassName={"bg-blue-500 text-white"}
        pageClassName={"px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mb-2"}
        previousClassName={"px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mb-2"}
        nextClassName={"px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mb-2"}
        breakClassName={"px-3 py-1 mb-2"}
        disabledClassName={"opacity-50 cursor-not-allowed"}
      />
    </div>
  );
};

export default TransactionTable;