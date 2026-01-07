/**
 * Unit Tests for databaseWriter
 */

const { writePrediction, writeFeedback } = require('@/lib/mlops/databaseWriter')

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  })),
}))

describe('databaseWriter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('writePrediction', () => {
    it('should write prediction to database', async () => {
      const prediction = {
        serviceName: 'test-service',
        model: 'test-model',
        prediction: { success: 0.8 },
      }

      const result = await writePrediction(prediction)

      expect(result).toBeDefined()
      expect(result.predictionId).toBeDefined()
    })

    it('should return predictionId', async () => {
      const prediction = {
        serviceName: 'test-service',
        model: 'test-model',
        prediction: { success: 0.8 },
      }

      const result = await writePrediction(prediction)

      expect(result.predictionId).toBeDefined()
    })
  })

  describe('writeFeedback', () => {
    it('should write feedback to database', async () => {
      const feedback = {
        predictionId: 'test-prediction-id',
        actualValue: 0.9,
        success: true,
      }

      const result = await writeFeedback(feedback)

      expect(result).toBeDefined()
    })
  })
})

