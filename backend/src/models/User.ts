import mongoose, { Schema, Document, models } from 'mongoose';
import Stripe from 'stripe';
import { SubscriptionStatus } from '../modules/users/types/User';

export interface ISubscription {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status?: string;
    plan?: string;
    cancelAtPeriodEnd?: boolean;
    expiresAt?: Date;
    currentPeriodEnd?: Date;
    trialEndsAt?: Date;
    subscriptionId?: string;
    updatedAt?: Date;
}

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email?: string;
    name?: string;
    firebaseUid: string;
    photoUrl?: string;
    password?: string;
    settings?: {
        theme?: string;
        notifications?: boolean;
    };
    subscription?: ISubscription;
    transacoes?: any[];
    investimentos?: any[];
    metas?: any[];
    mileageBalance?: number;
    mileagePreferences?: {
        defaultProgram?: string;
        preferredCards?: string[];
        autoConnect?: boolean;
    };
    lastPayment?: {
        date: Date;
        amount: number;
        status: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
    {
        firebaseUid: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        name: { type: String },
        password: { type: String },
        photoUrl: { type: String },
        settings: {
            theme: { type: String, default: 'light' },
            notifications: { type: Boolean, default: true }
        },
        subscription: {
            stripeCustomerId: { type: String, index: true },
            stripeSubscriptionId: { type: String },
            stripePriceId: String,
            status: String,
            plan: String,
            cancelAtPeriodEnd: Boolean,
            expiresAt: Date,
            currentPeriodEnd: Date,
            trialEndsAt: Date,
            subscriptionId: String,
            updatedAt: Date
        },
        transacoes: [{ type: Schema.Types.Mixed }],
        investimentos: [{ type: Schema.Types.Mixed }],
        metas: [{ type: Schema.Types.Mixed }],
        mileageBalance: { type: Number, default: 0 },
        mileagePreferences: {
            defaultProgram: { type: String, default: 'Smiles' },
            preferredCards: [{ type: String }],
            autoConnect: { type: Boolean, default: false }
        },
        lastPayment: {
            date: Date,
            amount: Number,
            status: String
        }
    },
    {
        timestamps: true,
        toJSON: { getters: true, virtuals: true },
        toObject: { getters: true, virtuals: true }
    }
);

userSchema.virtual('id').get(function(this: IUser) {
    return (this._id as mongoose.Types.ObjectId).toHexString();
});

userSchema.index({ 'subscription.stripeSubscriptionId': 1 }, { unique: true, sparse: true });

export const User = (models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', userSchema);