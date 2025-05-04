export type Meta = {
  _id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
  dataLimite: string;
  concluida: boolean;
  createdAt?: string;
  categoria?: string;
  prioridade?: 'baixa' | 'media' | 'alta';
};

export type FormMeta = Omit<Meta, "_id" | "createdAt" | "concluida"> & {
  observacoes?: string;
};