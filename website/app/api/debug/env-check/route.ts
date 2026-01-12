import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables and Supabase connection
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {};

  // Check environment variables
  checks.envVars = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 
      `${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...` : 'NOT SET',
    NEXT_PUBLIC_ANTHROPIC_API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 
      `${process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY.substring(0, 20)}...` : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET',
    API_KEYS_ENCRYPTION_KEY: process.env.API_KEYS_ENCRYPTION_KEY ? 
      `${process.env.API_KEYS_ENCRYPTION_KEY.substring(0, 20)}...` : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
  };

  // Test Supabase connection
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, provider, is_active')
        .eq('provider', 'anthropic')
        .eq('is_active', true)
        .limit(1);
      
      checks.supabase = {
        connected: !error,
        error: error?.message || null,
        anthropicKeysFound: data?.length || 0,
      };
    } else {
      checks.supabase = {
        connected: false,
        error: 'Missing Supabase URL or key',
      };
    }
  } catch (e: any) {
    checks.supabase = {
      connected: false,
      error: e.message,
    };
  }

  // Test modelRouter initialization
  try {
    const { getModelRouter } = require('@/lib/mlops/modelRouter');
    const router = getModelRouter();
    await router.initialize();
    
    checks.modelRouter = {
      initialized: router.initialized,
      hasSupabase: !!router.supabase,
    };
  } catch (e: any) {
    checks.modelRouter = {
      initialized: false,
      error: e.message,
    };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    checks,
  });
}
