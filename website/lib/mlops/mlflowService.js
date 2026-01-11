/**
 * MLflow Service
 * Experiment tracking and model registry for ML training
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const log = createLogger('MLflowService');

class MLflowService {
  constructor() {
    this.mlflow = null;
    this.initialized = false;
    this.trackingUri = process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000';
    this.experimentName = process.env.MLFLOW_EXPERIMENT_NAME || 'beast-mode-ml';
  }

  /**
   * Initialize MLflow connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Try to import MLflow
      let mlflow;
      try {
        mlflow = require('mlflow');
      } catch (error) {
        // MLflow not installed - use REST API instead
        log.warn('MLflow package not installed, using REST API');
        this.useRestAPI = true;
        this.initialized = true;
        return;
      }

      this.mlflow = mlflow;
      this.mlflow.setTrackingUri(this.trackingUri);

      // Create or get experiment
      try {
        const experiment = await this.mlflow.getExperimentByName(this.experimentName);
        if (!experiment) {
          await this.mlflow.createExperiment(this.experimentName);
          log.info(`✅ Created MLflow experiment: ${this.experimentName}`);
        } else {
          log.info(`✅ Using MLflow experiment: ${this.experimentName}`);
        }
      } catch (error) {
        log.warn('MLflow server not available, will use REST API fallback:', error.message);
        this.useRestAPI = true;
      }

      this.initialized = true;
    } catch (error) {
      log.warn('MLflow initialization failed, using REST API fallback:', error.message);
      this.useRestAPI = true;
      this.initialized = true;
    }
  }

  /**
   * Start a new run
   */
  async startRun(runName = null, tags = {}) {
    await this.initialize();

    if (this.useRestAPI) {
      // Use REST API fallback
      return this.startRunRestAPI(runName, tags);
    }

    try {
      const run = await this.mlflow.startRun({
        experiment_name: this.experimentName,
        run_name: runName || `run-${Date.now()}`,
        tags: {
          ...tags,
          service: 'beast-mode',
          timestamp: new Date().toISOString()
        }
      });

      log.info(`✅ Started MLflow run: ${run.info.run_id}`);
      return run;
    } catch (error) {
      log.warn('MLflow startRun failed, using REST API:', error.message);
      return this.startRunRestAPI(runName, tags);
    }
  }

  /**
   * Start run using REST API
   */
  async startRunRestAPI(runName, tags) {
    const fetch = global.fetch || require('node-fetch');
    
    try {
      // Get experiment ID
      const expResponse = await fetch(`${this.trackingUri}/api/2.0/mlflow/experiments/get-by-name?experiment_name=${encodeURIComponent(this.experimentName)}`);
      let experimentId;
      
      if (expResponse.ok) {
        const expData = await expResponse.json();
        experimentId = expData.experiment.experiment_id;
      } else {
        // Create experiment
        const createResponse = await fetch(`${this.trackingUri}/api/2.0/mlflow/experiments/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.experimentName })
        });
        const createData = await createResponse.json();
        experimentId = createData.experiment_id;
      }

      // Create run
      const runResponse = await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_id: experimentId,
          start_time: Date.now(),
          run_name: runName || `run-${Date.now()}`,
          tags: Object.entries(tags).map(([key, value]) => ({ key, value: String(value) }))
        })
      });

      if (runResponse.ok) {
        const runData = await runResponse.json();
        log.info(`✅ Started MLflow run (REST API): ${runData.run.info.run_id}`);
        return { info: { run_id: runData.run.info.run_id } };
      } else {
        log.warn('MLflow REST API not available, tracking disabled');
        return { info: { run_id: `local-${Date.now()}` } };
      }
    } catch (error) {
      log.warn('MLflow REST API failed, tracking disabled:', error.message);
      return { info: { run_id: `local-${Date.now()}` } };
    }
  }

  /**
   * Log metrics
   */
  async logMetric(runId, key, value, step = null) {
    await this.initialize();

    if (this.useRestAPI) {
      return this.logMetricRestAPI(runId, key, value, step);
    }

    try {
      await this.mlflow.logMetric(runId, key, value, step);
    } catch (error) {
      log.debug('MLflow logMetric failed:', error.message);
    }
  }

  /**
   * Log metric using REST API
   */
  async logMetricRestAPI(runId, key, value, step) {
    const fetch = global.fetch || require('node-fetch');
    
    try {
      await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/log-metric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          key,
          value: Number(value),
          timestamp: Date.now(),
          step: step || 0
        })
      });
    } catch (error) {
      // Silently fail - tracking is non-critical
    }
  }

  /**
   * Log parameters
   */
  async logParam(runId, key, value) {
    await this.initialize();

    if (this.useRestAPI) {
      return this.logParamRestAPI(runId, key, value);
    }

    try {
      await this.mlflow.logParam(runId, key, String(value));
    } catch (error) {
      log.debug('MLflow logParam failed:', error.message);
    }
  }

  /**
   * Log parameter using REST API
   */
  async logParamRestAPI(runId, key, value) {
    const fetch = global.fetch || require('node-fetch');
    
    try {
      await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/log-parameter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          key,
          value: String(value)
        })
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * End run
   */
  async endRun(runId, status = 'FINISHED') {
    await this.initialize();

    if (this.useRestAPI) {
      return this.endRunRestAPI(runId, status);
    }

    try {
      await this.mlflow.endRun(runId, status);
      log.info(`✅ Ended MLflow run: ${runId}`);
    } catch (error) {
      log.debug('MLflow endRun failed:', error.message);
    }
  }

  /**
   * End run using REST API
   */
  async endRunRestAPI(runId, status) {
    const fetch = global.fetch || require('node-fetch');
    
    try {
      await fetch(`${this.trackingUri}/api/2.0/mlflow/runs/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          status: status
        })
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Check if MLflow is available
   */
  isAvailable() {
    return this.initialized && (this.mlflow !== null || this.useRestAPI);
  }
}

// Singleton instance
let instance = null;

async function getMLflowService() {
  if (!instance) {
    instance = new MLflowService();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  MLflowService,
  getMLflowService
};
