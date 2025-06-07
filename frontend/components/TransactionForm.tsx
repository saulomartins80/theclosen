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
  data: { $date: string };
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
      const isValidFormat = /^-?\d+(,\d{1,2})?$/.test(value);
      if (!isValidFormat) {
        return "Formato inválido (ex: -250,00 ou 150,50)";
      }
      const numericValue = parseFloat(value.replace(',', '.'));
      if (numericValue === 0) return "Valor não pode ser zero";
      if (formData.tipo !== "transferencia" && numericValue <= 0) {
        return "Valor deve ser positivo";
      }
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "tipo") {
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
      let cleanedValue = value.replace(/[^0-9,-]/g, "");
      if ((cleanedValue.match(/-/g) || []).length > 1) {
        cleanedValue = cleanedValue.replace(/-/g, '');
      }
      if (cleanedValue.includes('-') && !cleanedValue.startsWith('-')) {
        cleanedValue = '-' + cleanedValue.replace(/-/g, '');
      }
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
    const newErrors = {
      descricao: validateField("descricao", formData.descricao),
      valor: validateField("valor", formData.valor),
      data: validateField("data", formData.data),
      categoria: validateField("categoria", formData.categoria),
      conta: validateField("conta", formData.conta),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) return;

    try {
      // Validação adicional da data com horário fixo UTC
      const dataObj = new Date(formData.data + 'T12:00:00Z');
      if (isNaN(dataObj.getTime())) {
        toast.error("Por favor, insira uma data válida");
        return;
      }

      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor.replace(',', '.')),
        data: { $date: dataObj.toISOString() },
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
    // O wrapper do formulário será o modal em si na página transacoes.tsx
    // Esta div interna organiza os campos, similar ao `space-y-4` do form de metas.
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Campo Descrição */}
      <div>
        <label htmlFor="descricao" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Descrição*</label>
        <input
          id="descricao"
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          placeholder="Ex: Salário Mensal, Compra de Supermercado"
          className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.descricao ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
        />
        {errors.descricao && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={14} /> {errors.descricao}
          </p>
        )}
      </div>

      {/* Linha com Valor e Data (similar ao form de metas com grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="valor" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Valor*</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">R$</span>
            <input
              id="valor"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              placeholder="0,00"
              className={`w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.valor ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
            />
          </div>
          {errors.valor && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.valor}
            </p>
          )}
           {formData.tipo === "transferencia" && formData.valor && !errors.valor && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {formData.valor.startsWith('-') 
                ? "Esta transferência será registrada como SAÍDA." 
                : "Esta transferência será registrada como ENTRADA."}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="data" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Data*</label>
          <input
            type="date"
            id="data"
            name="data"
            value={formData.data}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] ${errors.data ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
          />
          {errors.data && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.data}
            </p>
          )}
        </div>
      </div>

      {/* Campo Categoria */}
      <div>
        <label htmlFor="categoria" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Categoria*</label>
        <input
          id="categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          placeholder="Ex: Alimentação, Transporte, Lazer"
          className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.categoria ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
        />
        {errors.categoria && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={14} /> {errors.categoria}
          </p>
        )}
      </div>

      {/* Linha com Tipo e Conta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tipo" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo*</label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          >
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>
        <div>
          <label htmlFor="conta" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Conta*</label>
          <input
            id="conta"
            name="conta"
            value={formData.conta}
            onChange={handleChange}
            placeholder="Ex: Conta Corrente, Carteira"
            className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.conta ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
          />
          {errors.conta && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.conta}
            </p>
          )}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-4"> {/* Aumentado o padding-top e gap */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CheckCircle size={18} />
          )}
          {isEditing ? "Salvar Alterações" : "Adicionar Transação"}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;