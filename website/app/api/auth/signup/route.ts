import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'beast-mode-secret-change-in-production';

/**
 * Sign Up API
 * 
 * Real user registration with Supabase or fallback
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Try Supabase auth first
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            plan: 'free'
          }
        }
      });

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Registration failed' },
          { status: 400 }
        );
      }

      const token = jwt.sign(
        { userId: data.user?.id, email: data.user?.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        user: {
          id: data.user?.id || '',
          email: data.user?.email || email,
          name: name || email.split('@')[0],
          plan: 'free'
        },
        token,
        needsVerification: !data.session // Email verification required
      });
    }

    // Fallback: Simple mock registration
    console.warn('Using mock registration - configure Supabase for production');
    const token = jwt.sign(
      { email, userId: `user_${Date.now()}` },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      user: {
        id: `user_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        plan: 'free'
      },
      token
    });

  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}

