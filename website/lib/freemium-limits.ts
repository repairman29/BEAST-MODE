/**
 * Freemium Limits
 * 
 * Defines usage limits for free vs authenticated users
 */

export const FREEMIUM_LIMITS = {
  FREE: {
    maxRepos: 3,
    maxReposPerAnalysis: 3,
    canExport: false,
    canCompare: false,
    canViewTrends: true,
    canViewHistory: false,
  },
  AUTHENTICATED: {
    maxRepos: 100,
    maxReposPerAnalysis: 10,
    canExport: true,
    canCompare: true,
    canViewTrends: true,
    canViewHistory: true,
  },
  PRO: {
    maxRepos: 1000,
    maxReposPerAnalysis: 50,
    canExport: true,
    canCompare: true,
    canViewTrends: true,
    canViewHistory: true,
  }
} as const;

export type UserTier = 'free' | 'authenticated' | 'pro';

/**
 * Get user tier based on authentication status
 */
export async function getUserTier(): Promise<UserTier> {
  // Check if user is authenticated
  const { isAuthenticated } = await import('./auth');
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    return 'free';
  }
  
  // TODO: Check if user has Pro subscription
  // For now, authenticated = authenticated tier
  return 'authenticated';
}

/**
 * Get limits for current user
 */
export async function getUserLimits() {
  const tier = await getUserTier();
  return FREEMIUM_LIMITS[tier.toUpperCase() as keyof typeof FREEMIUM_LIMITS] || FREEMIUM_LIMITS.FREE;
}

/**
 * Check if user can add more repos
 */
export async function canAddRepo(currentCount: number): Promise<{ allowed: boolean; reason?: string; limit?: number }> {
  const limits = await getUserLimits();
  
  if (currentCount >= limits.maxRepos) {
    return {
      allowed: false,
      reason: `Free tier limit: ${limits.maxRepos} repos. Sign in for unlimited repos.`,
      limit: limits.maxRepos
    };
  }
  
  return { allowed: true, limit: limits.maxRepos };
}

/**
 * Check if user can export
 */
export async function canExport(): Promise<boolean> {
  const limits = await getUserLimits();
  return limits.canExport;
}

/**
 * Check if user can compare repos
 */
export async function canCompare(): Promise<boolean> {
  const limits = await getUserLimits();
  return limits.canCompare;
}
