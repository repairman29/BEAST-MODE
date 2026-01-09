/**
 * Freemium Limits Tests
 * 
 * Tests for freemium limits utilities
 */

import {
  getUserTier,
  getUserLimits,
  canAddRepo,
  canExport,
  canCompare,
  FREEMIUM_LIMITS,
} from '@/lib/freemium-limits';

// Mock auth
jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(),
}));

describe('Freemium Limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTier', () => {
    it('should return free when not authenticated', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(false);

      const tier = await getUserTier();
      expect(tier).toBe('free');
    });

    it('should return authenticated when authenticated', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(true);

      const tier = await getUserTier();
      expect(tier).toBe('authenticated');
    });
  });

  describe('getUserLimits', () => {
    it('should return free limits for free tier', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(false);

      const limits = await getUserLimits();
      expect(limits).toEqual(FREEMIUM_LIMITS.FREE);
      expect(limits.maxRepos).toBe(3);
    });

    it('should return authenticated limits for authenticated tier', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(true);

      const limits = await getUserLimits();
      expect(limits).toEqual(FREEMIUM_LIMITS.AUTHENTICATED);
      expect(limits.maxRepos).toBe(100);
    });
  });

  describe('canAddRepo', () => {
    it('should allow adding repos under free limit', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(false);

      const result = await canAddRepo(2);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(3);
    });

    it('should deny adding repos at free limit', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(false);

      const result = await canAddRepo(3);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Free tier limit');
    });

    it('should allow adding repos under authenticated limit', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(true);

      const result = await canAddRepo(50);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
    });
  });

  describe('canExport', () => {
    it('should return false for free tier', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(false);

      const result = await canExport();
      expect(result).toBe(false);
    });

    it('should return true for authenticated tier', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(true);

      const result = await canExport();
      expect(result).toBe(true);
    });
  });

  describe('canCompare', () => {
    it('should return false for free tier', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(false);

      const result = await canCompare();
      expect(result).toBe(false);
    });

    it('should return true for authenticated tier', async () => {
      const { isAuthenticated } = require('@/lib/auth');
      isAuthenticated.mockResolvedValue(true);

      const result = await canCompare();
      expect(result).toBe(true);
    });
  });
});
