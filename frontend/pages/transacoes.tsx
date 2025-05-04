import React, { useState, useEffect } from "react";
import { Plus, Download, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { transacaoAPI } from "../services/api";
import FinancialSummary from "../components/FinancialSummary";
import ChartsSection from "../components/ChartsSection";
import TransactionTable from "../components/TransactionTable";
import TransactionForm from "../components/TransactionForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transacao, NovaTransacaoPayload } from '../types/Transacao';
import { useTheme } from "../context/ThemeContext";

const Transacoes = () => {
  const { theme } = useTheme();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    descricao: string;
    valor: string;
    data: string;
    categoria: string;
    tipo: "receita" | "despesa" | "transferencia";
    conta: string;
  }>({
    descricao: "",
    valor: "",
    data: "",
    categoria: "",
    tipo: "receita",
    conta: "",
  });

  useEffect(() => {
    const fetchTransacoes = async () => {
      try {
        const data = await transacaoAPI.getAll();
        setTransacoes(data);
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
        toast.error("Erro ao buscar transações.");
      }
    };

    fetchTransacoes();
  }, []);

  const handleSaveTransacao = async () => {
    try {
      // Validação dos campos obrigatórios
      if (!formData.descricao || !formData.valor || !formData.data || 
          !formData.categoria || !formData.conta) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
  
      // Conversão e validação do valor
      const valorNumerico = Number(
        formData.valor.toString().replace(/[^0-9,-]/g, '').replace(',', '.')
      );
  
      if (isNaN(valorNumerico)) {
        toast.error("Valor inválido!");
        return;
      }
  
      // Validação da data
      const dataObj = new Date(formData.data);
      if (isNaN(dataObj.getTime())) {
        toast.error("Data inválida!");
        return;
      }
  
      // Criação do payload com o formato correto para a API
      const commonData = {
        descricao: formData.descricao.trim(),
        valor: valorNumerico,
        categoria: formData.categoria.trim(),
        tipo: formData.tipo,
        conta: formData.conta.trim(),
      };
  
      if (editingId) {
        // Para atualização - envia como string
        await transacaoAPI.update(editingId, {
          ...commonData,
          data: dataObj.toISOString()
        });
        toast.success("Transação atualizada!");
      } else {
        // Para criação - envia como { $date: string }
        await transacaoAPI.create({
          ...commonData,
          data: { $date: dataObj.toISOString() }
        });
        toast.success("Transação criada!");
      }
  
      // Atualização da lista
      const updatedData = await transacaoAPI.getAll();
      setTransacoes(updatedData);
      closeModal();
  
    } catch (error: unknown) {
      console.error('Erro completo:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        response: (error as any)?.response?.data,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast.error(
        (error as any)?.response?.data?.message || 
        (error instanceof Error ? error.message : 'Erro ao salvar transação')
      );
    }
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      descricao: "",
      valor: "",
      data: "",
      categoria: "",
      tipo: "receita",
      conta: "",
    });
  };

  const handleEditTransacao = (transacao: Transacao) => {
    setEditingId(transacao._id);
  
    // Extrai a data corretamente com verificação de tipo segura
    const rawDate = (typeof transacao.data === 'object' && transacao.data !== null && '$date' in transacao.data) 
      ? (transacao.data as { $date: string }).$date 
      : transacao.data as string;
  
    const dataTransacao = new Date(rawDate).toISOString().split('T')[0];
  
    setFormData({
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      data: dataTransacao,
      categoria: transacao.categoria,
      tipo: transacao.tipo,
      conta: transacao.conta,
    });
  
    setIsFormOpen(true);
  };

  const totalReceitas = transacoes
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  // Transferências podem ser positivas (entrada) ou negativas (saída)
  const totalTransferencias = transacoes
    .filter((t) => t.tipo === "transferencia")
    .reduce((acc, t) => acc + t.valor, 0);

  // Saldo considera tudo
  const saldoAtual = totalReceitas - totalDespesas + totalTransferencias;

  // Separa transferências positivas e negativas para exibição
  const transferenciasEntrada = transacoes
    .filter((t) => t.tipo === "transferencia" && t.valor >= 0)
    .reduce((acc, t) => acc + t.valor, 0);

  const transferenciasSaida = transacoes
    .filter((t) => t.tipo === "transferencia" && t.valor < 0)
    .reduce((acc, t) => acc + Math.abs(t.valor), 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    const textColor = theme === "dark" ? [200, 200, 200] : [20, 20, 20];
    const backgroundColor = theme === "dark" ? [50, 50, 50] : [255, 255, 255];
    const headerColor = theme === "dark" ? [30, 30, 30] : [240, 240, 240];

    doc.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(18);
    doc.text("Relatório Financeiro", 10, 20);

    autoTable(doc, {
      head: [["Descrição", "Valor", "Data"]],
      body: transacoes.map((t) => [
        t.descricao,
        `R$ ${t.valor.toFixed(2)}`,
        new Date(t.data).toLocaleDateString("pt-BR"),
      ]),
      headStyles: {
        fillColor: [headerColor[0], headerColor[1], headerColor[2]],
        textColor: [textColor[0], textColor[1], textColor[2]],
      },
      alternateRowStyles: {
        fillColor: theme === "dark" ? [70, 70, 70] : [245, 245, 245],        
      },    
      margin: { top: 30 },
    });

    doc.save("relatorio-financeiro.pdf");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="bg-blue-600 text-white p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </span>
              Gestão Financeira
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Controle completo das suas transações financeiras
            </p>
          </div>
        </div>

        <FinancialSummary 
          saldo={saldoAtual}
          receitas={totalReceitas}
          despesas={totalDespesas}
          transferenciasEntrada={transferenciasEntrada}
          transferenciasSaida={transferenciasSaida}
        />

        
        <div
          className={`rounded-xl shadow-sm overflow-hidden mb-8 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Histórico de Transações</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {transacoes.length} registros encontrados
            </span>
          </div>
          <TransactionTable
            transacoes={transacoes}
            onEdit={handleEditTransacao}
            onDelete={async (id) => {
              try {
                await transacaoAPI.delete(id);
                setTransacoes((prev) => prev.filter((t) => t._id !== id));
                toast.success("Transação excluída com sucesso!");
              } catch (error) {
                toast.error("Erro ao excluir transação");
                console.error(error);
              }
            }}
            theme={theme}
          />
        </div>
      </div>

      <div className="fixed bottom-8 right-8 flex gap-4">
        <button
          onClick={handleExportPDF}
          className={`p-4 rounded-full shadow-xl transition-all hover:scale-105 ${
            theme === "dark"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-green-500 hover:bg-green-600"
          } text-white flex items-center gap-2`}
          title="Exportar para PDF"
        >
          <Download size={22} />
          <span className="hidden md:inline">Exportar</span>
        </button>

        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              descricao: "",
              valor: "",
              data: "",
              categoria: "",
              tipo: "receita",
              conta: "",
            });
            setIsFormOpen(true);
          }}
          className={`p-5 rounded-full shadow-xl transition-all hover:scale-105 ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
          title="Nova transação"
        >
          <Plus size={24} />
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div
            className={`p-6 rounded-xl w-full max-w-md transform transition-all duration-300 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? "Editar Transação" : "Nova Transação"}
              </h2>
              <button
                onClick={closeModal}
                className={`p-1 rounded-full ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <TransactionForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleSaveTransacao}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
        toastClassName={`${
          theme === "dark"
          ? "bg-gray-800 text-gray-100"
          : "bg-white text-gray-800"
      } rounded-xl shadow-lg`}       
    />
    </div>
  );
};

export default Transacoes;