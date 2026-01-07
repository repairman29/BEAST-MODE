/**
 * GitHub Token Encryption Utility
 * Server-side utility for encrypting/decrypting GitHub tokens
 */

import crypto from 'crypto';
import { Buffer } from 'buffer';

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
    console.warn('⚠️ [GitHub Token] No GITHUB_TOKEN_ENCRYPTION_KEY set, using random key (tokens will be lost on restart)');
  }
  
  return ENCRYPTION_KEY;
}

const ALGORITHM = 'aes-256-cbc';

export async function encrypt(text: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error: any) {
    console.error('❌ [GitHub Token] Encryption error:', error);
    throw error;
  }
}

export async function decrypt(text: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error: any) {
    console.error('❌ [GitHub Token] Decryption error:', error);
    throw error;
  }
}

