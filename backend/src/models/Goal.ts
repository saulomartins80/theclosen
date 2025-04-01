// src/models/Goal.ts
import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema({
  meta: {
    type: String,
    required: [true, "O campo 'meta' é obrigatório"],
    trim: true,
    maxlength: [100, "Meta não pode exceder 100 caracteres"]
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, "Descrição não pode exceder 500 caracteres"],
    default: ""
  },
  valor_total: {
    type: Number,
    required: [true, "O campo 'valor_total' é obrigatório"],
    min: [0, "Valor total não pode ser negativo"]
  },
  valor_atual: {
    type: Number,
    min: [0, "Valor atual não pode ser negativo"],
    default: 0
  },
  data_conclusao: {
    type: Date,
    required: [true, "O campo 'data_conclusao' é obrigatório"]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "O campo 'userId' é obrigatório"],
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhor performance
GoalSchema.index({ userId: 1 });
GoalSchema.index({ data_conclusao: 1 });

export const Goal = mongoose.model("Goal", GoalSchema);