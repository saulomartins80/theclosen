import { Request } from 'express';
import { Subscription } from './Subscription';

export interface AuthUser {
  _id: string;
  uid: string;
  firebaseUid: string;
  email?: string;
  name?: string;
  subscription?: Subscription;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
} 