/**
 * BEAST MODE Marketplace
 * Unified marketplace interface for plugins, integrations, and tools
 */

const { PluginMarketplace } = require('./plugin-marketplace');
const { IntegrationMarketplace } = require('./integration-marketplace');
const { ToolDiscovery } = require('./tool-discovery');
const { MonetizationPrograms } = require('./monetization-programs');
const { createLogger } = require('../utils/logger');

const log = createLogger('marketplace');

let pluginMarketplaceInstance = null;
let integrationMarketplaceInstance = null;
let toolDiscoveryInstance = null;
let monetizationInstance = null;

/**
 * Get or create Plugin Marketplace instance
 */
async function getPluginMarketplace() {
  if (!pluginMarketplaceInstance) {
    pluginMarketplaceInstance = new PluginMarketplace();
    await pluginMarketplaceInstance.initialize();
  }
  return pluginMarketplaceInstance;
}

/**
 * Get or create Integration Marketplace instance
 */
async function getIntegrationMarketplace() {
  if (!integrationMarketplaceInstance) {
    integrationMarketplaceInstance = new IntegrationMarketplace();
    await integrationMarketplaceInstance.initialize();
  }
  return integrationMarketplaceInstance;
}

/**
 * Get or create Tool Discovery instance
 */
async function getToolDiscovery() {
  if (!toolDiscoveryInstance) {
    toolDiscoveryInstance = new ToolDiscovery();
    await toolDiscoveryInstance.initialize();
  }
  return toolDiscoveryInstance;
}

/**
 * Get or create Monetization Programs instance
 */
async function getMonetizationPrograms() {
  if (!monetizationInstance) {
    monetizationInstance = new MonetizationPrograms();
    await monetizationInstance.initialize();
  }
  return monetizationInstance;
}

/**
 * Browse marketplace (plugins, integrations, or tools)
 */
async function browseMarketplace(options = {}) {
  const { type = 'plugin', category, search } = options;

  try {
    if (type === 'plugin') {
      const marketplace = await getPluginMarketplace();
      if (search) {
        return marketplace.searchPlugins(search, { category });
      }
      return await marketplace.discoverPlugins({ category });
    } else if (type === 'integration') {
      const marketplace = await getIntegrationMarketplace();
      return await marketplace.discoverIntegrations({ category, search });
    } else if (type === 'tool') {
      const discovery = await getToolDiscovery();
      return await discovery.discoverTools({ category, search });
    }

    throw new Error(`Unknown marketplace type: ${type}`);
  } catch (error) {
    log.error('Failed to browse marketplace:', error);
    throw error;
  }
}

/**
 * Install from marketplace
 */
async function installFromMarketplace(id, options = {}) {
  const { type = 'plugin' } = options;

  try {
    if (type === 'plugin') {
      const marketplace = await getPluginMarketplace();
      return await marketplace.installPlugin(id, options);
    } else if (type === 'integration') {
      const marketplace = await getIntegrationMarketplace();
      return await marketplace.installIntegration(id, options);
    }

    throw new Error(`Unknown marketplace type: ${type}`);
  } catch (error) {
    log.error(`Failed to install ${type} ${id}:`, error);
    throw error;
  }
}

/**
 * Publish to marketplace
 */
async function publishToMarketplace(packagePath, options = {}) {
  const { type = 'plugin', price = 0 } = options;

  try {
    if (type === 'plugin') {
      const marketplace = await getPluginMarketplace();
      const pluginData = await require('fs').promises.readJSON(packagePath);
      return await marketplace.publishPlugin(pluginData, { price, ...options });
    } else if (type === 'integration') {
      const marketplace = await getIntegrationMarketplace();
      const integrationData = await require('fs').promises.readJSON(packagePath);
      return await marketplace.publishIntegration(integrationData, { price, ...options });
    }

    throw new Error(`Unknown marketplace type: ${type}`);
  } catch (error) {
    log.error(`Failed to publish ${type}:`, error);
    throw error;
  }
}

module.exports = {
  browseMarketplace,
  installFromMarketplace,
  publishToMarketplace,
  getPluginMarketplace,
  getIntegrationMarketplace,
  getToolDiscovery,
  getMonetizationPrograms
};

