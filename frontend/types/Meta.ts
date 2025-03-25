export interface Meta {
  _id?: string;
  meta: string;
  descricao: string;
  valor_total: number;
  valor_atual: number;
  data_conclusao: string;
  userId: string;
  createdAt?: string;
  observacoes?: string;
}

// Defina e exporte FormMeta
export interface FormMeta extends Omit<Meta, "_id" | "createdAt"> {
  observacoes: string; // Adicione propriedades específicas do formulário
}
