export type Prioridade = 'baixa' | 'media' | 'alta';

export type Meta = {
  _id: string;
  meta: string;
  descricao: string;
  valor_total: number;
  valor_atual: number;
  data_conclusao: string;
  userId: string;
  concluida: boolean;
  createdAt?: string;
  categoria?: string;
  prioridade?: Prioridade;
};

// Tipo para criação - todos os campos obrigatórios exceto os omitidos
export type NovaMeta = {
  meta: string;
  descricao: string;
  valor_total: number;
  valor_atual: number;
  data_conclusao: string;
  userId: string;
  categoria?: string;
  prioridade?: Prioridade;
};

// Tipo para atualização - todos os campos opcionais exceto _id
export type AtualizarMeta = Partial<Omit<Meta, '_id'>> & { _id: string };