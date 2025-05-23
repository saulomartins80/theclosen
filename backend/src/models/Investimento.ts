import { Document, Schema, model } from 'mongoose';

export interface IInvestimento extends Document {
  nome: string;
  tipo: 'Renda Fixa' | 'Tesouro Direto' | 'Ações' | 'Fundos Imobiliários' | 
        'Criptomoedas' | 'Previdência Privada' | 'ETF' | 'Internacional' | 'Renda Variável';
  valor: number;
  data: Date;
  userId: Schema.Types.ObjectId; // NOVO CAMPO
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
    required: true 
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // NOVO CAMPO
}, { 
  timestamps: true,
  versionKey: false
});

InvestimentoSchema.index({ tipo: 1, data: -1 });
// Adicionar um índice composto se você frequentemente busca investimentos por usuário e outro critério
// Exemplo: InvestimentoSchema.index({ userId: 1, tipo: 1 });

export default model<IInvestimento>('Investimento', InvestimentoSchema);