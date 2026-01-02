/**
 * Feedback Debug API
 * Check environment variables and feedback collector status
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables (without exposing values)
    const envCheck = {
      hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseUrlSource: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 
                        process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'none',
      supabaseKeySource: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' :
                        process.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' :
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'none'
    };

    // Try to import feedback collector
    let importError = null;
    let moduleInfo = null;
    let collectorInfo = null;

    try {
      const module = await import(/* webpackIgnore: true */ '../../../../lib/mlops/feedbackCollector');
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

