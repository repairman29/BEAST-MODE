#!/usr/bin/env node

/**
 * Service Manager
 * Monitors and manages all ML services
 * Provides REST API for service control
 */

const express = require('express');
const { startAllServices, stopAllServices, startService, stopService, SERVICES } = require('./start-all-services');
const { getServiceDiscovery } = require('../lib/mlops/serviceDiscovery');

const app = express();
app.use(express.json());

const PORT = process.env.SERVICE_MANAGER_PORT || 3010;

// Initialize service discovery
let serviceDiscovery = null;
try {
  serviceDiscovery = getServiceDiscovery();
  serviceDiscovery.initialize();
} catch (error) {
  console.warn('Service discovery not available:', error.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'service-manager' });
});

// Get all service statuses
app.get('/api/services', async (req, res) => {
  try {
    const statuses = serviceDiscovery 
      ? serviceDiscovery.getAllServiceStatuses()
      : SERVICES.map(s => ({
          id: s.id,
          name: s.name,
          port: s.port,
          available: false,
          lastChecked: null
        }));

    res.json({
      services: statuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get service statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const stats = serviceDiscovery 
      ? serviceDiscovery.getStatistics()
      : { total: SERVICES.length, available: 0, unavailable: SERVICES.length };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start all services
app.post('/api/services/start-all', async (req, res) => {
  try {
    const results = await startAllServices();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop all services
app.post('/api/services/stop-all', async (req, res) => {
  try {
    await stopAllServices();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start specific service
app.post('/api/services/:serviceId/start', async (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const result = await startService(service);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop specific service
app.post('/api/services/:serviceId/stop', async (req, res) => {
  try {
    await stopService(req.params.serviceId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Service Manager running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/services`);
  console.log(`📈 Statistics: http://localhost:${PORT}/api/statistics`);
});

