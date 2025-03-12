// src/types/Transacao.ts
export interface Transacao {
  _id: {
    $oid: string; // MongoDB usa `_id` com um campo `$oid`
  };
  descricao: string;
  valor: number;
  data: {
    $date: string; // MongoDB usa `data` com um campo `$date`
  };
  categoria: string;
  tipo: "receita" | "despesa" | "transferencia";
  conta: string;
  __v?: number; // Adicione `__v` se necessário
}