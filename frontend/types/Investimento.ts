export type Investimento = {
  _id: string;
  nome: string;
  tipo: 'Renda Fixa' | 'Ações' | 'Fundos Imobiliários' | 'Criptomoedas';
  valor: number;
  data: string;
  rentabilidade?: number;
};