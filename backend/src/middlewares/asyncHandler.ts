import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';

type AsyncFunction = (req: Request | AuthRequest, res: Response) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => (
  req: Request | AuthRequest,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res)).catch(next);
}; 