/**
 * API Keys Decryption Utility
 * Decrypts API keys from Supabase user_api_keys table
 * Uses AES-256-GCM encryption
 */

import { getSupabaseClientOrNull } from './supabase';
import crypto from 'crypto';

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

/**
 * Decrypt an encrypted API key
 * Format: iv:authTag:encryptedData
 */
export async function decryptKey(encryptedKey: string): Promise<string | null> {
  if (!encryptedKey) return null;

  try {
    const parts = encryptedKey.split(':');
    if (parts.length !== 3) {
      // Not in expected format, might be plaintext
      return encryptedKey;
    }

    // Get encryption key from unified config
    const encryptionKey = await getConfigValue('API_KEYS_ENCRYPTION_KEY', 'default_key_change_in_production') || 'default_key_change_in_production';

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    // Derive key from encryption key
    const key = crypto.createHash('sha256').update(encryptionKey).digest();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted: Buffer = decipher.update(encrypted) as Buffer;
    decrypted = Buffer.concat([decrypted, decipher.final() as Buffer]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    // If decryption fails, return as-is (might already be plaintext)
    return encryptedKey;
  }
}

/**
 * Get and decrypt an API key for a user and provider
 */
export async function getUserApiKey(
  userId: string,
  provider: string
): Promise<string | null> {
  const supabase = await getSupabaseClientOrNull();
  if (!supabase) {
    console.warn('Supabase not configured, cannot fetch API keys');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No key found
        return null;
      }
      throw error;
    }

    if (!data?.encrypted_key) {
      return null;
    }

    // Decrypt the key
    const decrypted = await decryptKey(data.encrypted_key);

    // Record usage (optional - update last_used_at)
    try {
      await supabase
        .from('user_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true);
    } catch (updateError) {
      // Non-critical, just log
      console.warn('Failed to update last_used_at:', updateError);
    }

    return decrypted;
  } catch (error) {
    console.error(`Failed to get API key for ${provider}:`, error);
    return null;
  }
}

/**
 * Get all active API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<Record<string, string>> {
  const supabase = await getSupabaseClientOrNull();
  if (!supabase) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('provider, encrypted_key')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to get API keys:', error);
      return {};
    }

    const keys: Record<string, string> = {};
    for (const row of data || []) {
      const decrypted = await decryptKey(row.encrypted_key);
      if (decrypted) {
        keys[row.provider] = decrypted;
      }
    }

    return keys;
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return {};
  }
}

/**
 * Get available providers for a user (those with active keys)
 */
export async function getAvailableProviders(userId: string): Promise<string[]> {
  const keys = await getUserApiKeys(userId);
  return Object.keys(keys);
}

