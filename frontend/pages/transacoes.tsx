import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTransacoes, createTransacao, updateTransacao, deleteTransacao } from "../services/api";
import FinancialSummary from "../components/FinancialSummary";
import ChartsSection from "../components/ChartsSection";
import TransactionTable from "../components/TransactionTable";
import TransactionForm from "../components/TransactionForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transacao } from "../types/Transacao";

const Transacoes = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transacaoEditavel, setTransacaoEditavel] = useState<Transacao | null>(null);
  
  // Estados para os filtros
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "receita" | "despesa" | "transferencia">("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  // Função para extrair o ID como string
  const getIdString = (id: string | { $oid: string }): string => {
    return typeof id === 'object' ? id.$oid : id;
  };

  // Função para converter data para Date
  const parseDate = (date: string | { $date: string }): Date => {
    return typeof date === 'string' ? new Date(date) : new Date(date.$date);
  };

  // Busca as transações ao carregar a página
  useEffect(() => {
    const fetchTransacoes = async () => {
      try {
        const data = await getTransacoes();
        setTransacoes(data);
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
        toast.error("Erro ao buscar transações.");
      }
    };

    fetchTransacoes();
  }, []);

  // Função para adicionar ou editar uma transação
  const handleSaveTransacao = async (transacaoData: Omit<Transacao, "_id"> | Transacao) => {
    try {
      let updatedTransacoes: Transacao[];
      
      if (transacaoEditavel?._id) {
        // Atualiza transação existente
        const idString = getIdString(transacaoEditavel._id);
        const updatedTransacao = await updateTransacao(idString, transacaoData);
        
        // Atualiza a lista local
        updatedTransacoes = transacoes.map(t => 
          getIdString(t._id) === idString ? updatedTransacao : t
        );
        toast.success("Transação atualizada com sucesso!");
      } else {
        // Adiciona nova transação
        const newTransacao = await createTransacao(transacaoData);
        updatedTransacoes = [newTransacao, ...transacoes];
        toast.success("Transação criada com sucesso!");
      }

      setIsFormOpen(false);
      setTransacaoEditavel(null);
      setTransacoes(updatedTransacoes);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação.");
    }
  };

  // Função para excluir uma transação
  const handleDeleteTransacao = async (id: string) => {
    try {
      await deleteTransacao(id);
      setTransacoes(prev => prev.filter(t => getIdString(t._id) !== id));
      toast.success("Transação excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast.error("Erro ao excluir transação.");
    }
  };

  // Cálculo do resumo financeiro
  const totalReceitas = transacoes
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoAtual = totalReceitas - totalDespesas;

  // Filtra as transações
  const transacoesFiltradas = transacoes.filter((transacao) => {
    if (filtroTipo !== "todos" && transacao.tipo !== filtroTipo) return false;
    if (filtroCategoria && transacao.categoria !== filtroCategoria) return false;
    
    const transacaoDate = parseDate(transacao.data);
    const inicioDate = filtroDataInicio ? new Date(filtroDataInicio) : null;
    const fimDate = filtroDataFim ? new Date(filtroDataFim) : null;
    
    if (inicioDate && transacaoDate < inicioDate) return false;
    if (fimDate && transacaoDate > fimDate) return false;
    
    return true;
  });

  // Lógica de paginação
  const offset = currentPage * itemsPerPage;
  const currentTransacoes = transacoesFiltradas.slice(offset, offset + itemsPerPage);
  const totalPages = Math.ceil(transacoesFiltradas.length / itemsPerPage);

  // Função para exportar para PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Título do PDF
    doc.setFontSize(18);
    doc.text("Relatório de Transações", 10, 10);

    // Resumo Financeiro
    doc.setFontSize(12);
    doc.text(`Saldo Atual: R$ ${saldoAtual.toFixed(2)}`, 10, 20);
    doc.text(`Total de Receitas: R$ ${totalReceitas.toFixed(2)}`, 10, 30);
    doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 10, 40);

    // Cabeçalho da tabela
    const headers = [["Descrição", "Categoria", "Valor", "Data", "Tipo"]];

    // Dados da tabela
    const data = transacoesFiltradas.map((transacao) => [
      transacao.descricao,
      transacao.categoria,
      `R$ ${transacao.valor.toFixed(2)}`,
      parseDate(transacao.data).toLocaleDateString(),
      transacao.tipo,
    ]);

    // Adiciona a tabela ao PDF
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 50,
    });

    // Salva o PDF
    doc.save("transacoes.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Transações</h1>

      <FinancialSummary saldo={saldoAtual} receitas={totalReceitas} despesas={totalDespesas} />

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as "todos" | "receita" | "despesa" | "transferencia")}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Categoria</label>
            <input
              type="text"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              placeholder="Ex: Alimentação"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Data Início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Data Fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <ChartsSection transacoes={transacoesFiltradas} />

      <TransactionTable
        transacoes={currentTransacoes}
        onEdit={(transacao) => {
          setTransacaoEditavel(transacao);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteTransacao}
      />

      {/* Paginação */}
      <div className="flex justify-center mt-6">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`mx-1 px-4 py-2 rounded-lg ${
              currentPage === index
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Botão para adicionar nova transação */}
      <button
        onClick={() => {
          setTransacaoEditavel(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
      >
        <Plus size={24} />
      </button>

      {/* Botão para exportar PDF */}
      <button
        onClick={handleExportPDF}
        className="fixed bottom-6 right-32 p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
      >
        Exportar PDF
      </button>

      {/* Modal do formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">
              {transacaoEditavel ? "Editar Transação" : "Nova Transação"}
            </h2>
            <TransactionForm
              onClose={() => setIsFormOpen(false)}
              onSave={handleSaveTransacao}
              transacaoEditavel={transacaoEditavel}
            />
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Transacoes;