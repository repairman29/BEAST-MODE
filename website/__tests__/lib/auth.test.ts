/**
 * Authentication Tests
 * 
 * Tests for authentication utilities
 */

import { isAuthenticated, isAdmin, getCurrentUser } from '@/lib/auth';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}));

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  describe('isAuthenticated', () => {
    it('should return false when no session exists', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      const result = await isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true when session exists', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
      });

      const result = await isAuthenticated();
      expect(result).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return false when not authenticated', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it('should return true for admin email in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com';
      
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { email: 'admin@example.com' } } },
      });

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it('should return false for non-admin email', async () => {
      process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com';
      
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { email: 'user@example.com' } } },
      });

      const result = await isAdmin();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getCurrentUser();
      expect(result).toBe(null);
    });

    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'user@example.com' };
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const result = await getCurrentUser();
      expect(result).toEqual(mockUser);
    });
  });
});
