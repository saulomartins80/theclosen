//src/middlewares/marketDAtaValidation.ts
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

  const { symbols, cryptos, manualAssets, customIndices } = req.body;

  // Check if at least one of the expected fields is provided and is an array (basic check)
  if (!Array.isArray(symbols) && !Array.isArray(cryptos) && !Array.isArray(manualAssets) && !Array.isArray(customIndices)) {
     res.status(400).json({ 
       error: 'At least one of symbols, cryptos, manualAssets, or customIndices must be provided as an array'
     });
     return;
   }

  // Although controller also validates array types, basic type checking here is good practice
   if ((symbols && !Array.isArray(symbols)) || 
       (cryptos && !Array.isArray(cryptos)) || 
       (manualAssets && !Array.isArray(manualAssets)) || 
       (customIndices && !Array.isArray(customIndices))) {
     res.status(400).json({
       error: 'Invalid data format',
       details: 'symbols, cryptos, manualAssets, and customIndices must be arrays if provided.'
     });
     return;
   }

  next();
};