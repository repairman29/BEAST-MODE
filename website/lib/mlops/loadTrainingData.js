/**
 * Load Training Data with Storage Support
 * Smart loader that checks Storage first, falls back to local
 * 
 * Usage:
 *   const { loadTrainingData } = require('./lib/mlops/loadTrainingData');
 *   const data = await loadTrainingData('enhanced-features', 'training-data');
 */

const fs = require('fs');
const path = require('path');
const { getMLStorageClient } = require('./storageClient');

// Load env if available
const envPath = path.join(__dirname, '../../website/.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const BEAST_MODE_DIR = path.join(__dirname, '../../');
const TRAINING_DATA_DIR = path.join(BEAST_MODE_DIR, '.beast-mode/training-data');

/**
 * Load training data file
 * @param {string} fileName - Filename or pattern (e.g., 'enhanced-features' or 'enhanced-features-*.json')
 * @param {string} folder - Storage folder (default: 'training-data')
 * @param {string} localDir - Local directory (default: TRAINING_DATA_DIR)
 * @returns {Promise<object|null>} Parsed data or null
 */
async function loadTrainingData(fileName, folder = 'training-data', localDir = TRAINING_DATA_DIR) {
  const storage = getMLStorageClient();

  // Try Storage first
  if (fileName.includes('*')) {
    // Pattern matching - get latest
    const storagePath = await storage.getLatestFile(folder, fileName);
    if (storagePath) {
      const data = await storage.loadJSON(storagePath);
      if (data) {
        console.log(`✅ Loaded from Storage: ${storagePath}`);
        return data;
      }
    }
  } else {
    // Exact filename
    const storagePath = `${folder}/${fileName}`;
    const data = await storage.loadJSON(storagePath);
    if (data) {
      console.log(`✅ Loaded from Storage: ${storagePath}`);
      return data;
    }
  }

  // Fallback to local
  const localPath = path.join(localDir, fileName.replace('*.json', ''));
  
  // If pattern, find latest local file
  if (fileName.includes('*')) {
    const pattern = fileName.replace('*', '');
    const files = fs.readdirSync(localDir)
      .filter(f => f.includes(pattern) && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      const filePath = path.join(localDir, files[0]);
      console.log(`✅ Loaded from local: ${files[0]}`);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } else if (fs.existsSync(localPath)) {
    console.log(`✅ Loaded from local: ${fileName}`);
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }

  console.warn(`⚠️  File not found: ${fileName}`);
  return null;
}

/**
 * Load scanned repos (combines multiple files)
 * @param {object} options - Options
 * @returns {Promise<Array>} Array of repos
 */
async function loadScannedRepos(options = {}) {
  const { fromStorage = true, maxFiles = 10 } = options;
  const repos = [];
  const seenRepos = new Set();

  if (fromStorage) {
    // Try Storage first
    const storage = getMLStorageClient();
    const files = await storage.listFiles('training-data');
    const scannedFiles = files
      .filter(f => f.name.startsWith('scanned-repos-') && f.name.endsWith('.json'))
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, maxFiles);

    for (const file of scannedFiles) {
      const data = await storage.loadJSON(file.path);
      if (data && data.trainingData) {
        for (const repo of data.trainingData) {
          const key = repo.repo || repo.url || JSON.stringify(repo.features || {});
          if (!seenRepos.has(key)) {
            seenRepos.add(key);
            repos.push(repo);
          }
        }
      }
    }

    if (repos.length > 0) {
      console.log(`✅ Loaded ${repos.length} repos from Storage`);
      return repos;
    }
  }

  // Fallback to local
  const scannedDir = path.join(TRAINING_DATA_DIR, 'scanned-repos');
  if (!fs.existsSync(scannedDir)) {
    return repos;
  }

  const files = fs.readdirSync(scannedDir)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, maxFiles);

  for (const file of files) {
    const filePath = path.join(scannedDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.trainingData) {
      for (const repo of data.trainingData) {
        const key = repo.repo || repo.url || JSON.stringify(repo.features || {});
        if (!seenRepos.has(key)) {
          seenRepos.add(key);
          repos.push(repo);
        }
      }
    }
  }

  console.log(`✅ Loaded ${repos.length} repos from local`);
  return repos;
}

/**
 * Load model from Storage or local
 * @param {string} modelName - Model name or pattern
 * @returns {Promise<object|null>} Model data or null
 */
async function loadModel(modelName) {
  const storage = getMLStorageClient();
  const modelsDir = path.join(BEAST_MODE_DIR, '.beast-mode/models');

  // Try Storage
  if (modelName.includes('*')) {
    const storagePath = await storage.getLatestFile('models', modelName);
    if (storagePath) {
      const data = await storage.loadJSON(storagePath);
      if (data) {
        console.log(`✅ Loaded model from Storage: ${storagePath}`);
        return data;
      }
    }
  } else {
    const storagePath = `models/${modelName}`;
    const data = await storage.loadJSON(storagePath);
    if (data) {
      console.log(`✅ Loaded model from Storage: ${storagePath}`);
      return data;
    }
  }

  // Fallback to local
  if (modelName.includes('*')) {
    const pattern = modelName.replace('*', '');
    const files = fs.readdirSync(modelsDir)
      .filter(f => f.includes(pattern) && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      const filePath = path.join(modelsDir, files[0]);
      console.log(`✅ Loaded model from local: ${files[0]}`);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } else if (fs.existsSync(path.join(modelsDir, modelName))) {
    console.log(`✅ Loaded model from local: ${modelName}`);
    return JSON.parse(fs.readFileSync(path.join(modelsDir, modelName), 'utf8'));
  }

  return null;
}

module.exports = {
  loadTrainingData,
  loadScannedRepos,
  loadModel
};

