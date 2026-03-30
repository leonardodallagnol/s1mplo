import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('ENCRYPTION_KEY');
    if (!secret || secret.length < 32) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must be set and at least 32 characters long',
      );
    }
    // Deriva chave de 32 bytes a partir do secret
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv) as crypto.CipherGCM;
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // Formato: iv(hex):tag(hex):encrypted(hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    try {
      const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch {
      throw new InternalServerErrorException('Failed to decrypt token');
    }
  }

  // Retorna null se o valor for null/undefined
  encryptNullable(value: string | null | undefined): string | null {
    if (!value) return null;
    return this.encrypt(value);
  }

  decryptNullable(value: string | null | undefined): string | null {
    if (!value) return null;
    return this.decrypt(value);
  }
}
