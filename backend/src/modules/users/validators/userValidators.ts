// src/modules/users/validators/userValidators.ts
import { body } from 'express-validator';

export const userValidators = {
  register: [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
  ],
  login: [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
  ],
  updateProfile: [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido')
  ],
  updateSettings: [
    body('settings').isObject().withMessage('Configurações devem ser um objeto')
  ]
};
