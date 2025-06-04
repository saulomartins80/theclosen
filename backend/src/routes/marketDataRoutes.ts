//src/routes/marketDAtaRoutes.ts
import express from 'express';
import { getMarketDataController } from '../controllers/marketDataController';
import { validateMarketDataRequest } from '../middlewares/marketDataValidation';

const router = express.Router();

router.post('/', 
  express.json(),
  validateMarketDataRequest,
  async (req, res, next) => {
    try {
      await getMarketDataController(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;