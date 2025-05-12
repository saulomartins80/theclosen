import { Document, Schema, model } from 'mongoose';

export interface IInvestimento extends Document {
  nome: string;
  tipo: 'Renda Fixa' | 'Tesouro Direto' | 'Ações' | 'Fundos Imobiliários' | 
        'Criptomoedas' | 'Previdência Privada' | 'ETF' | 'Internacional' | 'Renda Variável';
  valor: number;
  data: Date;
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
      'Renda Variável'
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
    required: true // Removida a validação de data futura
  }
}, { 
  timestamps: true,
  versionKey: false
});

InvestimentoSchema.index({ tipo: 1, data: -1 });

export default model<IInvestimento>('Investimento', InvestimentoSchema);