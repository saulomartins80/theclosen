import { Request } from 'express';

declare module 'express-serve-static-core' {
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