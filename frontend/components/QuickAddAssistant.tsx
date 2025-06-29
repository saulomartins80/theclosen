import { useState } from 'react';
import { X } from 'lucide-react';
import { transacaoAPI, metaAPI, investimentoAPI } from '../services/api';

interface QuickAddAssistantProps {
  onClose: () => void;
  onSuccess?: (type: 'transaction' | 'goal' | 'investment', data: any) => void;
}

interface FormStep {
  question: string;
  field: string;
  type: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  optional?: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

interface FormModel {
  title: string;
  steps: FormStep[];
}

interface ValidationError {
  field: string;
  message: string;
}

export const QuickAddAssistant = ({ 
  onClose,
  onSuccess
}: QuickAddAssistantProps) => {
  const [activeTab, setActiveTab] = useState<'transaction' | 'goal' | 'investment'>('transaction');
  const [formData, setFormData] = useState<any>({});
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Modelos básicos para cada tipo com validações
  const formModels: Record<'transaction' | 'goal' | 'investment', FormModel> = {
    transaction: {
      title: "Adicionar Transação",
      steps: [
        {
          question: "Qual o valor da transação?",
          field: "valor",
          type: "number",
          validation: {
            required: true,
            min: 0.01,
            custom: (value) => {
              if (!value || value <= 0) return "Valor deve ser maior que zero";
              if (value > 1000000) return "Valor muito alto";
              return null;
            }
          }
        },
        {
          question: "É uma receita ou despesa?",
          field: "tipo",
          type: "select",
          options: ["receita", "despesa"],
          validation: {
            required: true
          }
        },
        {
          question: "Qual a categoria?",
          field: "categoria",
          type: "select",
          options: ["alimentação", "transporte", "lazer", "salário", "outros"],
          validation: {
            required: true
          }
        },
        {
          question: "Qual a descrição?",
          field: "descricao",
          type: "text",
          validation: {
            required: true,
            minLength: 3,
            maxLength: 100,
            custom: (value) => {
              if (!value || value.trim().length < 3) return "Descrição deve ter pelo menos 3 caracteres";
              if (value.trim().length > 100) return "Descrição muito longa";
              return null;
            }
          }
        },
        {
          question: "Qual a conta?",
          field: "conta",
          type: "select",
          options: ["Conta Corrente", "Poupança", "Cartão de Crédito", "Dinheiro"],
          validation: {
            required: true
          }
        }
      ]
    },
    goal: {
      title: "Adicionar Meta",
      steps: [
        {
          question: "Qual o nome da sua meta?",
          field: "meta",
          type: "text",
          validation: {
            required: true,
            minLength: 3,
            maxLength: 50,
            custom: (value) => {
              if (!value || value.trim().length < 3) return "Nome da meta deve ter pelo menos 3 caracteres";
              if (value.trim().length > 50) return "Nome da meta muito longo";
              return null;
            }
          }
        },
        {
          question: "Qual o valor total necessário?",
          field: "valor_total",
          type: "number",
          validation: {
            required: true,
            min: 1,
            max: 10000000,
            custom: (value) => {
              if (!value || value <= 0) return "Valor deve ser maior que zero";
              if (value > 10000000) return "Valor muito alto";
              return null;
            }
          }
        },
        {
          question: "Quando deseja alcançar?",
          field: "data_conclusao",
          type: "date",
          validation: {
            required: true,
            custom: (value) => {
              if (!value) return "Data é obrigatória";
              const selectedDate = new Date(value);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (selectedDate < today) return "Data não pode ser no passado";
              if (selectedDate > new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)) {
                return "Data muito distante (máximo 1 ano)";
              }
              return null;
            }
          }
        },
        {
          question: "Qual a categoria?",
          field: "categoria",
          type: "select",
          options: ["Viagem", "Educação", "Casa", "Carro", "Investimento", "Outros"],
          optional: true
        }
      ]
    },
    investment: {
      title: "Adicionar Investimento",
      steps: [
        {
          question: "Qual o nome do investimento?",
          field: "nome",
          type: "text",
          validation: {
            required: true,
            minLength: 2,
            maxLength: 50,
            custom: (value) => {
              if (!value || value.trim().length < 2) return "Nome deve ter pelo menos 2 caracteres";
              if (value.trim().length > 50) return "Nome muito longo";
              return null;
            }
          }
        },
        {
          question: "Qual o tipo de investimento?",
          field: "tipo",
          type: "select",
          options: ["Renda Fixa", "Tesouro Direto", "Ações", "Fundos Imobiliários", "Criptomoedas", "Previdência Privada", "ETF", "Internacional", "Renda Variável"],
          validation: {
            required: true
          }
        },
        {
          question: "Qual o valor investido?",
          field: "valor",
          type: "number",
          validation: {
            required: true,
            min: 1,
            max: 10000000,
            custom: (value) => {
              if (!value || value <= 0) return "Valor deve ser maior que zero";
              if (value > 10000000) return "Valor muito alto";
              return null;
            }
          }
        },
        {
          question: "Quando foi feito o investimento?",
          field: "data",
          type: "date",
          validation: {
            required: true,
            custom: (value) => {
              if (!value) return "Data é obrigatória";
              const selectedDate = new Date(value);
              const today = new Date();
              const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
              
              if (selectedDate > today) return "Data não pode ser no futuro";
              if (selectedDate < oneYearAgo) return "Data muito antiga (máximo 1 ano atrás)";
              return null;
            }
          }
        }
      ]
    }
  };

