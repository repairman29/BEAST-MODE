import { NextRequest, NextResponse } from 'next/server';

/**
 * Unified Analytics Middleware
 * 
 * Tracks API usage for unified analytics
 */

export function middleware(request: NextRequest) {
  // Track API calls (async, don't block)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Don't track analytics endpoints themselves to avoid loops
    if (!request.nextUrl.pathname.includes('/analytics') && 
        !request.nextUrl.pathname.includes('/sessions/track')) {
      
      // Track asynchronously (don't block request)
      trackAPICall(request).catch(() => {
        // Silently fail
      });
    }
  }

  return NextResponse.next();
}

async function trackAPICall(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get user info from cookies
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    
    // Track the API call
    await fetch(`${request.nextUrl.origin}/api/beast-mode/sessions/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        sessionId: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionType: 'api',
        event: 'api_call',
        metadata: {
          endpoint: request.nextUrl.pathname,
          method: request.method,
          timestamp: new Date().toISOString(),
        },
        context: {
          endpoint: request.nextUrl.pathname,
          method: request.method,
        },
        timestamp: new Date().toISOString(),
      })
    });
  } catch (error) {
    // Silently fail - don't break API calls
  }
}

export const config = {
  matcher: '/api/:path*',
};



