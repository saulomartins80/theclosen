import { Container } from 'inversify';
import { TYPES } from './types';
import { UserRepository } from '../modules/users/repositories/UserRepository';
import { UserService } from '../modules/users/services/UserService';
import { SubscriptionService } from '../services/subscriptionService';
import { UserController } from '../modules/users/controllers/UserController';
import { SubscriptionController } from '../modules/subscriptions/controllers/SubscriptionController';
import { StripeService } from '../services/StripeService';
import { EnterpriseService } from '../modules/enterprise/services/EnterpriseService';
import { EnterpriseController } from '../modules/enterprise/controllers/EnterpriseController';

// Criar uma nova instância do container
const container = new Container();

// Registrar as dependências
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();
container.bind<SubscriptionService>(TYPES.SubscriptionService).to(SubscriptionService).inSingletonScope();
container.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();
container.bind<SubscriptionController>(TYPES.SubscriptionController).to(SubscriptionController).inSingletonScope();
container.bind<StripeService>(TYPES.StripeService).to(StripeService).inSingletonScope();

// Registrar EnterpriseService e EnterpriseController
container.bind<EnterpriseService>('EnterpriseService').to(EnterpriseService).inSingletonScope();
container.bind<EnterpriseController>('EnterpriseController').to(EnterpriseController).inSingletonScope();

export { container }; 