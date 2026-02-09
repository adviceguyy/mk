import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Fallback to a derived key from another secret if ENCRYPTION_KEY not set
    const fallbackSecret = process.env.THREE_TEARS_ENROLLMENT_SECRET;
    if (!fallbackSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[Security] ENCRYPTION_KEY is required in production. Generate one with: openssl rand -hex 32');
      }
      console.warn('[Security] WARNING: No ENCRYPTION_KEY set. Using derived key from DATABASE_URL. Set ENCRYPTION_KEY for production use.');
      // Use DATABASE_URL as fallback for development (stable across restarts, unique per DB)
      const dbUrl = process.env.DATABASE_URL || 'dev-fallback-insecure';
      return crypto.scryptSync(dbUrl, 'mienkingdom-dev-salt', 32);
    }
    return crypto.scryptSync(fallbackSecret, 'mienkingdom-salt', 32);
  }
  // If key is provided, ensure it's 32 bytes (256 bits)
  if (key.length === 64) {
    // Hex-encoded 32-byte key
    return Buffer.from(key, 'hex');
  }
  // Derive a 32-byte key from whatever was provided
  return crypto.scryptSync(key, 'mienkingdom-salt', 32);
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encryptApiKey(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptApiKey(encryptedData: EncryptedData): string {
  const key = getEncryptionKey();

  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const encryptedText = Buffer.from(encryptedData.encrypted, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

export function decryptApiKeyFromFields(
  encrypted: string | null,
  iv: string | null,
  authTag: string | null
): string | null {
  if (!encrypted || !iv || !authTag) {
    return null;
  }

  try {
    return decryptApiKey({
      encrypted,
      iv,
      authTag,
    });
  } catch {
    console.error('Failed to decrypt API key');
    return null;
  }
}

export function maskApiKey(apiKey: string | null): string {
  if (!apiKey) {
    return '(not set)';
  }
  if (apiKey.length <= 4) {
    return '***' + apiKey.slice(-1);
  }
  return apiKey.slice(0, 1) + '***' + apiKey.slice(-3);
}
