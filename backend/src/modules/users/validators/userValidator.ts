// src/modules/users/validators/userValidator.ts
import { body } from 'express-validator';
import { User } from '../../../models/User';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),

  body('email')
    .isEmail().withMessage('E-mail inválido')
    .custom(async email => {
      const user = await User.findOne({ email });
      if (user) throw new Error('E-mail já cadastrado');
    }),

  body('password')
    .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
];

export const loginValidator = [
  body('email').isEmail().withMessage('E-mail inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];