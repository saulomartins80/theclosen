export type TipoInvestimento = 
  'Renda Fixa' | 
  'Tesouro Direto' | 
  'Ações' | 
  'Fundos Imobiliários' | 
  'Criptomoedas' | 
  'Previdência Privada' | 
  'ETF' | 
  'Internacional' | 
  'Renda Variável' |
  'LCI' | 
  'LCA' | 
  'CDB' | 
  'CDI' | 
  'Poupança' | 
  'Fundos de Investimento' | 
  'Debêntures' |
  'CRA' | 
  'CRI' | 
  'Letras de Câmbio' | 
  'COE' | 
  'Fundos Multimercado' | 
  'Fundos Cambiais' |
  'Fundos de Ações' | 
  'Fundos de Renda Fixa' | 
  'Fundos de Previdência' | 
  'Fundos de Crédito Privado';

export interface Investimento {
  _id: string;
  nome: string;
  tipo: TipoInvestimento;
  valor: number;
  data: string;
  meta?: number;
  // Novos campos opcionais
  instituicao?: string;
  rentabilidade?: number;
  vencimento?: string;
  liquidez?: 'D+0' | 'D+1' | 'D+30' | 'D+60' | 'D+90' | 'D+180' | 'D+365' | 'Sem liquidez';
  risco?: 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto';
  categoria?: string;
}