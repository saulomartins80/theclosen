import mongoose from 'mongoose';
import { CryptoArmor } from './security';

// Interface para campos criptografados
interface EncryptedField {
  content: string;
  iv: string;
  tag: string;
}

// Schema seguro para usuários
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  name: {
    type: String,
    required: true
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  // Campos de criptografia
  emailEncrypted: {
    content: String,
    iv: String,
    tag: String
  },
  nameEncrypted: {
    content: String,
    iv: String,
    tag: String
  }
}, {
  timestamps: true
});

// Middleware de Pré-Save para criptografia
UserSchema.pre('save', async function(next) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.warn('[SECURITY] ENCRYPTION_KEY não configurada! Campos sensíveis não serão criptografados.');
    return next();
  }

  try {
    // Criptografar email se foi modificado
    if (this.isModified('email') && this.email) {
      const encrypted = CryptoArmor.encrypt(this.email, encryptionKey);
      this.emailEncrypted = encrypted;
      this.email = '[ENCRYPTED]'; // Placeholder
    }

    // Criptografar nome se foi modificado
    if (this.isModified('name') && this.name) {
      const encrypted = CryptoArmor.encrypt(this.name, encryptionKey);
      this.nameEncrypted = encrypted;
      this.name = '[ENCRYPTED]'; // Placeholder
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Erro na criptografia:', error);
    next(error as Error);
  }
});

// Query Hook para descriptografia
UserSchema.post('find', function(docs) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) return;

  docs.forEach((doc: any) => {
    try {
      // Descriptografar email
      if (doc.emailEncrypted) {
        doc.email = CryptoArmor.decrypt(doc.emailEncrypted, encryptionKey);
      }

      // Descriptografar nome
      if (doc.nameEncrypted) {
        doc.name = CryptoArmor.decrypt(doc.nameEncrypted, encryptionKey);
      }
    } catch (error) {
      console.error('[SECURITY] Erro na descriptografia:', error);
    }
  });
});

// Hook para findOne
UserSchema.post('findOne', function(doc) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey || !doc) return;

  try {
    // Descriptografar email
    if (doc.emailEncrypted) {
      doc.email = CryptoArmor.decrypt(doc.emailEncrypted, encryptionKey);
    }

    // Descriptografar nome
    if (doc.nameEncrypted) {
      doc.name = CryptoArmor.decrypt(doc.nameEncrypted, encryptionKey);
    }
  } catch (error) {
    console.error('[SECURITY] Erro na descriptografia:', error);
  }
});

// Schema seguro para transações
const TransactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Campos criptografados
  descriptionEncrypted: {
    content: String,
    iv: String,
    tag: String
  },
  categoryEncrypted: {
    content: String,
    iv: String,
    tag: String
  }
}, {
  timestamps: true
});

// Middleware de Pré-Save para transações
TransactionSchema.pre('save', async function(next) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.warn('[SECURITY] ENCRYPTION_KEY não configurada! Campos sensíveis não serão criptografados.');
    return next();
  }

  try {
    // Criptografar descrição se foi modificada
    if (this.isModified('description') && this.description) {
      const encrypted = CryptoArmor.encrypt(this.description, encryptionKey);
      this.descriptionEncrypted = encrypted;
      this.description = '[ENCRYPTED]';
    }

    // Criptografar categoria se foi modificada
    if (this.isModified('category') && this.category) {
      const encrypted = CryptoArmor.encrypt(this.category, encryptionKey);
      this.categoryEncrypted = encrypted;
      this.category = '[ENCRYPTED]';
    }

    next();
  } catch (error) {
    console.error('[SECURITY] Erro na criptografia:', error);
    next(error as Error);
  }
});

// Query Hook para descriptografia de transações
TransactionSchema.post('find', function(docs) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) return;

  docs.forEach((doc: any) => {
    try {
      // Descriptografar descrição
      if (doc.descriptionEncrypted) {
        doc.description = CryptoArmor.decrypt(doc.descriptionEncrypted, encryptionKey);
      }

      // Descriptografar categoria
      if (doc.categoryEncrypted) {
        doc.category = CryptoArmor.decrypt(doc.categoryEncrypted, encryptionKey);
      }
    } catch (error) {
      console.error('[SECURITY] Erro na descriptografia:', error);
    }
  });
});

// Função para migrar dados existentes
export async function migrateExistingData() {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.warn('[SECURITY] ENCRYPTION_KEY não configurada! Migração de dados não será executada.');
    return;
  }

  try {
    // Migrar usuários
    const User = mongoose.model('User');
    const users = await User.find({ emailEncrypted: { $exists: false } });
    
    for (const user of users) {
      if (user.email && user.email !== '[ENCRYPTED]') {
        const encrypted = CryptoArmor.encrypt(user.email, encryptionKey);
        user.emailEncrypted = encrypted;
        user.email = '[ENCRYPTED]';
        await user.save();
      }
    }

    console.log(`[SECURITY] Migrados ${users.length} usuários`);
  } catch (error) {
    console.error('[SECURITY] Erro na migração:', error);
  }
}

export { UserSchema, TransactionSchema }; 