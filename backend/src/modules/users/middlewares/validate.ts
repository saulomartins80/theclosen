import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../../../core/errors/AppError';

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation: any) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const formattedErrors = errors.array().map((err: any) => ({
      field: err.param,
      message: err.msg
    }));

    throw new AppError(422, 'Erro de validação', JSON.stringify(formattedErrors));
  };
};