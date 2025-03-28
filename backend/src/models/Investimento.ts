import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestimento extends Document {
  nome: string;
  tipo: string;
  valor: number;
  data: Date;
  usuario?: mongoose.Types.ObjectId; // Tornamos opcional
}

const InvestimentoSchema: Schema = new Schema({
  nome: { type: String, required: true },
  tipo: { 
    type: String, 
    required: true,
    enum: ['Renda Fixa', 'Ações', 'Fundos Imobiliários'],
    default: 'Renda Fixa'
  },
  valor: { type: Number, required: true },
  data: { type: Date, required: true },
  usuario: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // Alterado para false
  }
}, {
  timestamps: true
});

export default mongoose.model<IInvestimento>('Investimento', InvestimentoSchema);