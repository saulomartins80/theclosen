// src/core/container.ts
import { Container } from 'inversify';
import { TYPES } from './types';

import { UserService } from '../modules/users/services/UserService';
import { UserRepository } from '../modules/users/repositories/UserRepository';
import { UserController } from '../modules/users/controllers/UserController';
import { SubscriptionService as FirestoreSubscriptionService } from '../services/subscriptionService';

const container = new Container();

// User Module
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();
container.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();

// Subscription Service
container.bind<FirestoreSubscriptionService>(TYPES.SubscriptionService)
  .to(FirestoreSubscriptionService)
  .inSingletonScope();

export { container };