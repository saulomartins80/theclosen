// src/core/container.ts
import { Container } from 'inversify';
import { UserService } from '../modules/users/services/UserService';
import { UserRepository } from '../modules/users/repositories/UserRepository';
import { UserController } from '../modules/users/controllers/UserController';
import { SubscriptionService } from '../services/subscriptionService';
import { TYPES } from './types';

const container = new Container();

container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<SubscriptionService>(TYPES.SubscriptionService).to(SubscriptionService);

export { container };