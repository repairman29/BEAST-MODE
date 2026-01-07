/**
 * Supabase Client Utility
 * Now uses unified Supabase client from shared-utils
 * Maintains backward compatibility
 */

import { createClient } from '@supabase/supabase-js';

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

// Config values (will be loaded async)
let supabaseUrl: string | null = null;
let supabaseServiceKey: string | null = null;

// Try to use unified Supabase (preferred)
let unifiedSupabase: any = null;
try {
  const path = require('path');
  const unifiedSupabasePath = path.join(process.cwd(), '../../../shared-utils/unified-supabase');
  unifiedSupabase = require(unifiedSupabasePath);
} catch (error) {
  // Unified Supabase not available, use fallback
  console.warn('[Supabase] Unified Supabase not available, using fallback');
}

/**
 * Initialize Supabase (using unified client if available)
 */
export async function initializeSupabase() {
  if (unifiedSupabase) {
    try {
      await unifiedSupabase.initializeSupabase('beast-mode');
      return true;
    } catch (error) {
      console.warn('[Supabase] Unified Supabase initialization failed:', error);
    }
  }
  return false;
}

/**
 * Get Supabase client (using unified client if available)
 */
export async function getSupabaseClient() {
  // Try unified Supabase first
  if (unifiedSupabase) {
    try {
      return unifiedSupabase.getSupabaseClient('beast-mode', true);
    } catch (error) {
      // Not initialized yet, fall through to fallback
    }
  }

  // Load config values if not already loaded
  if (!supabaseUrl || !supabaseServiceKey) {
    supabaseUrl = await getConfigValue('NEXT_PUBLIC_SUPABASE_URL', null);
    supabaseServiceKey = await getConfigValue('SUPABASE_SERVICE_ROLE_KEY', null);
  }

  // Fallback to direct client creation
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get Supabase client or null (using unified client if available)
 */
export async function getSupabaseClientOrNull() {
  // Try unified Supabase first
  if (unifiedSupabase) {
    try {
      return unifiedSupabase.getSupabaseClient('beast-mode', true);
    } catch (error) {
      // Not initialized yet, fall through to fallback
    }
  }

  // Load config values if not already loaded
  if (!supabaseUrl || !supabaseServiceKey) {
    supabaseUrl = await getConfigValue('NEXT_PUBLIC_SUPABASE_URL', null);
    supabaseServiceKey = await getConfigValue('SUPABASE_SERVICE_ROLE_KEY', null);
  }

  // Fallback to direct client creation
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
