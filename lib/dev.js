/**
 * BEAST MODE Development Tools
 * Development server and testing utilities
 */

const { spawn } = require('child_process');
const path = require('path');
const { createLogger } = require('./utils/logger');
const log = createLogger('dev');

// Lazy load express to avoid debug module issues
let express;
function getExpress() {
  if (!express) {
    try {
      express = require('express');
    } catch (error) {
      log.warn('Express not available, dev server will use minimal server');
      return null;
    }
  }
  return express;
}

/**
 * Start BEAST MODE development server
 */
async function startDevServer(options = {}) {
  const port = options.port || 3000;
  const Express = getExpress();
  
  if (!Express) {
    throw new Error('Express is required for dev server. Install with: npm install express');
  }
  
  const app = Express();

  app.use(express.json());

  app.get('/api/status', (req, res) => {
    res.json({
      status: 'running',
      service: 'BEAST MODE Dev Server',
      port,
      timestamp: new Date().toISOString()
    });
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
        return;
      }
      log.info(`BEAST MODE Dev Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

/**
 * Run BEAST MODE test suite
 */
async function runTests(options = {}) {
  const { watch = false, coverage = false } = options;
  
  return new Promise((resolve, reject) => {
    const args = ['test'];
    if (watch) args.push('--watch');
    if (coverage) args.push('--coverage');

    const testProcess = spawn('npm', ['run', 'test', ...args], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = { startDevServer, runTests };

