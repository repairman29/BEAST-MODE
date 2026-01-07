/**
 * BEAST MODE Initialization
 * Sets up BEAST MODE in a project
 */

const fs = require('fs-extra');
const path = require('path');
const { createLogger } = require('./utils/logger');
const log = createLogger('init');

/**
 * Initialize BEAST MODE in current project
 */
async function initializeBEASTMODE(options = {}) {
  const { force = false, enterprise = false } = options;
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, '.beast-mode');
  const configFile = path.join(configPath, 'config.json');

  // Check if already initialized
  if (await fs.pathExists(configFile) && !force) {
    throw new Error('BEAST MODE is already initialized. Use --force to overwrite.');
  }

  log.info('Initializing BEAST MODE...');

  // Create .beast-mode directory
  await fs.ensureDir(configPath);
  await fs.ensureDir(path.join(configPath, 'data'));
  await fs.ensureDir(path.join(configPath, 'cache'));

  // Create configuration
  const config = {
    version: '1.0.0',
    initialized: new Date().toISOString(),
    enterprise: enterprise,
    features: {
      quality: true,
      marketplace: true,
      intelligence: true,
      deployments: true
    },
    integrations: {
      github: null,
      vercel: null,
      slack: null
    }
  };

  await fs.writeJSON(configFile, config, { spaces: 2 });

  // Create .gitignore entry if needed
  const gitignorePath = path.join(projectRoot, '.gitignore');
  let gitignore = '';
  if (await fs.pathExists(gitignorePath)) {
    gitignore = await fs.readFile(gitignorePath, 'utf-8');
  }

  if (!gitignore.includes('.beast-mode/data')) {
    gitignore += '\n# BEAST MODE\n.beast-mode/data\n.beast-mode/cache\n';
    await fs.writeFile(gitignorePath, gitignore);
  }

  // Create package.json script if needed
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJSON(packageJsonPath);
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    if (!packageJson.scripts['beast-mode']) {
      packageJson.scripts['beast-mode'] = 'beast-mode';
    }
    if (!packageJson.scripts['beast-mode:quality']) {
      packageJson.scripts['beast-mode:quality'] = 'beast-mode quality check';
    }
    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
  }

  log.info('✅ BEAST MODE initialized successfully!');
  log.info(`   Config: ${configFile}`);
  log.info('   Run "beast-mode quality check" to get started');

  return config;
}

module.exports = { initializeBEASTMODE };

