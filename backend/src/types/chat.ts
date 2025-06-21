export interface ChatMessageMetadata {
  analysisData?: any;
  processingTime?: number;
  error?: boolean;
  errorMessage?: string;
}

export interface ChatMessage {
  chatId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface Conversation {
  chatId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
} 