import React, { useState, useEffect } from "react";
import { Plus, Download, Edit, Trash, X } from "lucide-react"; // Adicionado X para fechar modal
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { transacaoAPI } from "../services/api";
import FinancialSummary from "../components/FinancialSummary";
// import ChartsSection from "../components/ChartsSection"; // Removido se não usado diretamente aqui
import TransactionTable from "../components/TransactionTable";
import TransactionForm from "../components/TransactionForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transacao, NovaTransacaoPayload } from '../types/Transacao';
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from 'framer-motion'; // Para o modal animado

const Transacoes = () => {
  const { theme } = useTheme();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    data: new Date().toISOString().split('T')[0], // Data inicial como hoje
    categoria: "",
    tipo: "receita",
    conta: "",
  });

  const fetchTransacoes = async () => {
    try {
      const data = await transacaoAPI.getAll();
      setTransacoes(data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast.error("Erro ao buscar transações.");
    }
  };

  useEffect(() => {
    fetchTransacoes();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      descricao: "",
      valor: "",
      data: new Date().toISOString().split('T')[0],
      categoria: "",
      tipo: "receita",
      conta: "",
    });
  };

  const openModal = (transacao?: Transacao) => {
    if (transacao) {
      setEditingId(transacao._id);
      const rawDate = (typeof transacao.data === 'object' && transacao.data !== null && '$date' in transacao.data) 
        ? (transacao.data as { $date: string }).$date 
        : transacao.data as string;
      const dataTransacao = new Date(rawDate).toISOString().split('T')[0];
      setFormData({
        descricao: transacao.descricao,
        valor: transacao.valor.toString().replace('.', ','), // Formatar para padrão brasileiro
        data: dataTransacao,
        categoria: transacao.categoria,
        tipo: transacao.tipo,
        conta: transacao.conta,
      });
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    resetForm(); 
  };

  const handleSaveTransacao = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.descricao || !formData.valor || !formData.data || 
          !formData.categoria || !formData.conta) {
        toast.error("Preencha todos os campos obrigatórios");
        setIsSubmitting(false);
        return;
      }
  
      const valorNumerico = Number(
        formData.valor.toString().replace(/[^0-9,-]/g, '').replace(',', '.')
      );
  
      if (isNaN(valorNumerico) || valorNumerico === 0) {
        toast.error("Valor inválido ou igual a zero!");
        setIsSubmitting(false);
        return;
      }
      if (formData.tipo !== 'transferencia' && valorNumerico < 0) {
        toast.error("Valor para receita ou despesa não pode ser negativo.");
        setIsSubmitting(false);
        return;
      }
  
      const dataObj = new Date(formData.data);
      if (isNaN(dataObj.getTime())) {
        toast.error("Data inválida!");
        setIsSubmitting(false);
        return;
      }
  
      const payload = {
        descricao: formData.descricao.trim(),
        valor: valorNumerico,
        categoria: formData.categoria.trim(),
        tipo: formData.tipo,
        conta: formData.conta.trim(),
        data: { $date: dataObj.toISOString() } // Formato MongoDB para data
      };
      
      // Omit _id from payload if it exists to avoid issues with MongoDB's immutable _id field
      const { _id, ...payloadWithoutId } = payload as any;

      if (editingId) {
        await transacaoAPI.update(editingId, payloadWithoutId as NovaTransacaoPayload);
        toast.success("Transação atualizada!");
      } else {
        await transacaoAPI.create(payload as NovaTransacaoPayload);
        toast.success("Transação criada!");
      }
  
      fetchTransacoes();
      closeModal();
  
    } catch (error: unknown) {
      console.error('Erro completo:', error);
      const apiError = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error(`Erro ao salvar: ${apiError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos financeiros (mantidos como antes)
  const totalReceitas = transacoes
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = transacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);
  const transferenciasEntrada = transacoes
    .filter((t) => t.tipo === "transferencia" && t.valor >= 0)
    .reduce((acc, t) => acc + t.valor, 0);
  const transferenciasSaida = transacoes
    .filter((t) => t.tipo === "transferencia" && t.valor < 0)
    .reduce((acc, t) => acc + Math.abs(t.valor), 0);
  const saldoAtual = totalReceitas - totalDespesas + transferenciasEntrada - transferenciasSaida;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const textColor = theme === "dark" ? [200, 200, 200] : [20, 20, 20];
    const backgroundColor = theme === "dark" ? [42, 42, 42] : [255, 255, 255]; // Ajuste no bg escuro
    const headerColor = theme === "dark" ? [55, 55, 55] : [240, 240, 240]; // Ajuste no bg escuro

    doc.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(18);
    doc.text("Relatório de Transações", 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [["Descrição", "Valor (R$)", "Data", "Categoria", "Tipo"]],
      body: transacoes.map((t) => [
        t.descricao,
        t.valor.toFixed(2).replace('.', ','),
        new Date((typeof t.data === 'object' && t.data !== null && '$date' in t.data) ? (t.data as { $date: string }).$date : t.data as string).toLocaleDateString("pt-BR"),
        t.categoria,
        t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1) // Capitalize
      ]),
      theme: 'grid', // um tema mais moderno
      headStyles: {
        fillColor: headerColor,
        textColor: textColor,
        fontStyle: 'bold'
      },
      styles: {
        textColor: textColor,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: theme === "dark" ? [48, 48, 48] : [248, 248, 248],
      },
    });

    doc.save("relatorio-transacoes.pdf");
    toast.success("PDF gerado com sucesso!")
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } p-4 md:p-6`}
    >
      <div className="container mx-auto">
        {/* Header com botão Nova Transação para Desktop */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </span>
              Minhas Transações
            </h1>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Visualize e gerencie suas movimentações financeiras.
            </p>
          </div>
          <div className="flex gap-3">
             <button
                onClick={handleExportPDF}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                title="Exportar para PDF"
              >
                <Download size={18} />
                Exportar PDF
            </button>
            <button
                onClick={() => openModal()}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                <Plus size={18} />
                Nova Transação
            </button>
          </div>
        </div>

        <FinancialSummary 
          saldo={saldoAtual}
          receitas={totalReceitas}
          despesas={totalDespesas}
          transferenciasEntrada={transferenciasEntrada}
          transferenciasSaida={transferenciasSaida}
        />
        
        <div className={`rounded-xl shadow-sm overflow-hidden mb-8 mt-8 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Histórico de Transações</h2>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {transacoes.length} {transacoes.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          {transacoes.length > 0 ? (
            <TransactionTable
              transacoes={transacoes}
              onEdit={openModal} // Passando a função openModal diretamente
              onDelete={async (id) => {
                if (!window.confirm("Tem certeza que deseja excluir esta transação?")) return;
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
          ) : (
            <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhuma transação registrada ainda.
            </div>
          )}
        </div>
      </div>

      {/* Botão Flutuante para Mobile */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden z-40">
        <button
          onClick={handleExportPDF}
          className={`p-3.5 rounded-full shadow-xl transition-all hover:scale-105 ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white flex items-center justify-center`}
          title="Exportar para PDF"
          aria-label="Exportar para PDF"
        >
          <Download size={20} />
        </button>
        <button
          onClick={() => openModal()}
          className={`p-4 rounded-full shadow-xl transition-all hover:scale-105 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center justify-center`}
          title="Nova transação"
          aria-label="Nova transação"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Modal do Formulário (Estilo Metas) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={closeModal} // Fechar ao clicar no overlay
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`rounded-xl shadow-xl w-full max-w-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()} // Evitar fechar ao clicar dentro do modal
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {editingId ? "Editar Transação" : "Nova Transação"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className={`p-1.5 rounded-full ${theme === "dark" ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"}`}
                    aria-label="Fechar modal"
                  >
                    <X size={20} />
                  </button>
                </div>
                <TransactionForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSaveTransacao} // Passando a função de salvar completa
                  onClose={closeModal}
                  isSubmitting={isSubmitting}
                  isEditing={!!editingId}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
        toastClassName={`text-sm rounded-xl shadow-lg ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-white text-gray-800"}`}
      />
    </div>
  );
};

export default Transacoes;
