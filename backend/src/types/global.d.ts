import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        firebaseUid: string;
        uid: string;
        id?: string;
        email?: string;
        name?: string;
        subscription?: {
          stripeCustomerId?: string;
          stripeSubscriptionId?: string;
          status?: string;
          plan?: string;
        };
        [key: string]: any;
      };
    }
  }
}

export {}; 