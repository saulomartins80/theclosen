import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import transacoesRoutes from "./routes/transacoesRoutes";
import goalsRoutes from "./routes/goalsRoutes";
import investimentoRoutes from './routes/investimentoRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração para Vercel
const isVercel = process.env.VERCEL === '1';

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", transacoesRoutes);
app.use("/api", goalsRoutes);
app.use('/api', investimentoRoutes);

// Rota de health check para Vercel
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', environment: process.env.NODE_ENV });
});

// Conectar ao MongoDB
const mongoUri = isVercel ? process.env.MONGO_URI_PROD : process.env.MONGO_URI;

mongoose.connect(mongoUri as string)
  .then(() => {
    console.log("Conectado ao MongoDB.");
    
    if (!isVercel) {
      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}.`);
      });
    }
  })
  .catch((error) => {
    console.error("Erro ao conectar ao MongoDB:", error);
  });

// Export para Vercel
export default app;