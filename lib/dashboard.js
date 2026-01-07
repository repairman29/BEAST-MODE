/**
 * BEAST MODE Dashboard
 * Local dashboard server for quality intelligence
 */

const path = require('path');
const { createLogger } = require('./utils/logger');
const log = createLogger('dashboard');

// Lazy load express to avoid debug module issues
let express;
function getExpress() {
  if (!express) {
    try {
      express = require('express');
    } catch (error) {
      log.warn('Express not available, dashboard will use minimal server');
      return null;
    }
  }
  return express;
}

/**
 * Start BEAST MODE Dashboard server
 */
async function startDashboard(options = {}) {
  const port = options.port || 3001;
  const Express = getExpress();
  
  if (!Express) {
    throw new Error('Express is required for dashboard. Install with: npm install express');
  }
  
  const app = Express();

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../website/public')));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'BEAST MODE Dashboard' });
  });

  app.get('/api/quality', async (req, res) => {
    try {
      const { getQualityMetrics } = require('./quality');
      const metrics = await getQualityMetrics();
      res.json(metrics);
    } catch (error) {
      log.error('Failed to get quality metrics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve dashboard HTML
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BEAST MODE Dashboard</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              max-width: 600px;
              padding: 2rem;
            }
            h1 { font-size: 3rem; margin-bottom: 1rem; }
            p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
            .link {
              display: inline-block;
              padding: 1rem 2rem;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 0.5rem;
            }
            .link:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🧠 BEAST MODE</h1>
            <p>Enterprise Quality Intelligence Dashboard</p>
            <a href="https://beastmode.dev/dashboard" class="link" target="_blank">
              Open Full Dashboard →
            </a>
            <br>
            <a href="/api/health" class="link">API Health Check</a>
            <a href="/api/quality" class="link">Quality Metrics</a>
          </div>
        </body>
      </html>
    `);
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
        return;
      }
      log.info(`BEAST MODE Dashboard running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

module.exports = { startDashboard };

