import { Request, Response, NextFunction } from 'express';

export const validateMarketDataRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body) {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }

  const { symbols, cryptos, customIndices } = req.body;

  if (!symbols && !cryptos && !customIndices) {
    res.status(400).json({ 
      error: 'At least one of symbols, cryptos or customIndices must be provided'
    });
    return;
  }

  next();
};