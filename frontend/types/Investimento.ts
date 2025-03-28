// src/types/Investimento.ts
export interface Investimento {
  _id: string; // Mude de 'id' para '_id' para compatibilidade com MongoDB
  nome: string;
  tipo: string;
  valor: number;
  data: string;
}