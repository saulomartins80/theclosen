import mongoose, { Schema, Document } from 'mongoose';

export interface IMileage extends Document {
  userId: mongoose.Types.ObjectId;
  transactionId?: string;
  programa: string;
  quantidade: number;
  data: Date;
  tipo: 'acumulacao' | 'resgate' | 'expiracao' | 'bonus';
  cartao?: string;
  valorEstimado: number;
  metadata?: {
    originalAmount?: number;
    description?: string;
    category?: string;
    establishment?: string;
    cardLastDigits?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// New interface for mileage summary data (used by Pluggy controller)
export interface IMileageSummary extends Document {
  userId: string;
  itemId: string;
  accountId: string;
  totalMiles: number;
  totalSpent: number;
  estimatedValue: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MileageSchema = new Schema<IMileage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    index: true
  },
  programa: {
    type: String,
    required: true,
    enum: ['Smiles', 'TudoAzul', 'Latam Pass', 'Multiplus', 'Livelo', 'Dotz'],
    index: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0
  },
  data: {
    type: Date,
    required: true,
    default: Date.now
  },
  tipo: {
    type: String,
    required: true,
    enum: ['acumulacao', 'resgate', 'expiracao', 'bonus'],
    default: 'acumulacao'
  },
  cartao: {
    type: String
  },
  valorEstimado: {
    type: Number,
    required: true,
    min: 0
  },
  metadata: {
    originalAmount: Number,
    description: String,
    category: String,
    establishment: String,
    cardLastDigits: String
  }
}, {
  timestamps: true
});

// New schema for mileage summary data
const MileageSummarySchema = new Schema<IMileageSummary>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  itemId: {
    type: String,
    required: true,
    index: true
  },
  accountId: {
    type: String,
    required: true,
    index: true
  },
  totalMiles: {
    type: Number,
    required: true,
    default: 0
  },
  totalSpent: {
    type: Number,
    required: true,
    default: 0
  },
  estimatedValue: {
    type: Number,
    required: true,
    default: 0
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para otimização de consultas
MileageSchema.index({ userId: 1, programa: 1 });
MileageSchema.index({ userId: 1, data: -1 });
MileageSchema.index({ programa: 1, tipo: 1 });

// Índices para MileageSummary
MileageSummarySchema.index({ userId: 1, itemId: 1 });
MileageSummarySchema.index({ userId: 1, accountId: 1 });

export const Mileage = mongoose.model<IMileage>('Mileage', MileageSchema);
export const MileageSummary = mongoose.model<IMileageSummary>('MileageSummary', MileageSummarySchema); 