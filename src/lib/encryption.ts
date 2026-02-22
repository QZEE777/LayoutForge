import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export async function encryptFile(fileBuffer: Buffer): Promise<EncryptedData> {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let ciphertext = cipher.update(fileBuffer);
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  return {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

export async function decryptFile(encryptedData: EncryptedData): Promise<Buffer> {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(Buffer.from(encryptedData.ciphertext, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (key) return Buffer.from(key, 'hex').slice(0, 32);
  // Fallback key for local development only
  return crypto.createHash('sha256').update('layoutforge-dev-key').digest();
}
