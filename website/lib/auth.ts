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
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: check via cookies/headers
    // For now, allow in development
    return process.env.NODE_ENV === 'development';
  }

  // Client-side: check Supabase session
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
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
