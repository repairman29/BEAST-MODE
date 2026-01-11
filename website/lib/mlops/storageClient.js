/**
 * ML Storage Client
 * Utility for accessing ML artifacts from Supabase Storage
 * 
 * Provides: download, list, check existence, with local fallback
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'ml-artifacts';

class MLStorageClient {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  /**
   * Initialize Supabase client
   */
  async initialize() {
    if (this.initialized) return;

    // Try to load env from website/.env.local
    const path = require('path');
    const envPath = path.join(__dirname, '../../website/.env.local');
    if (require('fs').existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[ML Storage] Supabase credentials not found - Storage features disabled');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initialized = true;
  }

  /**
   * Download file from Storage to local path
   * @param {string} storagePath - Path in Storage (e.g., 'training-data/file.json')
   * @param {string} localPath - Local file path to save to
   * @returns {Promise<boolean>} Success
   */
  async downloadFile(storagePath, localPath) {
    await this.initialize();
    if (!this.supabase) return false;

    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .download(storagePath);

      if (error) {
        console.warn(`[ML Storage] Download failed: ${storagePath} - ${error.message}`);
        return false;
      }

      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert blob to buffer and save
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(localPath, buffer);
      
      return true;
    } catch (error) {
      console.warn(`[ML Storage] Download error: ${error.message}`);
      return false;
    }
  }

  /**
   * Load JSON file from Storage (downloads to temp, reads, deletes)
   * @param {string} storagePath - Path in Storage
   * @returns {Promise<object|null>} Parsed JSON or null
   */
  async loadJSON(storagePath) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .download(storagePath);

      if (error) {
        return null;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return JSON.parse(buffer.toString('utf8'));
    } catch (error) {
      console.warn(`[ML Storage] Load JSON error: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if file exists in Storage
   * @param {string} storagePath - Path in Storage
   * @returns {Promise<boolean>}
   */
  async fileExists(storagePath) {
    await this.initialize();
    if (!this.supabase) return false;

    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .list(path.dirname(storagePath) || '', {
          search: path.basename(storagePath)
        });

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param {string} storagePath - Path in Storage
   * @returns {Promise<number|null>} File size in bytes, or null if not found
   */
  async getFileSize(storagePath) {
    await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .list(path.dirname(storagePath) || '', {
          search: path.basename(storagePath)
        });

      if (error || !data || data.length === 0) return null;
      return data[0].metadata?.size || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * List files in Storage folder
   * @param {string} folder - Folder path (e.g., 'training-data')
   * @returns {Promise<Array>} List of file names
   */
  async listFiles(folder = '') {
    await this.initialize();
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .list(folder, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.warn(`[ML Storage] List error: ${error.message}`);
        return [];
      }

      return (data || []).map(file => ({
        name: file.name,
        path: folder ? `${folder}/${file.name}` : file.name,
        size: file.metadata?.size || 0,
        created: file.created_at
      }));
    } catch (error) {
      console.warn(`[ML Storage] List error: ${error.message}`);
      return [];
    }
  }

  /**
   * Load file with fallback: Storage → Local
   * @param {string} storagePath - Path in Storage
   * @param {string} localPath - Local fallback path
   * @returns {Promise<object|null>} Parsed JSON or null
   */
  async loadWithFallback(storagePath, localPath) {
    // Try Storage first
    const storageData = await this.loadJSON(storagePath);
    if (storageData) {
      console.log(`[ML Storage] Loaded from Storage: ${storagePath}`);
      return storageData;
    }

    // Fallback to local
    if (fs.existsSync(localPath)) {
      console.log(`[ML Storage] Loaded from local: ${localPath}`);
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    }

    return null;
  }

  /**
   * Get latest file matching pattern
   * @param {string} folder - Folder in Storage
   * @param {string} pattern - Filename pattern (e.g., 'enhanced-features-*.json')
   * @returns {Promise<string|null>} Storage path or null
   */
  async getLatestFile(folder, pattern) {
    const files = await this.listFiles(folder);
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    const matching = files
      .filter(f => regex.test(f.name))
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    return matching.length > 0 ? matching[0].path : null;
  }
}

// Singleton instance
let storageClientInstance = null;

function getMLStorageClient() {
  if (!storageClientInstance) {
    storageClientInstance = new MLStorageClient();
  }
  return storageClientInstance;
}

module.exports = {
  MLStorageClient,
  getMLStorageClient
};

