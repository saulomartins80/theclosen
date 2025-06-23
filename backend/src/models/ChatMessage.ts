import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  chatId: string;
  userId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    analysisData?: any;
    processingTime?: number;
    error?: boolean;
    errorMessage?: string;
    expertise?: string;
    confidence?: number;
    isImportant?: boolean;
    messageType?: 'basic' | 'premium' | 'analysis' | 'guidance';
  };
  expiresAt?: Date;
  isImportant: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  metadata: {
    analysisData: Schema.Types.Mixed,
    processingTime: Number,
    error: Boolean,
    errorMessage: String,
    expertise: String,
    confidence: Number,
    isImportant: Boolean,
    messageType: {
      type: String,
      enum: ['basic', 'premium', 'analysis', 'guidance'],
      default: 'basic'
    }
  },
  expiresAt: {
    type: Date
  },
  isImportant: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Índices para performance
ChatMessageSchema.index({ userId: 1, chatId: 1 });
ChatMessageSchema.index({ userId: 1, timestamp: -1 });
ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage; 