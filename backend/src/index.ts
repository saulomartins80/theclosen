import './config/env'; 
import 'reflect-metadata';
import express from 'express';
import 'module-alias/register';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { container } from '@core/container';
import { errorHandler } from '@middlewares/errorHandler';
import { AppError } from '@core/errors/AppError';

import { adminAuth } from '@config/firebaseAdmin';
import { Server } from 'http';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Rotas
import transacoesRouter from './routes/transacoesRoutes';
import goalsRouter from './routes/goalsRoutes';
import investimentoRouter from './routes/investimentoRoutes';
import userRouter from './routes/userRoutes';
import subscriptionRouter from './routes/subscriptionRoutes';
import authRoutes from './routes/authRoutes'; 
import marketDataRoutes from './routes/marketDataRoutes'; 
//import weatherRoutes from './routes/weatherRoutes';

interface HealthCheckResponse {
  status: 'OK' | 'PARTIAL' | 'FAIL';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: DatabaseHealth;
    firebase: FirebaseHealth;
  };
  resources: {
    memory: MemoryUsage;
    cpu?: CpuUsage;
  };
}

interface DatabaseHealth {
  status: boolean;
  type: string;
  latency: number;
  details: {
    host: string;
    name: string;
    collections: number;
  };
}

interface FirebaseHealth {
  status: boolean;
  type: string;
  latency: number;
}

interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
}

interface CpuUsage {
  load1m?: number;
  load5m?: number;
  load15m?: number;
}

const app = express();
const PORT = process.env.PORT || 5000;

// A validação de variáveis de ambiente agora é primariamente feita em config/env.ts
// Você pode remover ou ajustar esta seção se desejar.
// const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'FIREBASE_ADMIN_PROJECT_ID']; 
// requiredEnvVars.forEach(env => {
//   if (!process.env[env]) {
//     console.error(`❌ Variável de ambiente necessária faltando: ${env}`);
//     process.exit(1);
//   }
// });

app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://accounts.google.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
  exposedHeaders: ['Authorization', 'Set-Cookie']
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', apiLimiter);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: "BACKEND OPERACIONAL",
    ambiente: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    versao: process.env.npm_package_version || "1.0.0"
  });
});

app.get('/health', (async (req: express.Request, res: express.Response): Promise<void> => {
  const healthCheck: HealthCheckResponse = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: false,
        type: 'MongoDB',
        latency: -1,
        details: {
          host: '',
          name: '',
          collections: 0
        }
      },
      firebase: {
        status: false,
        type: 'Firebase Admin',
        latency: -1
      }
    },
    resources: {
      memory: {
        rss: '0 MB',
        heapTotal: '0 MB',
        heapUsed: '0 MB',
        external: '0 MB'
      }
    }
  };

  try {
    const mongoStart = Date.now();
    const mongoStatus = mongoose.connection.readyState === 1;
    
    if (mongoStatus && mongoose.connection.db) {
      try {
        await mongoose.connection.db.admin().ping();
        const collections = mongoose.connection.collections;
        const collectionsCount = Object.keys(collections).length;
        
        healthCheck.services.database = {
          status: true,
          type: 'MongoDB',
          latency: Date.now() - mongoStart,
          details: {
            host: mongoose.connection.host,
            name: mongoose.connection.name || '',
            collections: collectionsCount
          }
        };
      } catch (mongoError) {
        healthCheck.services.database.status = false;
        healthCheck.status = 'PARTIAL';
      }
    } else {
      healthCheck.status = 'PARTIAL';
    }

    const firebaseStart = Date.now();
    try {
      await adminAuth.listUsers(1);
      healthCheck.services.firebase = {
        status: true,
        type: 'Firebase Admin',
        latency: Date.now() - firebaseStart
      };
    } catch (firebaseError) {
      healthCheck.services.firebase.status = false;
      healthCheck.status = healthCheck.status === 'OK' ? 'PARTIAL' : 'FAIL';
    }

    const memory = process.memoryUsage();
    healthCheck.resources.memory = {
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`
    };

    if (process.platform !== 'win32') {
      const os = require('os');
      const load = os.loadavg();
      healthCheck.resources.cpu = {
        load1m: load[0],
        load5m: load[1],
        load15m: load[2]
      };
    }

    if (!healthCheck.services.database.status || !healthCheck.services.firebase.status) {
      healthCheck.status = 'FAIL';
    }

    const httpStatus = healthCheck.status === 'OK' ? 200 : 
                      healthCheck.status === 'PARTIAL' ? 206 : 503;
    
    res.status(httpStatus).json(healthCheck);

  } catch (error) {
    healthCheck.status = 'FAIL';
    res.status(503).json(healthCheck);
  }
}) as express.RequestHandler);

app.use("/api/transacoes", transacoesRouter);
app.use('/api', goalsRouter)
app.use("/api/investimentos", investimentoRouter);
app.use("/api/users", userRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use('/api/auth', authRoutes);
app.use('/api/market-data', marketDataRoutes);
//app.use('/api/weather', weatherRoutes);

app.use(errorHandler as express.ErrorRequestHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

let server: Server;

const startServer = async () => {
  try {
    // A verificação do MONGO_URI já acontece em config/env.ts se estiver na requiredVars
    // if (!process.env.MONGO_URI) {
    //   throw new AppError(500, "MONGO_URI não definida no .env");
    // }

    await mongoose.connect(process.env.MONGO_URI!, { // Adicionado ! pois config/env garante que existe
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 50,
      retryWrites: true,
      w: 'majority'
    });

    console.log("✅ Conectado ao MongoDB");

    server = app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🔗 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    setInterval(() => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ Conexão com MongoDB perdida. Tentando reconectar...');
      }
    }, 60000);

  } catch (error) {
    console.error("❌ Falha na inicialização:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

startServer();

export default app;