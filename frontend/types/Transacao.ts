export type Transacao = {
  _id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  conta: string;
};

export type NovaTransacaoPayload = {
  descricao: string;
  valor: number;
  data: string | { $date: string };
  categoria: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  conta: string;
};

export type AtualizarTransacaoPayload = Partial<Omit<Transacao, '_id'>>;