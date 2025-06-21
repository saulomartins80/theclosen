import { Request } from 'express';

export interface AuthUser {
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
}

export interface AuthRequest extends Request {
  user?: AuthUser;
} 