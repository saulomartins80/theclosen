import { Schema, model, Document } from 'mongoose';

// Interface para os dados da transação
export interface ITransacao {
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
  tipo: "receita" | "despesa" | "transferencia";
  conta: string;
}

// Interface para o documento do Mongoose
export interface ITransacaoDocument extends ITransacao, Document {}

// Defina o schema do Mongoose
const transacaoSchema = new Schema<ITransacaoDocument>({
  descricao: { type: String, required: true },
  valor: { type: Number, required: true },
  data: { type: Date, required: true },
  categoria: { type: String, required: true },
  tipo: { type: String, required: true, enum: ["receita", "despesa", "transferencia"] },
  conta: { type: String, required: true },
});

// Crie o modelo usando a interface ITransacaoDocument
const Transacao = model<ITransacaoDocument>('Transacao', transacaoSchema);

export default Transacao;