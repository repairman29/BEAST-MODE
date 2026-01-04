/**
 * MLflow Service Tests
 */

const MLflowService = require('../../lib/mlops/mlflowService');

// Mock fetch for REST API
global.fetch = jest.fn();

describe('MLflowService', () => {
  let service;

  beforeEach(() => {
    service = new MLflowService();
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Initialization', () => {
    test('should initialize MLflow service', async () => {
      await service.initialize();
      
      expect(service.initialized).toBe(true);
    });

    test('should use REST API fallback when MLflow not installed', async () => {
      // Mock require to fail
      const originalRequire = require;
      require = jest.fn((module) => {
        if (module === 'mlflow') {
          throw new Error('Module not found');
        }
        return originalRequire(module);
      });

      await service.initialize();
      
      expect(service.useRestAPI).toBe(true);
      expect(service.initialized).toBe(true);
      
      require = originalRequire;
    });
  });

  describe('Run Management', () => {
    test('should start a new run', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      // Mock REST API response
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ experiment: { experiment_id: 'exp-1' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ run: { info: { run_id: 'run-1' } } })
        });

      const run = await service.startRun('test-run', { tag: 'value' });
      
      expect(run).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should end a run', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await service.endRun('run-1', { status: 'FINISHED' });
      
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    test('should log metrics', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await service.logMetric('run-1', 'accuracy', 0.95, 1);
      
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should log parameters', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await service.logParam('run-1', 'learning_rate', 0.001);
      
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Model Registry', () => {
    test('should register model', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ model_version: { version: 1 } })
      });

      const result = await service.registerModel('run-1', 'model-name');
      
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should get model versions', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ model_versions: [] })
      });

      const versions = await service.getModelVersions('model-name');
      
      expect(versions).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const run = await service.startRun('test-run');
      
      // Should handle error gracefully
      expect(run).toBeDefined(); // May return null or error object
    });

    test('should handle API errors gracefully', async () => {
      service.useRestAPI = true;
      service.initialized = true;

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const run = await service.startRun('test-run');
      
      // Should handle error gracefully
      expect(run).toBeDefined();
    });
  });
});

