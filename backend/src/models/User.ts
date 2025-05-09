// backend/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

// Defina um tipo/interface para o subdocumento subscription
export interface ISubscription {
    plan: string;
    status: 'active' | 'canceled' | 'expired' | 'pending' | 'trialing';
    expiresAt?: Date; 
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
            plan: { type: String, required: false }, // Tornando opcional para cobrir casos onde pode não ser definido imediatamente
            status: { 
                type: String, 
                enum: ['active', 'canceled', 'expired', 'pending', 'trialing'],
                default: 'pending',
                required: false // Tornando opcional
            },
            expiresAt: { type: Date, required: false },
            subscriptionId: { type: String, required: false },
            // currentPeriodStart: { type: Date, required: false },
            // currentPeriodEnd: { type: Date, required: false },
            // paymentGateway: { type: String, enum: ['stripe', 'paypal', 'internal_test'], required: false },
        },
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

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);