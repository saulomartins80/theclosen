// src/core/types.ts

export const TYPES = {
  // User Module
  UserRepository: Symbol.for('UserRepository'),
  UserService: Symbol.for('UserService'),
  UserController: Symbol.for('UserController'),
  
  // Subscription Module (Firestore)
  SubscriptionService: Symbol.for('SubscriptionService'),
  
  // Adicione outros módulos abaixo seguindo o mesmo padrão:
  // Exemplo:
  // AuthRepository: Symbol.for('AuthRepository'),
  // AuthService: Symbol.for('AuthService'),
  // AuthController: Symbol.for('AuthController'),
  
  // Serviços compartilhados
  // Logger: Symbol.for('Logger'),
  // Config: Symbol.for('Config')
};