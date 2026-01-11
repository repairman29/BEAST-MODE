/**
 * Feedback Debug API
 * Check environment variables and feedback collector status
 */

import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    // Get config values
    const supabaseUrl = await getConfigValue('SUPABASE_URL', null);
    const nextPublicSupabaseUrl = await getConfigValue('NEXT_PUBLIC_SUPABASE_URL', null);
    const supabaseServiceKey = await getConfigValue('SUPABASE_SERVICE_ROLE_KEY', null);
    const supabaseAnonKey = await getConfigValue('SUPABASE_ANON_KEY', null);
    const nextPublicSupabaseAnonKey = await getConfigValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', null);

    // Check environment variables (without exposing values)
    const envCheck = {
      hasSupabaseUrl: !!(supabaseUrl || nextPublicSupabaseUrl),
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasSupabaseAnonKey: !!(supabaseAnonKey || nextPublicSupabaseAnonKey),
      supabaseUrlSource: supabaseUrl ? 'SUPABASE_URL' : 
                        nextPublicSupabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : 'none',
      supabaseKeySource: supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' :
                        supabaseAnonKey ? 'SUPABASE_ANON_KEY' :
                        nextPublicSupabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'none'
    };

    // Try to import feedback collector
    let importError = null;
    let moduleInfo = null;
    let collectorInfo = null;

    try {
      // @ts-expect-error - Dynamic import path, module may not exist at build time
      const module = await import(/* webpackIgnore: true */ '@/lib/mlops/feedbackCollector');
      moduleInfo = {
        hasModule: !!module,
        hasGetFeedbackCollector: !!module?.getFeedbackCollector,
        exports: Object.keys(module || {})
      };

      if (module?.getFeedbackCollector) {
        try {
          const collector = await module.getFeedbackCollector();
          collectorInfo = {
            hasCollector: !!collector,
            initialized: collector?.initialized || false,
            hasSupabase: !!collector?.supabase,
            supabaseUrl: collector?.supabase ? 'configured' : 'not configured'
          };
        } catch (error: any) {
          collectorInfo = {
            error: error.message
          };
        }
      }
    } catch (error: any) {
      importError = error.message;
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      import: {
        error: importError,
        module: moduleInfo
      },
      collector: collectorInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

