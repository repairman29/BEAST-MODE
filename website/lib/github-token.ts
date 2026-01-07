/**
 * GitHub Token Utility
 * Server-side utility for decrypting GitHub tokens
 */

import crypto from 'crypto';

// Buffer is available globally in Node.js/Next.js server-side code
// Type declaration for Buffer
declare const Buffer: {
  from(data: string, encoding?: 'hex' | 'utf8'): Buffer;
  concat(list: Buffer[]): Buffer;
};

// Use unified config if available
let getUnifiedConfig: any = null;
try {
  const path = require('path');
  const configPath = path.join(process.cwd(), '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value (TypeScript compatible)
async function getConfigValue(key: string, defaultValue: string | null = null): Promise<string | null> {
  if (getUnifiedConfig) {
    try {
      const config = await getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

// Lazy initialization - will be set on first use
let ENCRYPTION_KEY: Buffer | null = null;

async function getEncryptionKey(): Promise<Buffer> {
  if (ENCRYPTION_KEY) {
    return ENCRYPTION_KEY;
  }

  const keyHex = await getConfigValue('GITHUB_TOKEN_ENCRYPTION_KEY', null);
  if (keyHex) {
    if (keyHex.length === 64) {
      ENCRYPTION_KEY = Buffer.from(keyHex, 'hex');
    } else {
      ENCRYPTION_KEY = Buffer.from(keyHex.padEnd(32, '0').slice(0, 32), 'utf8');
    }
  } else {
    ENCRYPTION_KEY = crypto.randomBytes(32);
    console.warn('⚠️ [GitHub Token] No GITHUB_TOKEN_ENCRYPTION_KEY set, using random key');
  }
  
  return ENCRYPTION_KEY;
}

const ALGORITHM = 'aes-256-cbc';

async function decrypt(text: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted: Buffer = decipher.update(encryptedText) as Buffer;
    const final = decipher.final() as Buffer;
    decrypted = Buffer.concat([decrypted, final]);
    return decrypted.toString('utf8');
  } catch (error: any) {
    console.error('❌ [GitHub Token] Decryption error:', error);
    throw error;
  }
}

// In-memory store (in production, use database)
const globalForTokenStore = globalThis as unknown as {
  tokenStore: Map<string, {
    encryptedToken: string;
    githubUsername: string;
    githubUserId: number;
    connectedAt: string;
  }>;
};

if (!globalForTokenStore.tokenStore) {
  globalForTokenStore.tokenStore = new Map();
}

const tokenStore = globalForTokenStore.tokenStore;

/**
 * Get decrypted token (server-side only)
 */
export async function getDecryptedToken(userId: string): Promise<string | null> {
  try {
    const stored = tokenStore.get(userId);
    if (!stored) {
      console.log('   No token found for userId:', userId);
      return null;
    }
    console.log('   Decrypting token for userId:', userId);
    return await decrypt(stored.encryptedToken);
  } catch (error) {
    console.error('❌ [GitHub Token] Error decrypting token:', error);
    return null;
  }
}
