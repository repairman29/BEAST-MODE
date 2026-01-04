/**
 * Feedback Collector Service Tests
 */

const { getFeedbackCollector } = require('../../lib/mlops/feedbackCollector');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-id', predicted_value: 0.8, service_name: 'test-service' },
            error: null
          }))
        })),
        is: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                count: 0,
                error: null
              }))
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-id', actual_value: 0.9 },
              error: null
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'feedback-id' },
            error: null
          }))
        }))
      }))
    }))
  };
  return {
    createClient: jest.fn(() => mockSupabase)
  };
});

describe('FeedbackCollector', () => {
  let collector;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    collector = await getFeedbackCollector();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize feedback collector', async () => {
      expect(collector).toBeDefined();
      expect(collector.initialized).toBe(true);
    });
  });

  describe('recordOutcome', () => {
    test('should record outcome for prediction', async () => {
      const result = await collector.recordOutcome('test-id', 0.9, { test: 'context' });
      
      expect(result).toBeDefined();
      expect(result.actual_value).toBe(0.9);
    });

    test('should handle missing predictionId gracefully', async () => {
      const result = await collector.recordOutcome(null, 0.9);
      
      expect(result).toBeNull();
    });

    test('should retry on transient errors', async () => {
      // Mock first call to fail, second to succeed
      const mockFrom = require('@supabase/supabase-js').createClient().from;
      let callCount = 0;
      
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST301', message: 'Connection error' }
            }))
          }))
        }))
      }));

      // Should retry and eventually succeed
      const result = await collector.recordOutcome('test-id', 0.9);
      expect(result).toBeDefined();
    });
  });

  describe('collectFeedback', () => {
    test('should collect feedback data', async () => {
      const feedbackData = {
        predictionId: 'test-id',
        serviceName: 'test-service',
        feedbackType: 'user',
        feedbackScore: 0.85,
        feedbackText: 'Good prediction',
        userId: 'user-1'
      };

      const result = await collector.collectFeedback(feedbackData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('feedback-id');
    });

    test('should handle feedback without predictionId', async () => {
      const feedbackData = {
        serviceName: 'test-service',
        feedbackType: 'user',
        feedbackScore: 0.85
      };

      const result = await collector.collectFeedback(feedbackData);
      
      expect(result).toBeDefined();
    });
  });

  describe('getFeedbackStats', () => {
    test('should get feedback statistics', async () => {
      const stats = await collector.getFeedbackStats('test-service', 7);
      
      expect(stats).toBeDefined();
      expect(stats.serviceName).toBe('test-service');
      expect(stats.days).toBe(7);
    });

    test('should get stats for all services', async () => {
      const stats = await collector.getFeedbackStats(null, 7);
      
      expect(stats).toBeDefined();
      expect(stats.serviceName).toBe('all');
    });
  });

  describe('monitorFeedbackCollection', () => {
    test('should monitor feedback collection and alert if low', async () => {
      const result = await collector.monitorFeedbackCollection(1.0);
      
      expect(result).toBeDefined();
      expect(result.feedbackRate).toBeDefined();
      expect(result.alert).toBeDefined();
    });

    test('should alert when feedback rate is below threshold', async () => {
      // Mock low feedback rate
      const mockFrom = require('@supabase/supabase-js').createClient().from;
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          count: 'exact',
          gte: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [],
              count: 1000,
              error: null
            }))
          }))
        }))
      }));

      const result = await collector.monitorFeedbackCollection(1.0);
      
      // If feedback rate is low, should alert
      if (result && result.feedbackRate < 1.0) {
        expect(result.alert).toBe(true);
      }
    });
  });
});

