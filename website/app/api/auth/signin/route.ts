import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'beast-mode-secret-change-in-production';

/**
 * Sign In API
 * 
 * Real authentication with Supabase or fallback to simple JWT
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

    // Try Supabase auth first
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Invalid email or password' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { userId: data.user.id, email: data.user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
          plan: data.user.user_metadata?.plan || 'free'
        },
        token
      });
    }

    // Fallback: Simple mock auth (for development without Supabase)
    console.warn('Using mock authentication - configure Supabase for production');
    const token = jwt.sign(
      { email, userId: `user_${Date.now()}` },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

