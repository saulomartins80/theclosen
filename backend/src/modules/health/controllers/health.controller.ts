import { Request, Response } from 'express';
import { stripe } from '../../../config/stripe';
import { logInfo } from '../../../utils/logger';
import mongoose from 'mongoose';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    const health = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'OK' : 'ERROR',
        stripe: 'OK'
      }
    };

    // Verifica conexão com Stripe
    try {
      await stripe.balance.retrieve();
    } catch (error) {
      health.services.stripe = 'ERROR';
      logInfo('Stripe health check failed', { error });
    }

    // Verifica conexão com MongoDB
    if (mongoose.connection.readyState !== 1) {
      health.services.database = 'ERROR';
      logInfo('MongoDB health check failed', { state: mongoose.connection.readyState });
    }

    const isHealthy = health.services.database === 'OK' && health.services.stripe === 'OK';
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    logInfo('Health check failed', { error });
    res.status(503).json({
      uptime: process.uptime(),
      message: 'ERROR',
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 