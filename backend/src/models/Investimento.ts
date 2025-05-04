// src/models/Investimento.ts
import { Document, Schema, model } from 'mongoose';

export interface IInvestimento extends Document {
  nome: string;
  tipo: 'Renda Fixa' | 'Ações' | 'Fundos Imobiliários' | 'Criptomoedas';
  valor: number;
  data: Date;
}

const InvestimentoSchema = new Schema({
  nome: { 
    type: String, 
    required: true,
    trim: true
  },
  tipo: { 
    type: String, 
    required: true,
    enum: ['Renda Fixa', 'Ações', 'Fundos Imobiliários', 'Criptomoedas']
  },
  valor: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  data: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Data deve ser hoje ou futura'
    }
  }
}, { 
  timestamps: true
});

export default model<IInvestimento>('Investimento', InvestimentoSchema);