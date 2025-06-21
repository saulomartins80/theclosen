// backend/src/modules/users/interfaces/user.interface.ts
import { ISubscription } from '@models/User'; // Importar ISubscription do modelo

export interface IUserProfile {
  id: string; 
  name?: string;  // Tornando opcional
  email?: string; // Tornando opcional
  photoUrl?: string;
  firebaseUid: string; 
  settings?: {
    theme?: string;
    notifications?: boolean;
  };
  subscription?: ISubscription; // Usar a ISubscription do modelo
  createdAt?: Date; // Opcional para corresponder ao modelo Mongoose
  updatedAt?: Date; // Opcional para corresponder ao modelo Mongoose
}

// A interface IUser local é removida para evitar conflito com a IUser de @models/User.
// Os serviços e repositórios devem usar a IUser de @models/User.

export interface IUserWithTokens {
  user: IUserProfile; 
  token: string;       
  firebaseToken: string; 
}
