import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';
import { encrypt } from '../../../../../lib/github-token-encrypt';

/**
 * GitHub OAuth Callback
 * 
 * Handles GitHub OAuth callback and stores user's GitHub token
 */
export async function GET(request: NextRequest) {
  console.log('🟢 [GitHub OAuth] Callback endpoint called');
  console.log('   URL:', request.url);
  console.log('   Search params:', Object.fromEntries(request.nextUrl.searchParams.entries()));
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('   Code present:', !!code);
    console.log('   State present:', !!state);
    console.log('   Error present:', !!error);

    // Handle OAuth errors
    if (error) {
      console.error('❌ [GitHub OAuth] Error from GitHub:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=error&error=${error}`
      );
    }

    if (!code || !state) {
      console.error('❌ [GitHub OAuth] Missing code or state');
      console.error('   Code:', code);
      console.error('   State:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=error&error=missing_code_or_state`
      );
    }

    // Verify state
    const storedState = request.cookies.get('github_oauth_state')?.value;
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const isSupabaseUser = request.cookies.get('github_oauth_is_supabase_user')?.value === 'true';

    console.log('   Stored state:', storedState ? storedState.substring(0, 16) + '...' : 'NOT FOUND');
    console.log('   Received state:', state.substring(0, 16) + '...');
    console.log('   User ID:', userId);

    if (!storedState || storedState !== state) {
      console.error('❌ [GitHub OAuth] State mismatch');
      console.error('   Stored:', storedState);
      console.error('   Received:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=error&error=invalid_state`
      );
    }

    if (!userId) {
      console.error('❌ [GitHub OAuth] No userId in cookie');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=error&error=session_expired`
      );
    }

    // Exchange code for access token
    console.log('🔄 [GitHub OAuth] Exchanging code for token...');
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/api/github/oauth/callback`;
    
    // Determine correct client ID and secret based on environment
    const isProduction = process.env.NODE_ENV === 'production' || 
                         process.env.NEXT_PUBLIC_URL?.includes('beastmode.dev') ||
                         process.env.NEXT_PUBLIC_URL?.includes('beast-mode.dev') ||
                         request.url.includes('beastmode.dev') ||
                         request.url.includes('beast-mode.dev');
    
    const expectedProdClientId = 'Ov23liDKFkIrnPneWwny';
    const expectedProdClientSecret: process.env.SECRET || '';
    const expectedDevClientId = 'Ov23lidLvmp68FVMEqEB';
    const expectedDevClientSecret: process.env.SECRET || '';
    
    let clientId: string;
    let clientSecret: string;
    
    if (isProduction) {
      // Production: Use prod credentials
      if (process.env.GITHUB_CLIENT_ID === expectedProdClientId) {
        clientId = process.env.GITHUB_CLIENT_ID;
        clientSecret = process.env.GITHUB_CLIENT_SECRET || expectedProdClientSecret;
      } else {
        // Auto-fix: use prod credentials
        console.warn('⚠️ [GitHub OAuth] Auto-fixing: Using PROD credentials (env had wrong values)');
        clientId = expectedProdClientId;
        clientSecret = expectedProdClientSecret;
      }
    } else {
      // Development: Use dev credentials
      if (process.env.GITHUB_CLIENT_ID === expectedDevClientId) {
        clientId = process.env.GITHUB_CLIENT_ID;
        clientSecret = process.env.GITHUB_CLIENT_SECRET || expectedDevClientSecret;
      } else {
        // Auto-fix: use dev credentials
        console.warn('⚠️ [GitHub OAuth] Auto-fixing: Using DEV credentials (env had wrong values)');
        clientId = expectedDevClientId;
        clientSecret = expectedDevClientSecret;
      }
    }
    
    console.log('   Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('   Using redirect URI:', redirectUri);
    console.log('   Client ID:', clientId);
    console.log('   Client ID length:', clientId?.length);
    console.log('   Client Secret present:', !!clientSecret);
    console.log('   Client Secret length:', clientSecret?.length);
    console.log('   Code length:', code?.length);
    
    if (!clientId || !clientSecret) {
      console.error('❌ [GitHub OAuth] Missing credentials');
      console.error('   Client ID present:', !!clientId);
      console.error('   Client Secret present:', !!clientSecret);
      throw new Error('GitHub OAuth credentials not configured');
    }
    
    const tokenRequest = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    };
    
    console.log('   Token request (without secrets):', {
      client_id: tokenRequest.client_id,
      code: code?.substring(0, 10) + '...',
      redirect_uri: tokenRequest.redirect_uri,
    });
    
    // GitHub OAuth token endpoint expects form-encoded data, not JSON
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });
    
    console.log('   Using form-encoded request (GitHub standard)');
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    console.log('   Token response status:', tokenResponse.status);
    console.log('   Token response ok:', tokenResponse.ok);
    console.log('   Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [GitHub OAuth] Token exchange failed');
      console.error('   Status:', tokenResponse.status);
      console.error('   Response:', errorText);
      console.error('   Request details:', {
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        code_present: !!code,
      });
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('   Token data keys:', Object.keys(tokenData));
    console.log('   Token data error:', tokenData.error);

    if (tokenData.error) {
      console.error('❌ [GitHub OAuth] Error in token response:', tokenData.error);
      console.error('   Error description:', tokenData.error_description);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=error&error=${tokenData.error}`
      );
    }

    const accessToken = tokenData.access_token;
    console.log('✅ [GitHub OAuth] Access token received:', accessToken ? 'YES' : 'NO');

    // Get user info from GitHub
    console.log('🔄 [GitHub OAuth] Fetching GitHub user info...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    console.log('   User response status:', userResponse.status);
    console.log('   User response ok:', userResponse.ok);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ [GitHub OAuth] Failed to fetch user info');
      console.error('   Status:', userResponse.status);
      console.error('   Response:', errorText);
      throw new Error(`Failed to fetch GitHub user info: ${userResponse.status} ${errorText}`);
    }

    const githubUser = await userResponse.json();
    console.log('✅ [GitHub OAuth] User info received');
    console.log('   Username:', githubUser.login);
    console.log('   User ID:', githubUser.id);

    // Store encrypted token in Supabase (with fallback to in-memory)
    console.log('🔄 [GitHub OAuth] Storing token in database...');
    console.log('   User ID:', userId);
    console.log('   GitHub Username:', githubUser.login);
    console.log('   GitHub User ID:', githubUser.id);
    console.log('   Is Supabase user:', isSupabaseUser);
    
    try {
      // Try to store in Supabase if user is a Supabase user
      if (isSupabaseUser && userId && userId.startsWith('00000000-')) {
        const supabase = getSupabaseClientOrNull();
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
            console.error('❌ [GitHub OAuth] Supabase storage error:', error);
            // Fall through to fallback storage
          } else {
            console.log('✅ [GitHub OAuth] Token stored in Supabase successfully');
            // Success, continue to redirect (don't return early)
          }
        } else {
          console.log('   Supabase not available, using fallback storage');
        }
      }
      
      // Fallback: Store via API route (for non-Supabase users or if Supabase fails)
      if (!isSupabaseUser || !userId || !userId.startsWith('00000000-')) {
        const storeUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/api/github/token`;
        console.log('   Using fallback storage via API:', storeUrl);
        
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
        
        console.log('   Store response status:', storeResponse.status);
        console.log('   Store response ok:', storeResponse.ok);
        
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          console.log('✅ [GitHub OAuth] Token stored successfully (fallback):', storeData);
        } else {
          const errorData = await storeResponse.json().catch(() => ({}));
          console.error('❌ [GitHub OAuth] Failed to store token');
          console.error('   Status:', storeResponse.status);
          console.error('   Error:', errorData);
        }
      }
    } catch (storeError: any) {
      console.error('❌ [GitHub OAuth] Error storing token (non-fatal):', storeError);
      console.error('   Stack:', storeError.stack);
      // Continue even if storage fails - token is still valid
    }

    // Clear OAuth cookies but keep userId cookie temporarily for token lookup
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=success`
    );

    response.cookies.delete('github_oauth_state');
    // Keep github_oauth_user_id cookie for a bit longer so GET /api/github/token can find it
    response.cookies.set('github_oauth_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 // Keep for 1 minute to allow token lookup
    });

    return response;
  } catch (error: any) {
    console.error('❌ [GitHub OAuth] Callback error:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/dashboard?github_oauth=error&error=${encodeURIComponent(error.message)}`
    );
  }
}