  const currentStep = formModels[activeTab].steps[step - 1];

  // Função de validação
  const validateField = (field: string, value: any, validation?: any): string | null => {
    if (!validation) return null;

    // Validação required
    if (validation.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return "Este campo é obrigatório";
    }

    // Se o campo é opcional e está vazio, não validar
    if (!validation.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return null;
    }

    // Validação min/max para números
    if (validation.min !== undefined && Number(value) < validation.min) {
      return `Valor mínimo é ${validation.min}`;
    }

    if (validation.max !== undefined && Number(value) > validation.max) {
      return `Valor máximo é ${validation.max}`;
    }

    // Validação minLength/maxLength para strings
    if (validation.minLength && value && value.length < validation.minLength) {
      return `Mínimo de ${validation.minLength} caracteres`;
    }

    if (validation.maxLength && value && value.length > validation.maxLength) {
      return `Máximo de ${validation.maxLength} caracteres`;
    }

    // Validação pattern (regex)
    if (validation.pattern && !validation.pattern.test(value)) {
      return "Formato inválido";
    }

    // Validação custom
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  };

  // Validar campo atual
  const validateCurrentField = (): boolean => {
    const currentValue = formData[currentStep.field];
    const error = validateField(currentStep.field, currentValue, currentStep.validation);
    
    if (error) {
      setValidationErrors([{ field: currentStep.field, message: error }]);
      return false;
    } else {
      setValidationErrors([]);
      return true;
    }
  };

  // Obter erro do campo atual
  const getCurrentFieldError = (): string | null => {
    const error = validationErrors.find(e => e.field === currentStep.field);
    return error ? error.message : null;
  };

  const handleNext = () => {
    // Validar campo atual antes de prosseguir
    if (!validateCurrentField()) {
      return;
    }

    if (step < formModels[activeTab].steps.length) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Validar todos os campos obrigatórios
    const errors: ValidationError[] = [];
    
    formModels[activeTab].steps.forEach(step => {
      if (step.validation?.required || !step.optional) {
        const error = validateField(step.field, formData[step.field], step.validation);
        if (error) {
          errors.push({ field: step.field, message: error });
        }
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setError("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoading(true);
    setError('');
    setValidationErrors([]);
    
    try {
      let result;
      
      if (activeTab === 'transaction') {
        // Adicionar data atual se não fornecida
        const transactionData = {
          ...formData,
          data: formData.data || new Date().toISOString().split('T')[0]
        };
        result = await transacaoAPI.create(transactionData);
      } else if (activeTab === 'goal') {
        result = await metaAPI.create(formData);
      } else if (activeTab === 'investment') {
        result = await investimentoAPI.create(formData);
      }
      
      // Chamar callback de sucesso
      if (onSuccess && result) {
        onSuccess(activeTab, result);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar item:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setStep(1);
    setError('');
    setValidationErrors([]);
  };

  const handleTabChange = (newTab: 'transaction' | 'goal' | 'investment') => {
    setActiveTab(newTab);
    resetForm();
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({...formData, [field]: value});
    
    // Limpar erro do campo quando o usuário começa a digitar
    setValidationErrors(prev => prev.filter(e => e.field !== field));
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold dark:text-white">
            {formModels[activeTab].title}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b dark:border-gray-700 mb-4">
          <button
            onClick={() => handleTabChange('transaction')}
            className={`px-4 py-2 ${activeTab === 'transaction' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Transação
          </button>
          <button
            onClick={() => handleTabChange('goal')}
            className={`px-4 py-2 ${activeTab === 'goal' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Meta
          </button>
          <button
            onClick={() => handleTabChange('investment')}
            className={`px-4 py-2 ${activeTab === 'investment' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Investimento
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {currentStep.question}
            {currentStep.validation?.required && <span className="text-red-500 ml-1">*</span>}
          </p>
          
          {currentStep.type === 'select' ? (
            <select
              value={formData[currentStep.field] || ''}
              onChange={(e) => handleFieldChange(currentStep.field, e.target.value)}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                getCurrentFieldError() ? 'border-red-500' : ''
              }`}
            >
              <option value="">Selecione...</option>
              {currentStep.options && currentStep.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : currentStep.type === 'date' ? (
            <input
              type="date"
              value={formData[currentStep.field] || ''}
              onChange={(e) => handleFieldChange(currentStep.field, e.target.value)}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                getCurrentFieldError() ? 'border-red-500' : ''
              }`}
            />
          ) : (
            <input
              type={currentStep.type}
              value={formData[currentStep.field] || ''}
              onChange={(e) => handleFieldChange(currentStep.field, e.target.value)}
              className={`w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                getCurrentFieldError() ? 'border-red-500' : ''
              }`}
              placeholder={currentStep.question}
            />
          )}

          {getCurrentFieldError() && (
            <p className="text-red-500 text-sm mt-1">{getCurrentFieldError()}</p>
          )}
        </div>

        <div className="flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-300"
              disabled={isLoading}
            >
              Voltar
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-lg ml-auto ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading ? 'Processando...' : 
             step < formModels[activeTab].steps.length ? 'Próximo' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
};