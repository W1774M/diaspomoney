/**
 * Field-Level Encryption - DiaspoMoney
 * Chiffrement au niveau des champs pour PCI-DSS et GDPR
 */

import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

export interface EncryptedField {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
}

export class FieldEncryption {
  private static instance: FieldEncryption;
  private masterKey: string;
  private config: EncryptionConfig;

  constructor() {
    this.masterKey =
      process.env['ENCRYPTION_MASTER_KEY'] || this.generateMasterKey();
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
    };
  }

  static getInstance(): FieldEncryption {
    if (!FieldEncryption.instance) {
      FieldEncryption.instance = new FieldEncryption();
    }
    return FieldEncryption.instance;
  }

  /**
   * Générer une clé maître sécurisée
   */
  private generateMasterKey(): string {
    const key = crypto.randomBytes(32);
    return key.toString('hex');
  }

  /**
   * Dériver une clé pour un champ spécifique
   */
  private deriveKey(fieldName: string, userId?: string): Buffer {
    const salt = `${fieldName}:${userId || 'global'}`;
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      100000,
      this.config.keyLength,
      'sha256'
    );
  }

  /**
   * Chiffrer un champ sensible
   */
  encrypt(fieldName: string, value: string, userId?: string): EncryptedField {
    try {
      if (!value) return null as any;

      const key = this.deriveKey(fieldName, userId);
      const iv = crypto.randomBytes(this.config.ivLength);
      const cipher = crypto.createCipher(this.config.algorithm, key);
      (cipher as any).setAAD(Buffer.from(fieldName));

      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = (cipher as any).getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.config.algorithm,
      };
    } catch (error) {
      console.error('❌ Field encryption error:', error);
      Sentry.captureException(error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Déchiffrer un champ sensible
   */
  decrypt(
    fieldName: string,
    encryptedField: EncryptedField,
    userId?: string
  ): string {
    try {
      if (!encryptedField || !encryptedField.encrypted) return '';

      const key = this.deriveKey(fieldName, userId);
      // const _iv = Buffer.from(encryptedField.iv, 'hex');
      const tag = Buffer.from(encryptedField.tag, 'hex');
      const decipher = crypto.createDecipher(encryptedField.algorithm, key);

      (decipher as any).setAAD(Buffer.from(fieldName));
      (decipher as any).setAuthTag(tag);

      let decrypted = decipher.update(encryptedField.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Field decryption error:', error);
      Sentry.captureException(error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Chiffrer un objet avec plusieurs champs
   */
  encryptObject(
    obj: Record<string, any>,
    fieldsToEncrypt: string[],
    userId?: string
  ): Record<string, any> {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (obj[field] && typeof obj[field] === 'string') {
        encrypted[field] = this.encrypt(field, obj[field], userId);
      }
    }

    return encrypted;
  }

  /**
   * Déchiffrer un objet avec plusieurs champs
   */
  decryptObject(
    obj: Record<string, any>,
    fieldsToDecrypt: string[],
    userId?: string
  ): Record<string, any> {
    const decrypted = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (
        obj[field] &&
        typeof obj[field] === 'object' &&
        obj[field].encrypted
      ) {
        decrypted[field] = this.decrypt(field, obj[field], userId);
      }
    }

    return decrypted;
  }

  /**
   * Hacher un champ pour la recherche (one-way)
   */
  hashForSearch(fieldName: string, value: string, userId?: string): string {
    try {
      const salt = `${fieldName}:${userId || 'global'}`;
      return crypto
        .pbkdf2Sync(value, salt, 10000, 32, 'sha256')
        .toString('hex');
    } catch (error) {
      console.error('❌ Hash for search error:', error);
      Sentry.captureException(error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Générer un token de chiffrement unique
   */
  generateEncryptionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Vérifier l'intégrité d'un champ chiffré
   */
  verifyIntegrity(
    fieldName: string,
    encryptedField: EncryptedField,
    userId?: string
  ): boolean {
    try {
      const decrypted = this.decrypt(fieldName, encryptedField, userId);
      return decrypted !== null && decrypted !== '';
    } catch (error) {
      return false;
    }
  }
}

// Champs sensibles à chiffrer selon PCI-DSS et GDPR
export const SENSITIVE_FIELDS = {
  // Données personnelles (GDPR)
  PERSONAL: [
    'email',
    'phone',
    'firstName',
    'lastName',
    'address',
    'dateOfBirth',
    'nationalId',
    'passportNumber',
  ],

  // Données financières (PCI-DSS)
  FINANCIAL: [
    'cardNumber',
    'cvv',
    'bankAccount',
    'iban',
    'swiftCode',
    'routingNumber',
  ],

  // Données médicales (HIPAA-like)
  MEDICAL: [
    'medicalHistory',
    'diagnosis',
    'prescription',
    'allergies',
    'bloodType',
  ],

  // Données d'authentification
  AUTH: ['password', 'twoFactorSecret', 'recoveryCodes', 'apiKeys'],
};

// Instance singleton
export const fieldEncryption = FieldEncryption.getInstance();

