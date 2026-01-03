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

    // Get JWT secret from unified config
    const JWT_SECRET = await getConfigValue('JWT_SECRET', 'beast-mode-secret-change-in-production');

    // Try Supabase auth first
    const supabase = getSupabaseClientOrNull();
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
        JWT_SECRET || 'beast-mode-secret-change-in-production',
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
      JWT_SECRET || 'beast-mode-secret-change-in-production',
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

