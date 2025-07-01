import { Document, Schema, model } from 'mongoose';

export interface IInvestimento extends Document {
  nome: string;
  tipo: 'Renda Fixa' | 'Tesouro Direto' | 'Ações' | 'Fundos Imobiliários' | 
        'Criptomoedas' | 'Previdência Privada' | 'ETF' | 'Internacional' | 'Renda Variável' |
        'LCI' | 'LCA' | 'CDB' | 'CDI' | 'Poupança' | 'Fundos de Investimento' | 'Debêntures' |
        'CRA' | 'CRI' | 'Letras de Câmbio' | 'COE' | 'Fundos Multimercado' | 'Fundos Cambiais' |
        'Fundos de Ações' | 'Fundos de Renda Fixa' | 'Fundos de Previdência' | 'Fundos de Crédito Privado';
  valor: number;
  data: Date;
  userId: string;
  // Novos campos para mais detalhes
  instituicao?: string; // Banco ou corretora
  rentabilidade?: number; // Taxa de rentabilidade (%)
  vencimento?: Date; // Data de vencimento
  liquidez?: 'D+0' | 'D+1' | 'D+30' | 'D+60' | 'D+90' | 'D+180' | 'D+365' | 'Sem liquidez';
  risco?: 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto';
  categoria?: string; // Categoria específica do produto
}

const InvestimentoSchema = new Schema({
  nome: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  tipo: { 
    type: String, 
    required: true,
    enum: [
      'Renda Fixa',
      'Tesouro Direto',
      'Ações',
      'Fundos Imobiliários',
      'Criptomoedas',
      'Previdência Privada',
      'ETF',
      'Internacional',
      'Renda Variável',
      'LCI',
      'LCA',
      'CDB',
      'CDI',
      'Poupança',
      'Fundos de Investimento',
      'Debêntures',
      'CRA',
      'CRI',
      'Letras de Câmbio',
      'COE',
      'Fundos Multimercado',
      'Fundos Cambiais',
      'Fundos de Ações',
      'Fundos de Renda Fixa',
      'Fundos de Previdência',
      'Fundos de Crédito Privado'
    ],
    index: true
  },
  valor: { 
    type: Number, 
    required: true,
    min: 0.01,
    set: (v: number) => parseFloat(v.toFixed(2))
  },
  data: { 
    type: Date, 
    required: true 
  },
  userId: { type: String, required: true, index: true },
  // Novos campos opcionais
  instituicao: { 
    type: String, 
    trim: true,
    maxlength: 100
  },
  rentabilidade: { 
    type: Number,
    min: 0,
    max: 1000 // Máximo 1000% para casos extremos
  },
  vencimento: { 
    type: Date 
  },
  liquidez: { 
    type: String,
    enum: ['D+0', 'D+1', 'D+30', 'D+60', 'D+90', 'D+180', 'D+365', 'Sem liquidez']
  },
  risco: { 
    type: String,
    enum: ['Baixo', 'Médio', 'Alto', 'Muito Alto']
  },
  categoria: { 
    type: String,
    trim: true,
    maxlength: 100
  }
}, { 
  timestamps: true,
  versionKey: false
});

InvestimentoSchema.index({ tipo: 1, data: -1 });
InvestimentoSchema.index({ userId: 1, tipo: 1 });
InvestimentoSchema.index({ instituicao: 1 });
InvestimentoSchema.index({ vencimento: 1 });

export default model<IInvestimento>('Investimento', InvestimentoSchema);