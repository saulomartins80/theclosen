// src/models/Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  conta: string;
}

const lancamentosSchema: Schema = new Schema({
  descricao: { type: String, required: true },
  valor: { type: Number, required: true },
  tipo: { type: String, enum: ['receita', 'despesa'], required: true },
  categoria: { type: String, required: true },
  conta: { type: String, required: true },
});

const Transaction = mongoose.model<ITransaction>('Transaction', lancamentosSchema);

export default Transaction;