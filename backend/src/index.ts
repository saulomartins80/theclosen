import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import transacoesRouter from './routes/transacoesRoutes';
import goalsRouter from './routes/goalsRoutes';
import investimentoRouter from './routes/investimentoRoutes';
import userRouter from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// ======================================
// Configuração de Middlewares
// ======================================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', apiLimiter);

// ======================================
// Rotas
// ======================================
// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    status: "BACKEND OPERACIONAL",
    ambiente: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    endpoints: {
      transacoes: "/api/transacoes",
      metas: "/api/goals",
      investimentos: "/api/investimentos",
      usuarios: "/api/users",
      health_check: "/health"
    },
    docs: process.env.API_DOCS_URL || "Documentação não configurada"
  });
});

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "CONECTADO" : "OFFLINE",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas da API
app.use("/api/transacoes", transacoesRouter);
app.use("/api/goals", goalsRouter);  // Alterado para manter consistência com as outras rotas
app.use("/api/investimentos", investimentoRouter);
app.use("/api/users", userRouter);

// ======================================
// Inicialização do Servidor
// ======================================
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI não definida no .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 50,
      retryWrites: true,
      w: 'majority'
    });

    console.log("✅ Conectado ao MongoDB");

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("❌ Falha na inicialização:", errorMessage);
    process.exit(1);
  }
};

startServer();

export default app;