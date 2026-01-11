/**
 * Authentication Utilities
 * 
 * Handles authentication checks for admin and protected routes
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase client for auth
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if user is authenticated
 * 
 * Checks both Supabase sessions and JWT tokens stored in localStorage
 * This supports both Supabase auth and JWT-based auth flows
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: check via cookies/headers
    // For now, allow in development
    return process.env.NODE_ENV === 'development';
  }

  // First, check for JWT token in localStorage (from /api/auth/signin)
  const jwtToken = localStorage.getItem('beastModeToken');
  const storedUser = localStorage.getItem('beastModeUser');
  
  if (jwtToken && storedUser) {
    try {
      // Validate token exists and user data exists
      const user = JSON.parse(storedUser);
      if (user && user.id && user.email) {
        // JWT token exists and user data is valid
        // Note: In production, you should validate the JWT token signature
        // For now, we trust that if it's in localStorage and user data exists, user is authenticated
        return true;
      }
    } catch (e) {
      // Invalid stored user, clear it
      localStorage.removeItem('beastModeUser');
      localStorage.removeItem('beastModeToken');
    }
  }

  // Fallback: check Supabase session (for users who signed in via Supabase directly)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return true;
      }
    } catch (error) {
      // Supabase check failed, continue to return false
      console.error('Supabase session check failed:', error);
    }
  }

  return false;
}

/**
 * Check if user is admin
 * TODO: Implement proper admin role check
 */
export async function isAdmin(): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: check via session
    // For now, allow in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // In production, check admin cookie or session
    return false;
  }

  // Client-side: check Supabase session + admin role
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  // TODO: Check user metadata for admin role
  // For now, check if user email is in admin list
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
  const userEmail = session.user.email;
  
  if (userEmail && adminEmails.includes(userEmail)) {
    return true;
  }

  // Development mode: allow access
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Authentication required');
  }
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Admin access required');
  }
}
