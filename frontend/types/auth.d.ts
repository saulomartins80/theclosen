// types/auth.d.ts
import { User as FirebaseUser, IdTokenResult } from 'firebase/auth';
import { Subscription } from './subscription';

export interface AuthUser extends FirebaseUser {
  subscription: Subscription | null;
  photoUrl: string | null;
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoUrl: string | null;
  subscription?: Subscription | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  subscription: Subscription | null;
  loading: boolean;
  authChecked: boolean;
  loadingSubscription: boolean;
  error: string | null;
  subscriptionError: string | null;
  refreshSubscription: () => Promise<void>;
  checkSubscriptionQuick: (userId: string) => Promise<boolean>;
  createTestSubscription: (plan: string) => Promise<Subscription | void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  verifyToken: (token: string) => Promise<boolean>;
}