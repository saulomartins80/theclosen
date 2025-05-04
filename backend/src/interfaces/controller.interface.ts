// src/interfaces/controller.interface.ts
import { Request, Response } from 'express';

export interface IController {
  (req: Request, res: Response): Promise<void>;
}

export interface ICRUDController {
  create: IController;
  read: IController;
  update: IController;
  delete: IController;
}