// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import mongoose from 'mongoose';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(error.details && { details: error.details })
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      details: error.message
    });
    return;
  }

  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    res.status(400).json({
      status: 'error',
      message: 'Dados duplicados',
      details: 'Já existe um registro com esses valores'
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Erro interno no servidor'
  });
}