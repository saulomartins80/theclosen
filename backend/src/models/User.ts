// src/models/User.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  firebaseUid: string; // Tornado obrigatório
  subscription?: {
    plan: string;
    status: 'active' | 'canceled' | 'expired' | 'pending';
    expiresAt: Date;
    subscriptionId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true 
  },
  subscription: {
    plan: { type: String },
    status: { 
      type: String,
      enum: ['active', 'canceled', 'expired', 'pending'],
      default: 'pending'
    },
    expiresAt: { type: Date },
    subscriptionId: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret.firebaseUid; // Usa firebaseUid como id virtual
      delete ret._id;
      delete ret.__v;
      delete ret.password;
    }
  }
});

// Adiciona um virtual para o id baseado no firebaseUid
userSchema.virtual('id').get(function() {
  return this.firebaseUid;
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);