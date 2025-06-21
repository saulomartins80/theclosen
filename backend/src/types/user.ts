export interface IUser {
  _id: string;
  firebaseUid: string;
  uid: string;
  email: string;
  name: string;
  subscription?: {
    status?: string;
    plan?: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    cancelAtPeriodEnd?: boolean;
    expiresAt?: string;
    currentPeriodEnd?: string;
  };
  perfilInvestidor?: string;
  transacoes?: any[];
  investimentos?: any[];
  metas?: any[];
  [key: string]: any;
} 