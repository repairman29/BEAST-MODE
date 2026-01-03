import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

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
 * GitHub OAuth Authorization
 * 
 * Initiates GitHub OAuth flow for user to connect their account
 * This allows scanning of private repositories
 * Now integrated with Supabase auth for proper user isolation
 */
export async function GET(request: NextRequest) {
  console.log('🔵 [GitHub OAuth] Authorize endpoint called');
  console.log('   URL:', request.url);
  console.log('   Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Get user ID from Supabase auth or JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('beastModeToken')?.value;
    
    console.log('   Auth token present:', !!token);
    
    let userId: string | null = null;
    let isSupabaseUser = false;
    
    // Get JWT secret from unified config
    const JWT_SECRET = await getConfigValue('JWT_SECRET', 'beast-mode-secret-change-in-production');

    // Try to get Supabase user ID from JWT token
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET || 'beast-mode-secret-change-in-production') as any;
        if (decoded.userId && typeof decoded.userId === 'string' && decoded.userId.startsWith('00000000-')) {
          // This looks like a Supabase UUID
          userId = decoded.userId;
          isSupabaseUser = true;
          console.log('   Using Supabase user ID from JWT:', userId);
        } else {
          // Fallback to token-based user ID
          userId = `user-${token.slice(0, 8)}`;
          console.log('   Using token-based userId:', userId);
        }
      } catch (jwtError) {
        // JWT invalid, try Supabase auth
        const supabase = getSupabaseClientOrNull();
        if (supabase) {
          // Try to get user from Supabase session
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            userId = user.id;
            isSupabaseUser = true;
            console.log('   Using Supabase user ID from session:', userId);
          }
        }
        
        if (!userId) {
          // Fallback to token-based user ID
          userId = `user-${token.slice(0, 8)}`;
          console.log('   Using token-based userId (fallback):', userId);
        }
      }
    }
    
    // If no user ID yet, generate a session ID for anonymous users
    if (!userId) {
      const sessionId = crypto.randomBytes(16).toString('hex');
      userId = `session-${sessionId}`;
      console.log('   Generated session userId:', userId);
    }

    // Check if GitHub OAuth is configured
    // Production should use: Ov23liDKFkIrnPneWwny
    // Development should use: Ov23lidLvmp68FVMEqEB
    const nodeEnv = await getConfigValue('NODE_ENV', 'development');
    const nextPublicUrl = await getConfigValue('NEXT_PUBLIC_URL', null);
    const isProduction = nodeEnv === 'production' || 
                         nextPublicUrl?.includes('beastmode.dev') ||
                         nextPublicUrl?.includes('beast-mode.dev') ||
                         request.url.includes('beastmode.dev') ||
                         request.url.includes('beast-mode.dev');
    
    const expectedProdClientId = 'Ov23liDKFkIrnPneWwny';
    const expectedDevClientId = 'Ov23lidLvmp68FVMEqEB';
    const envClientId = await getConfigValue('GITHUB_CLIENT_ID', null);
    
    // Auto-select correct client ID based on environment if env var is wrong
    let currentClientId: string;
    if (isProduction) {
      // Production: Use prod client ID, fallback to env if it's the prod one
      if (envClientId === expectedProdClientId) {
        currentClientId = envClientId;
      } else if (envClientId === expectedDevClientId) {
        // Wrong client ID in env - use correct one
        console.warn('⚠️ [GitHub OAuth] Auto-fixing: Using PROD client ID (env had DEV)');
        currentClientId = expectedProdClientId;
      } else if (envClientId) {
        // Some other client ID - use it but warn
        console.warn('⚠️ [GitHub OAuth] Using custom client ID in production:', envClientId);
        currentClientId = envClientId;
      } else {
        // No env var - use prod
        console.warn('⚠️ [GitHub OAuth] No GITHUB_CLIENT_ID in env, using PROD client ID');
        currentClientId = expectedProdClientId;
      }
    } else {
      // Development: Use dev client ID
      if (envClientId === expectedDevClientId) {
        currentClientId = envClientId;
      } else if (envClientId === expectedProdClientId) {
        // Wrong client ID in env - use correct one
        console.warn('⚠️ [GitHub OAuth] Auto-fixing: Using DEV client ID (env had PROD)');
        currentClientId = expectedDevClientId;
      } else if (envClientId) {
        // Some other client ID - use it
        currentClientId = envClientId;
      } else {
        // No env var - use dev
        console.warn('⚠️ [GitHub OAuth] No GITHUB_CLIENT_ID in env, using DEV client ID');
        currentClientId = expectedDevClientId;
      }
    }
    
    if (!currentClientId) {
      console.error('❌ [GitHub OAuth] Could not determine client ID');
      return NextResponse.json(
        { error: 'GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in environment variables.' },
        { status: 500 }
      );
    }

    console.log('   Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('   Client ID:', currentClientId);
    console.log('   Client ID length:', currentClientId?.length);

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    console.log('   Generated state:', state.substring(0, 16) + '...');
    
    // Store state in session/cookie (in production, use Redis or database)
    const githubRedirectUri = await getConfigValue('GITHUB_REDIRECT_URI', null);
    const redirectUri = githubRedirectUri || 
                       `${nextPublicUrl || 'http://localhost:7777'}/api/github/oauth/callback`;
    
    console.log('   Redirect URI:', redirectUri);
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${currentClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent('repo read:user user:email')}&` +
      `state=${state}`;
    
    console.log('   Redirecting to GitHub:', githubAuthUrl.substring(0, 100) + '...');
    
    const response = NextResponse.redirect(githubAuthUrl);

    // Store state in httpOnly cookie
    const isProd = nodeEnv === 'production';
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    response.cookies.set('github_oauth_user_id', userId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 600
    });
    
    // Store whether this is a Supabase user for callback
    response.cookies.set('github_oauth_is_supabase_user', isSupabaseUser ? 'true' : 'false', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 600
    });

    console.log('✅ [GitHub OAuth] Redirecting to GitHub, cookies set');
    console.log('   User ID:', userId);
    console.log('   Is Supabase user:', isSupabaseUser);
    return response;
  } catch (error: any) {
    console.error('❌ [GitHub OAuth] Authorize error:', error);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to initiate GitHub OAuth', details: error.message },
      { status: 500 }
    );
  }
}

