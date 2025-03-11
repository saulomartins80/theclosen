import { Schema, model } from "mongoose";

const goalSchema = new Schema({
  meta: { type: String, required: true },
  descricao: { type: String, required: true },
  valor_total: { type: Number, required: true },
  valor_atual: { type: Number, required: true },
  data_conclusao: { type: Date, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Goal = model("Goal", goalSchema);