import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import transacoesRoutes from "./routes/transacoesRoutes";
import goalsRoutes from "./routes/goalsRoutes";
import investimentoRoutes from './routes/investimentoRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", transacoesRoutes);
app.use("/api", goalsRoutes);
app.use('/api', investimentoRoutes);

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("Conectado ao MongoDB.");
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}.`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar ao MongoDB:", error);
  });