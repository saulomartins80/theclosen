import mongoose, { Schema, Document } from 'mongoose';

// Interface para os dados do lançamento (sem propriedades internas do Mongoose)
export interface ILancamentoData {
  tipo: "receita" | "despesa" | "transferencia";
  descricao: string;
  valor: number;
  data: Date;
  conta: string;
  categoria: string;
}

// Interface para o documento do Mongoose (estende Document)
export interface ILancamento extends ILancamentoData, Document {}

// Defina o schema do Mongoose
const lancamentoSchema: Schema = new Schema({
  descricao: { type: String, required: true },
  valor: { type: Number, required: true },
  tipo: { type: String, enum: ['receita', 'despesa', 'transferencia'], required: true },
  data: { type: Date, default: Date.now },
  categoria: { type: String, required: true },
});

// Crie o modelo usando a interface ILancamento
const Lancamento = mongoose.model<ILancamento>('Lancamento', lancamentoSchema);

export default Lancamento;
