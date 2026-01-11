/**
 * Lazy Supabase Client Initialization
 * 
 * Prevents build-time errors when environment variables are not set.
 * Client is only created when actually needed at runtime.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client (lazy initialization)
 * Throws error if environment variables are missing
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and ' +
      '(SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Get Supabase client (returns null if configuration is missing)
 * Useful for optional Supabase features
 */
export function getSupabaseClientOptional(): SupabaseClient | null {
  try {
    return getSupabaseClient();
  } catch (error) {
    return null;
  }
}
