import React, { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from 'react-toastify';

type TransactionType = "receita" | "despesa" | "transferencia";

interface FormData {
  descricao: string;
  valor: string;
  data: string;
  categoria: string;
  tipo: TransactionType;
  conta: string;
}

interface TransactionPayload {
  descricao: string;
  valor: number;
  data: { $date: string };  // Formato MongoDB
  categoria: string;
  tipo: TransactionType;
  conta: string;
}

interface TransactionFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSave: (payload: TransactionPayload) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  formData,
  setFormData,
  onSave,
  onClose,
  isSubmitting = false,
  isEditing = false,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    if (!value.trim()) return "Campo obrigatório";

    if (name === "valor") {
      // Aceita números com até 2 decimais e opcionalmente sinal negativo
      const isValidFormat = /^-?\d+(,\d{1,2})?$/.test(value);

      if (!isValidFormat) {
        return "Formato inválido (ex: -250,00 ou 150,50)";
      }

      // Converte para número para verificar se é zero
      const numericValue = parseFloat(value.replace(',', '.'));
      if (numericValue === 0) return "Valor não pode ser zero";

      // Validação específica para transferências negativas
      if (formData.tipo === "transferencia" && numericValue < 0) {
        return ""; // Transferências negativas são válidas
      }

      // Para outros tipos, verifica se é positivo
      if (formData.tipo !== "transferencia" && numericValue <= 0) {
        return "Valor deve ser positivo";
      }
    }

    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "tipo") {
      // Se mudar para transferência, mantém o valor (pode ser negativo)
      // Se mudar para receita/despesa, remove o sinal negativo
      const cleanedValue = value === "transferencia" 
        ? formData.valor 
        : formData.valor.replace("-", "");

      setFormData((prev) => ({ 
        ...prev, 
        tipo: value as TransactionType, 
        valor: cleanedValue 
      }));
      return;
    }

    if (name === "valor") {
      // Permite apenas números, vírgula e sinal negativo (apenas para transferências)
      let cleanedValue = value.replace(/[^0-9,-]/g, "");

      // Remove múltiplos sinais negativos
      if ((cleanedValue.match(/-/g) || []).length > 1) {
        cleanedValue = cleanedValue.replace(/-/g, '');
      }

      // Garante que o sinal negativo (se existir) está no início
      if (cleanedValue.includes('-') && !cleanedValue.startsWith('-')) {
        cleanedValue = '-' + cleanedValue.replace(/-/g, '');
      }

      // Para tipos que não são transferência, remove o sinal negativo
      if (formData.tipo !== "transferencia") {
        cleanedValue = cleanedValue.replace("-", "");
      }

      setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validação dos campos (mantido igual)
    const newErrors = {
      descricao: validateField("descricao", formData.descricao),
      valor: validateField("valor", formData.valor),
      data: validateField("data", formData.data),
      categoria: validateField("categoria", formData.categoria),
      conta: validateField("conta", formData.conta),
    };
  
    setErrors(newErrors);
    if (Object.values(newErrors).some((e) => e)) return;
  
    try {
      // Prepara os dados para envio no formato correto
      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor.replace(',', '.')),
        // Formato MongoDB para a data
        data: { $date: new Date(formData.data).toISOString() },
        categoria: formData.categoria,
        tipo: formData.tipo,
        conta: formData.conta
      };
  
      await onSave(payload);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xs mx-auto p-4 space-y-3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
      noValidate
    >
      {/* Cabeçalho único */}
      <h2 className="text-lg font-semibold text-center mb-2 text-gray-800 dark:text-white">
        {isEditing ? "Editar Transação" : "Nova Transação"}
      </h2>

      {/* Campo Descrição */}
      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Descrição*</label>
        <input
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          placeholder="Salário, Aluguel, etc."
          className={`w-full p-2 text-sm rounded border ${
            errors.descricao 
              ? "border-red-500" 
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-700 text-gray-800 dark:text-white`}
        />
        {errors.descricao && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.descricao}
          </p>
        )}
      </div>

      {/* Campo Valor */}
      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Valor*</label>
        <div className="relative">
          <span className="absolute left-2 top-2 text-gray-500 dark:text-gray-400">R$</span>
          <input
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            placeholder="0,00"
            className={`w-full p-2 pl-8 text-sm rounded border ${
              errors.valor 
                ? "border-red-500" 
                : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-700 text-gray-800 dark:text-white`}
          />
        </div>
        {errors.valor && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.valor}
          </p>
        )}
        {formData.tipo === "transferencia" && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            {formData.valor.startsWith('-') 
              ? "Esta transferência será registrada como saída" 
              : "Esta transferência será registrada como entrada"}
          </p>
        )}
      </div>

      {/* Campo Data */}
      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Data*</label>
        <input
          type="date"
          name="data"
          value={formData.data}
          onChange={handleChange}
          className={`w-full p-2 text-sm rounded border ${
            errors.data 
              ? "border-red-500" 
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-700 text-gray-800 dark:text-white`}
        />
        {errors.data && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.data}
          </p>
        )}
      </div>

      {/* Campo Categoria */}
      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Categoria*</label>
        <input
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          placeholder="Ex: Alimentação, Transporte"
          className={`w-full p-2 text-sm rounded border ${
            errors.categoria 
              ? "border-red-500" 
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-700 text-gray-800 dark:text-white`}
        />
        {errors.categoria && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.categoria}
          </p>
        )}
      </div>

      {/* Campo Tipo */}
      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Tipo*</label>
        <select
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        >
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
          <option value="transferencia">Transferência</option>
        </select>
      </div>

      {/* Campo Conta */}
      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Conta*</label>
        <input
          name="conta"
          value={formData.conta}
          onChange={handleChange}
          placeholder="Ex: Conta Corrente, Carteira"
          className={`w-full p-2 text-sm rounded border ${
            errors.conta 
              ? "border-red-500" 
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-700 text-gray-800 dark:text-white`}
        />
        {errors.conta && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.conta}
          </p>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1.5 text-xs rounded bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 transition-colors disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle size={12} />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;