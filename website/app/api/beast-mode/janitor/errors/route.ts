import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';
import { handleApiError } from '../../../../../lib/errors';

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
 * POST /api/beast-mode/janitor/errors
 * Log janitor errors for debugging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, stack, componentStack, timestamp } = body;
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    // Get NODE_ENV from unified config
    const nodeEnv = await getConfigValue('NODE_ENV', 'development');

    // Log to console in development
    if (nodeEnv === 'development') {
      console.error('[Janitor Error]', {
        error,
        stack,
        componentStack,
        timestamp,
        userId
      });
    }

    // Store in error_logs table
    if (supabase) {
      try {
        const { error: insertError } = await supabase
          .from('error_logs')
          .insert({
            user_id: userId || null,
            error: error || 'Unknown error',
            stack: stack || null,
            component_stack: componentStack || null,
            service: 'beast-mode',
            severity: 'error',
            metadata: {
              timestamp: timestamp || new Date().toISOString()
            }
          });

        if (insertError) {
          console.warn('[Error Log] Failed to insert error:', insertError);
        }
      } catch (err: any) {
        console.warn('[Error Log] Error inserting:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Error logged'
    });
  } catch (error: any) {
    return handleApiError(error, {
      method: 'POST',
      path: '/api/beast-mode/janitor/errors',
      service: 'beast-mode'
    });
  }
}

