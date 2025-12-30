import { NextRequest, NextResponse } from 'next/server';

/**
 * Sign In API
 * 
 * Simple authentication (replace with proper auth in production)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual authentication
    // For now, accept any email/password combination
    // In production, use:
    // - Database lookup
    // - Password hashing (bcrypt)
    // - JWT token generation
    // - Session management

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      user: {
        id: `user_${Date.now()}`,
        email,
        plan: 'free'
      },
      token
    });

  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}

