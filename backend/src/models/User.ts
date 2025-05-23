// backend/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

// Defina um tipo/interface para o subdocumento subscription
export interface ISubscription {
    plan: string;
    status: 'active' | 'canceled' | 'expired' | 'pending' | 'trialing';
    expiresAt?: Date; 
    trialEndsAt?: Date; // Adicionado para data de término do trial
    subscriptionId?: string; 
    // Outros campos opcionais
    // currentPeriodStart?: Date;
    // currentPeriodEnd?: Date;
    // paymentGateway?: 'stripe' | 'paypal' | 'internal_test';
}

export interface IUser extends Document {
    id?: string; // Adicionado pelo Mongoose como getter para _id
    name: string;
    email: string;
    password?: string; 
    firebaseUid: string;
    photoUrl?: string; 
    settings?: { 
        theme?: string;
        notifications?: boolean;
    };
    subscription?: ISubscription; 
    transacoes?: any[]; // Adicionado para transações
    metas?: any[];      // Adicionado para metas
    investimentos?: any[];// Adicionado para investimentos
    createdAt?: Date; 
    updatedAt?: Date; 
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true, 
            trim: true,
        },
        password: { type: String, required: false },
        firebaseUid: { type: String, required: true, unique: true },
        photoUrl: { type: String, required: false },
        settings: {
            theme: { type: String, default: 'light' },
            notifications: { type: Boolean, default: true },
        },
        subscription: {
            plan: { type: String, required: false },
            status: { 
                type: String, 
                enum: ['active', 'canceled', 'expired', 'pending', 'trialing'],
                default: 'pending',
                required: false
            },
            expiresAt: { type: Date, required: false },
            trialEndsAt: { type: Date, required: false }, // Adicionado para data de término do trial
            subscriptionId: { type: String, required: false },
        },
        transacoes: { type: Array, default: [] }, // Adicionado para transações
        metas: { type: Array, default: [] },      // Adicionado para metas
        investimentos: { type: Array, default: [] },// Adicionado para investimentos
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

const User = mongoose.model<IUser>('User', userSchema);

export { User };