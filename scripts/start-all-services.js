#!/usr/bin/env node

/**
 * Unified Service Orchestrator
 * Starts all ML services together and monitors their health
 * 
 * Services:
 * - Code Roach (port 3007)
 * - Oracle (port 3006)
 * - Daisy Chain (port 3008)
 * - AI GM (port 4001)
 * - BEAST MODE (port 3000)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const SERVICES = [
  {
    name: 'Code Roach',
    id: 'code-roach',
    port: 3007,
    cwd: path.join(__dirname, '../../smuggler-code-roach'),
    command: 'npm',
    args: ['start'],
    healthUrl: 'http://localhost:3007/health',
    required: false
  },
  {
    name: 'Oracle',
    id: 'oracle',
    port: 3006,
    cwd: path.join(__dirname, '../../smuggler-oracle'),
    command: 'npm',
    args: ['start'],
    healthUrl: 'http://localhost:3006/health',
    required: false
  },
  {
    name: 'Daisy Chain',
    id: 'daisy-chain',
    port: 3008,
    cwd: path.join(__dirname, '../../smuggler-daisy-chain'),
    command: 'npm',
    args: ['start'],
    healthUrl: 'http://localhost:3008/health',
    required: false
  },
  {
    name: 'AI GM',
    id: 'ai-gm',
    port: 4001,
    cwd: path.join(__dirname, '../../smuggler-ai-gm'),
    command: 'npm',
    args: ['start'],
    env: { PORT: '4001' },
    healthUrl: 'http://localhost:4001/health',
    required: false
  }
];

const LOG_DIR = path.join(__dirname, '../logs');
const processes = new Map();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(service, message, color = 'reset') {
  const timestamp = new Date().toISOString();
  const prefix = service ? `[${service}]` : '[ORCHESTRATOR]';
  console.log(`${colors[color]}${prefix} ${message}${colors.reset}`);
}

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    // Log dir might already exist
  }
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

async function checkHealth(url, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function startService(service) {
  return new Promise(async (resolve, reject) => {
    // Check if port is available
    const portAvailable = await checkPort(service.port);
    if (!portAvailable) {
      log(service.name, `Port ${service.port} already in use`, 'yellow');
      // Try to use existing service
      const healthy = await checkHealth(service.healthUrl);
      if (healthy) {
        log(service.name, `Service already running and healthy`, 'green');
        resolve({ alreadyRunning: true });
        return;
      } else {
        log(service.name, `Port in use but service not healthy`, 'red');
        reject(new Error(`Port ${service.port} in use but service unhealthy`));
        return;
      }
    }

    // Check if service directory exists
    try {
      await fs.access(service.cwd);
    } catch (error) {
      log(service.name, `Service directory not found: ${service.cwd}`, 'yellow');
      resolve({ skipped: true, reason: 'directory-not-found' });
      return;
    }

    log(service.name, `Starting on port ${service.port}...`, 'cyan');

    const logFile = path.join(LOG_DIR, `${service.id}.log`);
    const logStream = await fs.open(logFile, 'w').then(f => f.createWriteStream());

    const env = {
      ...process.env,
      ...(service.env || {}),
      PORT: service.port.toString()
    };

    const proc = spawn(service.command, service.args, {
      cwd: service.cwd,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    // Log output
    proc.stdout.on('data', (data) => {
      logStream.write(data);
      log(service.name, data.toString().trim(), 'reset');
    });

    proc.stderr.on('data', (data) => {
      logStream.write(data);
      log(service.name, data.toString().trim(), 'yellow');
    });

    proc.on('error', (error) => {
      log(service.name, `Failed to start: ${error.message}`, 'red');
      logStream.end();
      reject(error);
    });

    proc.on('exit', (code) => {
      logStream.end();
      if (code !== 0 && code !== null) {
        log(service.name, `Exited with code ${code}`, 'red');
      }
      processes.delete(service.id);
    });

    processes.set(service.id, {
      process: proc,
      service: service,
      logStream: logStream,
      startTime: Date.now()
    });

    // Wait for service to be healthy
    log(service.name, `Waiting for health check...`, 'cyan');
    
    let healthy = false;
    for (let i = 0; i < 30; i++) { // Try for 30 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      healthy = await checkHealth(service.healthUrl, 2000);
      if (healthy) {
        log(service.name, `✅ Healthy!`, 'green');
        resolve({ started: true });
        return;
      }
    }

    if (!healthy) {
      log(service.name, `⚠️  Started but health check failed`, 'yellow');
      resolve({ started: true, unhealthy: true });
    } else {
      resolve({ started: true });
    }
  });
}

async function stopService(serviceId) {
  const procInfo = processes.get(serviceId);
  if (!procInfo) return;

  log(procInfo.service.name, 'Stopping...', 'yellow');
  
  return new Promise((resolve) => {
    procInfo.process.once('exit', () => {
      log(procInfo.service.name, 'Stopped', 'green');
      procInfo.logStream.end();
      processes.delete(serviceId);
      resolve();
    });

    procInfo.process.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (procInfo.process.killed === false) {
        procInfo.process.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

async function stopAllServices() {
  log(null, 'Stopping all services...', 'yellow');
  
  const stopPromises = Array.from(processes.keys()).map(id => stopService(id));
  await Promise.all(stopPromises);
  
  log(null, 'All services stopped', 'green');
}

async function startAllServices() {
  log(null, '🚀 Starting all ML services...', 'bright');
  log(null, '', 'reset');

  await ensureLogDir();

  const results = [];
  
  for (const service of SERVICES) {
    try {
      const result = await startService(service);
      results.push({ service: service.name, ...result });
      
      // Small delay between starts
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      log(service.name, `Failed: ${error.message}`, 'red');
      results.push({ 
        service: service.name, 
        failed: true, 
        error: error.message 
      });
      
      if (service.required) {
        log(null, `Required service ${service.name} failed to start!`, 'red');
        await stopAllServices();
        process.exit(1);
      }
    }
  }

  log(null, '', 'reset');
  log(null, '📊 Service Status:', 'bright');
  
  const started = results.filter(r => r.started || r.alreadyRunning).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => r.failed).length;
  
  results.forEach(result => {
    if (result.started || result.alreadyRunning) {
      log(result.service, '✅ Running', 'green');
    } else if (result.skipped) {
      log(result.service, `⏭️  Skipped (${result.reason})`, 'yellow');
    } else if (result.failed) {
      log(result.service, `❌ Failed: ${result.error}`, 'red');
    }
  });

  log(null, '', 'reset');
  log(null, `✅ ${started} services running, ${skipped} skipped, ${failed} failed`, 'green');
  log(null, `📝 Logs: ${LOG_DIR}`, 'cyan');
  log(null, '', 'reset');
  log(null, 'Services will continue running. Press Ctrl+C to stop all.', 'cyan');

  return results;
}

// Handle shutdown
process.on('SIGINT', async () => {
  log(null, '\n🛑 Shutting down...', 'yellow');
  await stopAllServices();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopAllServices();
  process.exit(0);
});

// Start if run directly
if (require.main === module) {
  startAllServices().catch(error => {
    log(null, `Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  startAllServices,
  stopAllServices,
  startService,
  stopService,
  SERVICES
};

