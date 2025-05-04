import { UserDocument } from '@models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        id?: string;
        email: string;
        name: string;
      };
    }
  }
}