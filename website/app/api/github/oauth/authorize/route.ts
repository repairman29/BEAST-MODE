import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GitHub OAuth Authorization
 * 
 * Initiates GitHub OAuth flow for user to connect their account
 * This allows scanning of private repositories
 */
export async function GET(request: NextRequest) {
  console.log('🔵 [GitHub OAuth] Authorize endpoint called');
  console.log('   URL:', request.url);
  console.log('   Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Get user ID from session/token (optional - allow OAuth even without BEAST MODE login)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('beastModeToken')?.value;
    
    console.log('   Auth token present:', !!token);
    
    // Generate a user ID - use token if available, otherwise generate a session ID
    let userId: string;
    if (token) {
      // Use token-based user ID
      userId = `user-${token.slice(0, 8)}`;
      console.log('   Using token-based userId:', userId);
    } else {
      // Generate a session ID for anonymous users
      const sessionId = crypto.randomBytes(16).toString('hex');
      userId = `session-${sessionId}`;
      console.log('   Generated session userId:', userId);
    }

    // Check if GitHub OAuth is configured
    if (!process.env.GITHUB_CLIENT_ID) {
      console.error('❌ [GitHub OAuth] GITHUB_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in environment variables.' },
        { status: 500 }
      );
    }

    console.log('   Client ID:', process.env.GITHUB_CLIENT_ID);
    console.log('   Client ID length:', process.env.GITHUB_CLIENT_ID?.length);

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    console.log('   Generated state:', state.substring(0, 16) + '...');
    
    // Store state in session/cookie (in production, use Redis or database)
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 
                       `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/api/github/oauth/callback`;
    
    console.log('   Redirect URI:', redirectUri);
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent('repo read:user user:email')}&` +
      `state=${state}`;
    
    console.log('   Redirecting to GitHub:', githubAuthUrl.substring(0, 100) + '...');
    
    const response = NextResponse.redirect(githubAuthUrl);

    // Store state in httpOnly cookie
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    response.cookies.set('github_oauth_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600
    });

    console.log('✅ [GitHub OAuth] Redirecting to GitHub, cookies set');
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

