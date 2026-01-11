import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';
import { encrypt } from '../../../../../lib/github-token-encrypt';
import { createApiLogger } from '../../../../../lib/utils/api-logger';

// Types
interface UnifiedConfig {
  get(key: string): string | null;
}

type GetUnifiedConfig = () => Promise<UnifiedConfig>;

interface GitHubUser {
  login: string;
  id: number;
  email?: string | null;
}

interface TokenData {
  access_token?: string;
  error?: string;
  error_description?: string;
  scope?: string;
}

interface Installation {
  installation_id: number;
  account_id: number;
  user_id?: string;
}

// Use unified config if available
let getUnifiedConfig: GetUnifiedConfig | null = null;
try {
  const path = require('path');
  const configPath = path.join(process.cwd(), '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

/**
 * Get configuration value from unified config or environment variables
 * 
 * @param key - Configuration key to retrieve
 * @param defaultValue - Default value if key is not found
 * @returns Configuration value or default value
 */
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
 * GitHub OAuth Callback Handler
 * 
 * Handles the OAuth callback from GitHub after user authorization.
 * Validates state (CSRF protection), exchanges code for access token,
 * fetches user info, stores token securely, and redirects appropriately.
 * 
 * @param request - Next.js request object with OAuth callback parameters
 * @returns NextResponse redirecting to sign-in/sign-up page with appropriate parameters
 * 
 * @throws Redirects to error page if OAuth fails or state validation fails
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('GitHub OAuth Callback');
  
  logger.info('Callback endpoint called', {
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
  });
  
  // Get base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    logger.debug('OAuth parameters received', {
      codePresent: !!code,
      statePresent: !!state,
      errorPresent: !!error
    });

    // Get config values
    const nextPublicUrl = await getConfigValue('NEXT_PUBLIC_URL', 'http://localhost:7777');
    const baseUrl = nextPublicUrl || 'http://localhost:7777';

    // Handle OAuth errors
    if (error) {
      logger.error('Error from GitHub', { error });
      return NextResponse.redirect(
        `${baseUrl}/?action=signin&error=oauth_error&message=${encodeURIComponent(`GitHub OAuth error: ${error}`)}`
      );
    }

    if (!code || !state) {
      logger.error('Missing code or state', { code: !!code, state: !!state });
      return NextResponse.redirect(
        `${baseUrl}/?action=signin&error=missing_oauth_params&message=Please try signing in with GitHub again.`
      );
    }

    // Verify state
    const storedState = request.cookies.get('github_oauth_state')?.value;
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const isSupabaseUser = request.cookies.get('github_oauth_is_supabase_user')?.value === 'true';

    logger.debug('State validation', {
      storedStatePresent: !!storedState,
      receivedStatePrefix: state.substring(0, 16),
      userIdPresent: !!userId
    });

    // Validate state to prevent CSRF attacks
    if (!storedState || storedState !== state) {
      logger.error('State mismatch - potential CSRF attack', {
        storedStatePresent: !!storedState,
        statesMatch: storedState === state
      });
      return NextResponse.redirect(
        `${baseUrl}/?action=signin&error=oauth_state_mismatch&message=Please try signing in with GitHub again.`
      );
    }

    if (!userId) {
      logger.error('No userId in cookie - session expired');
      return NextResponse.redirect(
        `${baseUrl}/?action=signin&error=oauth_session_expired&message=Your session expired. Please try again.`
      );
    }

    // Exchange code for access token
    logger.info('Exchanging code for token');
    const githubRedirectUri = await getConfigValue('GITHUB_REDIRECT_URI', null);
    const redirectUri = githubRedirectUri || `${baseUrl}/api/github/oauth/callback`;
    
    // Determine correct client ID and secret based on environment
    const nodeEnv = await getConfigValue('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production' || 
                         nextPublicUrl?.includes('beast-mode.dev') ||
                         nextPublicUrl?.includes('beast-mode.dev') ||
                         request.url.includes('beast-mode.dev') ||
                         request.url.includes('beast-mode.dev');
    
    const expectedProdClientId = 'Ov23liDKFkIrnPneWwny';
    const expectedDevClientId = 'Ov23lidLvmp68FVMEqEB';
    
    // Get GitHub config values
    const githubClientId = await getConfigValue('GITHUB_CLIENT_ID', null);
    const githubClientSecret = await getConfigValue('GITHUB_CLIENT_SECRET', null);
    const githubClientSecretProd = await getConfigValue('GITHUB_CLIENT_SECRET_PROD', null);
    const githubClientSecretDev = await getConfigValue('GITHUB_CLIENT_SECRET_DEV', null);
    const secret = await getConfigValue('SECRET', null);
    
    // Note: The hashes '014c7fab1ba6cc6a7398b5bde04e26463f16f4e9' and 'df4c598018de45ce8cb90313489eeb21448aedcf'
    // are just identifiers, not the actual secrets. We need the real GitHub OAuth client secrets from env vars.
    
    let clientId: string;
    let clientSecret: string;
    
    if (isProduction) {
      // Production: Use prod credentials
      // Priority: GITHUB_CLIENT_SECRET_PROD > GITHUB_CLIENT_SECRET (if valid) > SECRET (if valid)
      if (githubClientSecretProd && githubClientSecretProd.length > 20) {
        // Best case: dedicated prod secret
        clientId = expectedProdClientId;
        clientSecret = githubClientSecretProd;
        logger.info('Using GITHUB_CLIENT_SECRET_PROD');
      } else if (githubClientSecret && githubClientSecret.length > 20 && 
                 githubClientSecret !== '014c7fab1ba6cc6a7398b5bde04e26463f16f4e9') {
        // Fallback: use GITHUB_CLIENT_SECRET if it's a valid secret (not the hash)
        clientId = expectedProdClientId;
        clientSecret = githubClientSecret;
        logger.warn('Using GITHUB_CLIENT_SECRET for production (may not be correct)');
      } else if (secret && secret.length > 20) {
        // Last resort: use SECRET env var
        clientId = expectedProdClientId;
        clientSecret = secret;
        logger.warn('Using SECRET env var for production (may not be correct)');
      } else {
        // No valid secret found
        clientId = expectedProdClientId;
        clientSecret = '';
        logger.error('No valid production client secret found in environment variables');
      }
    } else {
      // Development: Use dev credentials
      // Priority: GITHUB_CLIENT_SECRET_DEV > GITHUB_CLIENT_SECRET (if valid) > SECRET (if valid)
      if (githubClientSecretDev && githubClientSecretDev.length > 20) {
        // Best case: dedicated dev secret
        clientId = expectedDevClientId;
        clientSecret = githubClientSecretDev;
        logger.info('Using GITHUB_CLIENT_SECRET_DEV');
      } else if (githubClientSecret && githubClientSecret.length > 20 && 
                 githubClientSecret !== 'df4c598018de45ce8cb90313489eeb21448aedcf') {
        // Fallback: use GITHUB_CLIENT_SECRET if it's a valid secret (not the hash)
        clientId = expectedDevClientId;
        clientSecret = githubClientSecret;
        logger.warn('Using GITHUB_CLIENT_SECRET for development (may not be correct)');
      } else if (secret && secret.length > 20) {
        // Last resort: use SECRET env var
        clientId = expectedDevClientId;
        clientSecret = secret;
        logger.warn('Using SECRET env var for development (may not be correct)');
      } else {
        // No valid secret found
        clientId = expectedDevClientId;
        clientSecret = '';
        logger.error('No valid development client secret found in environment variables');
      }
    }
    
    logger.debug('OAuth configuration', {
      environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
      redirectUri,
      clientIdLength: clientId?.length,
      clientSecretPresent: !!clientSecret,
      codeLength: code?.length
    });
    
        // Always use the correct credentials based on environment
        // If we got here, we should have valid credentials from auto-selection
        if (!clientId || !clientSecret) {
          logger.error('Missing GitHub OAuth credentials after auto-selection', {
            isProduction,
            clientIdPresent: !!clientId,
            clientSecretPresent: !!clientSecret,
            expectedProdClientId,
            expectedDevClientId
          });
          // Fallback: use hardcoded credentials as last resort
          if (isProduction) {
            clientId = expectedProdClientId;
            clientSecret = expectedProdClientSecret;
            logger.warn('Using fallback production credentials');
          } else {
            clientId = expectedDevClientId;
            clientSecret = expectedDevClientSecret;
            logger.warn('Using fallback development credentials');
          }
          
          // If still no credentials, throw error
          if (!clientId || !clientSecret) {
            throw new Error('GitHub OAuth credentials not configured');
          }
        }
    
    const tokenRequest = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };
    
    logger.debug('Token request prepared', {
      clientId: tokenRequest.client_id,
      codePrefix: code?.substring(0, 10),
      redirectUri: tokenRequest.redirect_uri
    });
    
    // GitHub OAuth token endpoint expects form-encoded data, not JSON
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    logger.debug('Token response received', {
      status: tokenResponse.status,
      ok: tokenResponse.ok
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Token exchange failed', {
        status: tokenResponse.status,
        response: errorText,
        redirectUri
      });
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData: TokenData = await tokenResponse.json();
    logger.debug('Token data received', {
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error
    });

    if (tokenData.error) {
      logger.error('Error in token response', {
        error: tokenData.error,
        errorDescription: tokenData.error_description
      });
      return NextResponse.redirect(
        `${baseUrl}/?action=signin&error=oauth_token_error&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      );
    }

    if (!tokenData.access_token) {
      logger.error('No access token in response');
      throw new Error('No access token received from GitHub');
    }

    const accessToken = tokenData.access_token;
    logger.info('Access token received successfully');

    // Get user info from GitHub
    logger.info('Fetching GitHub user info');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    logger.debug('User response received', {
      status: userResponse.status,
      ok: userResponse.ok
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      logger.error('Failed to fetch user info', {
        status: userResponse.status,
        response: errorText
      });
      throw new Error(`Failed to fetch GitHub user info: ${userResponse.status} ${errorText}`);
    }

    const githubUser: GitHubUser = await userResponse.json();
    logger.info('User info received', {
      username: githubUser.login,
      userId: githubUser.id,
      email: githubUser.email || 'not provided'
    });

    // Link GitHub installations to user account
    try {
      const supabase = await getSupabaseClientOrNull();
      if (supabase && userId && isSupabaseUser) {
        // Find any installations for this GitHub account
        const { data: installations } = await supabase
          .from('github_installations')
          .select('*')
          .eq('account_id', githubUser.id);

        if (installations && installations.length > 0) {
          // Link installations to user
          for (const installation of installations) {
            await supabase
              .from('github_installations')
              .update({ user_id: userId })
              .eq('installation_id', installation.installation_id);
          }
          logger.info('Linked GitHub installations to user', {
            installationCount: installations.length,
            userId
          });
        }
      }
    } catch (linkError: unknown) {
      const errorMessage = linkError instanceof Error ? linkError.message : 'Unknown error';
      logger.warn('Error linking installations (non-fatal)', {
        error: errorMessage
      });
      // Don't fail OAuth flow if linking fails
    }

    // Store encrypted token in Supabase (with fallback to in-memory)
    logger.info('Storing token in database', {
      userId,
      githubUsername: githubUser.login,
      githubUserId: githubUser.id,
      isSupabaseUser
    });
    
    try {
      // Try to store in Supabase if user is a Supabase user
      if (isSupabaseUser && userId && userId.startsWith('00000000-')) {
        const supabase = await getSupabaseClientOrNull();
        if (supabase) {
          const encryptedToken = encrypt(accessToken);
          const scopes = tokenData.scope ? tokenData.scope.split(',') : ['repo', 'read:user', 'user:email'];
          
          const { data, error } = await supabase
            .from('user_github_tokens')
            .upsert({
              user_id: userId,
              product: 'beast-mode',
              encrypted_token: encryptedToken,
              github_username: githubUser.login,
              github_user_id: githubUser.id,
              github_email: githubUser.email,
              scopes: scopes,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,product'
            });
          
          if (error) {
            logger.error('Supabase storage error', { error });
            // Fall through to fallback storage
          } else {
            logger.info('Token stored in Supabase successfully');
            // Success, continue to redirect (don't return early)
          }
        } else {
          logger.debug('Supabase not available, using fallback storage');
        }
      }
      
      // Fallback: Store via API route (for non-Supabase users or if Supabase fails)
      if (!isSupabaseUser || !userId || !userId.startsWith('00000000-')) {
        const storeUrl = `${baseUrl}/api/github/token`;
        logger.debug('Using fallback storage via API', { storeUrl });
        
        try {
          const storeResponse = await fetch(storeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              githubToken: accessToken,
              githubUsername: githubUser.login,
              githubUserId: githubUser.id,
            }),
          });
          
          logger.debug('Store response received', {
            status: storeResponse.status,
            ok: storeResponse.ok
          });
          
          if (storeResponse.ok) {
            logger.info('Token stored successfully (fallback)');
          } else {
            const errorData = await storeResponse.json().catch(() => ({}));
            logger.error('Failed to store token', {
              status: storeResponse.status,
              error: errorData
            });
          }
        } catch (fetchError: unknown) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
          logger.error('Error calling token storage API', { error: errorMessage });
        }
      }
    } catch (storeError: unknown) {
      const errorMessage = storeError instanceof Error ? storeError.message : 'Unknown error';
      const errorStack = storeError instanceof Error ? storeError.stack : undefined;
      logger.error('Error storing token (non-fatal)', {
        error: errorMessage,
        stack: errorStack
      });
      // Continue even if storage fails - token is still valid
    }

    // Check if user has a Supabase account
    // GitHub OAuth is for connecting GitHub, not for site authentication
    // Users need to sign in with email/password first, then connect GitHub
    let hasSupabaseAccount = false;
    
    try {
      const supabase = await getSupabaseClientOrNull();
      if (supabase && githubUser.email) {
        // Try to find existing user by email
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError && existingUsers?.users) {
          const existingUser = existingUsers.users.find(u => u.email === githubUser.email);
          if (existingUser) {
            hasSupabaseAccount = true;
            logger.info('Found existing Supabase user', { userId: existingUser.id });
          } else {
            logger.debug('No Supabase account found', { email: githubUser.email });
          }
        }
      }
    } catch (supabaseError: unknown) {
      const errorMessage = supabaseError instanceof Error ? supabaseError.message : 'Unknown error';
      logger.warn('Supabase user lookup error (non-fatal)', { error: errorMessage });
    }

    // Determine redirect based on whether user has Supabase account
    // GitHub OAuth is for connecting GitHub, NOT for site authentication
    // Users must sign in with email/password first, then connect GitHub
    let redirectUrl: string;
    
    // Check if user has Supabase account
    const hasAccount = hasSupabaseAccount || (userId && userId.startsWith('00000000-') && isSupabaseUser);
    
    // Build redirect URL with helpful parameters
    const params = new URLSearchParams();
    if (hasAccount) {
      params.set('action', 'signin');
      params.set('message', 'github_connected');
      params.set('github_username', githubUser.login);
      if (githubUser.email) {
        params.set('email', githubUser.email); // Pre-fill email for convenience
      }
      redirectUrl = `${baseUrl}/?${params.toString()}`;
      logger.info('User has account - redirecting to sign-in', {
        email: githubUser.email || 'not provided'
      });
    } else {
      params.set('action', 'signup');
      params.set('message', 'github_connected');
      params.set('github_username', githubUser.login);
      if (githubUser.email) {
        params.set('email', githubUser.email); // Pre-fill email for sign-up
      }
      redirectUrl = `${baseUrl}/?${params.toString()}`;
      logger.info('No account found - redirecting to sign-up', {
        email: githubUser.email || 'not provided'
      });
    }
    
    logger.info('Redirecting user', {
      githubUsername: githubUser.login,
      githubEmail: githubUser.email || 'not provided',
      hasSupabaseAccount: hasAccount,
      redirectUrl
    });

    // Clear OAuth cookies but keep userId cookie temporarily for token lookup
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.delete('github_oauth_state');
    // Keep github_oauth_user_id cookie for a bit longer so GET /api/github/token can find it
    const isProd = nodeEnv === 'production';
    response.cookies.set('github_oauth_user_id', userId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 // Keep for 1 minute to allow token lookup
    });

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Callback error', {
      message: errorMessage,
      stack: errorStack
    });
    
    return NextResponse.redirect(
      `${baseUrl}/?action=signin&error=oauth_callback_error&message=${encodeURIComponent(errorMessage)}`
    );
  }
}

