import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

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

    // Get JWT secret from unified config
    const JWT_SECRET = await getConfigValue('JWT_SECRET', 'beast-mode-secret-change-in-production');

    // Try Supabase auth first
    const supabase = await getSupabaseClientOrNull();
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
        JWT_SECRET || 'beast-mode-secret-change-in-production',
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
      JWT_SECRET || 'beast-mode-secret-change-in-production',
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

