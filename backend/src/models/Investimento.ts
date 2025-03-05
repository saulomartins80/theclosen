// src/models/Investimento.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestimento extends Document {
  nome: string;
  tipo: string;
  valor: number;
  data: Date;
}

const InvestimentoSchema: Schema = new Schema({
  nome: { type: String, required: true },
  tipo: { type: String, required: true, default: "Renda Fixa" }, // Valor padrão
  valor: { type: Number, required: true },
  data: { type: Date, default: Date.now }
});

export default mongoose.model<IInvestimento>('Investimento', InvestimentoSchema);