import { Document } from 'mongoose';
import { ISubscription } from '@models/User';

export type SubscriptionStatus = 
    | 'active' 
    | 'inactive' 
    | 'canceled' 
    | 'trialing' 
    | 'past_due'
    | 'incomplete'
    | 'incomplete_expired'
    | 'unpaid'
    | 'paused';

export interface Subscription {
    plan: string;
    status: SubscriptionStatus;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId?: string;
    cancelAtPeriodEnd: boolean;
    expiresAt: Date;
    currentPeriodEnd: Date;
    trialEndsAt?: Date;
    subscriptionId?: string;
    updatedAt?: Date;
}

export interface User extends Document {
    id: string;
    name: string;
    email: string;
    password?: string;
    firebaseUid: string;
    photoUrl?: string;
    settings?: {
        theme?: string;
        notifications?: boolean;
    };
    subscription?: Subscription;
    lastPayment?: {
        date: Date;
        amount: number;
        status: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
    _id: any;
    $assertPopulated: any;
    $clearModifiedPaths: any;
}

export interface UserRepository {
    create(userData: Partial<User>): Promise<User>;
    update(userId: string, userData: Partial<User>): Promise<User>;
    findById(userId: string): Promise<User | null>;
}