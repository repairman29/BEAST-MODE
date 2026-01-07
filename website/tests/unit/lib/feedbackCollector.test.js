/**
 * Unit Tests for feedbackCollector
 */

const { recordOutcome, collectFeedback } = require('@/lib/mlops/feedbackCollector')

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  })),
}))

describe('feedbackCollector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('recordOutcome', () => {
    it('should update prediction with actual value', async () => {
      const outcome = {
        predictionId: 'test-prediction-id',
        actualValue: 0.9,
        success: true,
      }

      const result = await recordOutcome(outcome)

      expect(result).toBeDefined()
    })

    it('should handle missing predictionId gracefully', async () => {
      const outcome = {
        actualValue: 0.9,
        success: true,
      }

      // Should not throw
      await expect(recordOutcome(outcome)).resolves.not.toThrow()
    })
  })

  describe('collectFeedback', () => {
    it('should store feedback', async () => {
      const feedback = {
        predictionId: 'test-prediction-id',
        rating: 5,
        comment: 'Great!',
      }

      const result = await collectFeedback(feedback)

      expect(result).toBeDefined()
    })
  })
})

