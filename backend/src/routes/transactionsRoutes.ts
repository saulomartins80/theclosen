// src/routes/transactionsRoutes.ts
import express from 'express';
import Transaction from '../models/Transaction'; // Importe o modelo de transação

const router = express.Router();

// Rota para buscar todas as transações
router.get('/lancamentos', async (req, res) => {
  try {
    // Busca todas as transações no banco de dados
    const lancamentos = await Transaction.find(); // Use o modelo Transaction
    res.json({ lancamentos }); // Corrigido o nome da variável
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    res.status(500).json({ message: 'Erro ao buscar transações', error });
  }
});

export default router;