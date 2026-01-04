/**
 * Database Writer Service Tests
 */

const DatabaseWriter = require('../../lib/mlops/databaseWriter');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: [{ id: 'test-id' }],
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({
            data: [{ id: 'test-id', status: 'updated' }],
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

describe('DatabaseWriter', () => {
  let writer;

  beforeEach(() => {
    writer = new DatabaseWriter();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (writer.flushTimer) {
      clearInterval(writer.flushTimer);
    }
  });

  describe('Initialization', () => {
    test('should initialize database writer', async () => {
      await writer.initialize();
      
      expect(writer.initialized).toBe(true);
    });

    test('should handle initialization failure gracefully', async () => {
      // Mock initialization failure
      const originalRequire = require;
      require = jest.fn(() => {
        throw new Error('Module not found');
      });

      await writer.initialize();
      
      // Should still mark as initialized (queued mode)
      expect(writer.initialized).toBe(true);
      
      require = originalRequire;
    });
  });

  describe('Write Operations', () => {
    test('should write prediction to database', async () => {
      await writer.initialize();
      
      const prediction = {
        id: 'pred-1',
        serviceName: 'test-service',
        predictedValue: 0.85,
        context: { test: 'data' }
      };

      const result = await writer.writePrediction(prediction);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
    });

    test('should queue writes when database not available', async () => {
      // Initialize without database
      writer.initialized = true;
      writer.supabase = null;

      const prediction = {
        id: 'pred-1',
        serviceName: 'test-service',
        predictedValue: 0.85
      };

      await writer.writePrediction(prediction);
      
      // Should be queued
      expect(writer.writeQueue.length).toBeGreaterThan(0);
    });

    test('should batch write multiple predictions', async () => {
      await writer.initialize();
      
      const predictions = [
        { id: 'pred-1', serviceName: 'test', predictedValue: 0.8 },
        { id: 'pred-2', serviceName: 'test', predictedValue: 0.9 }
      ];

      const results = await writer.writePredictions(predictions);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Feedback Operations', () => {
    test('should write feedback to database', async () => {
      await writer.initialize();
      
      const feedback = {
        predictionId: 'pred-1',
        actualValue: 0.9,
        feedbackScore: 0.85
      };

      const result = await writer.writeFeedback(feedback);
      
      expect(result).toBeDefined();
    });

    test('should update prediction with feedback', async () => {
      await writer.initialize();
      
      const update = {
        predictionId: 'pred-1',
        actualValue: 0.9,
        feedbackScore: 0.85
      };

      const result = await writer.updatePredictionWithFeedback(update);
      
      expect(result).toBeDefined();
    });
  });

  describe('Queue Management', () => {
    test('should flush queue when timer expires', async () => {
      writer.initialized = true;
      writer.supabase = null;
      writer.writeQueue = [
        { type: 'prediction', data: { id: 'pred-1' } }
      ];

      // Start flush timer
      writer.startFlushTimer();
      
      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Queue should be processed (or attempted)
      expect(writer.writeQueue.length).toBe(0);
    });

    test('should flush queue manually', async () => {
      writer.initialized = true;
      writer.supabase = null;
      writer.writeQueue = [
        { type: 'prediction', data: { id: 'pred-1' } }
      ];

      await writer.flushQueue();
      
      // Queue should be cleared
      expect(writer.writeQueue.length).toBe(0);
    });
  });
});

