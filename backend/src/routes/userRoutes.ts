import express, { Request, Response } from 'express';
import { loginUser } from '../services/authService';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await loginUser(email, password);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Erro desconhecido' });
    }
  }
});

export default router;