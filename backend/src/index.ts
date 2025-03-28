import express from 'express';
import mongoose from 'mongoose';

const app = express();

// Middleware básico
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'API do Finanext está funcionando',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro no MongoDB:', err));

// Export para Vercel
export default app;