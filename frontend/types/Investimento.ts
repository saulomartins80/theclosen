export type TipoInvestimento = 
  'Renda Fixa' | 
  'Tesouro Direto' | 
  'Ações' | 
  'Fundos Imobiliários' | 
  'Criptomoedas' | 
  'Previdência Privada' | 
  'ETF' | 
  'Internacional' | 
  'Renda Variável';

export interface Investimento {
  _id: string;
  nome: string;
  tipo: TipoInvestimento;
  valor: number;
  data: string;
}