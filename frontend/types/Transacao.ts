// types//Transacao.ts
export type Transacao = {
  _id: string;
  descricao: string;
  valor: number;
  data: string | { $date: string }; // Atualizado para corresponder ao payload
  categoria: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  conta: string;
  observacao: string; // Add this line
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