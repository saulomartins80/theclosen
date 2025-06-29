import crypto from 'crypto';

export class CryptoArmor {
  private static ALGORITHM = 'aes-256-gcm';
  private static IV_LENGTH = 16;
  private static TAG_LENGTH = 16;

  static encrypt(text: string, key: string) {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, Buffer.from(key, 'hex'), iv) as crypto.CipherGCM;
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
      content: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encrypted: { content: string, iv: string, tag: string }, key: string) {
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      Buffer.from(key, 'hex'),
      Buffer.from(encrypted.iv, 'hex')
    ) as crypto.DecipherGCM;
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
    let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Método para gerar chaves seguras
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash seguro para senhas
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: generatedSalt };
  }

  // Verificar senha
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  }
} 