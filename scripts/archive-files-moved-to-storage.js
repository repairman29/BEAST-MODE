#!/usr/bin/env node

/**
 * Archive Files Moved to Storage
 * Verifies files exist in Storage, then archives local copies
 * 
 * Usage:
 *   node scripts/archive-files-moved-to-storage.js --dry-run
 *   node scripts/archive-files-moved-to-storage.js --archive
 *   node scripts/archive-files-moved-to-storage.js --remove
 */

const fs = require('fs');
const path = require('path');
const { getMLStorageClient } = require('../lib/mlops/storageClient');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const BEAST_MODE_DIR = path.join(__dirname, '..');
const ARCHIVE_DIR = path.join(BEAST_MODE_DIR, '.beast-mode/archive');
const BUCKET_NAME = 'ml-artifacts';

// Files that were uploaded to Storage
const UPLOADED_FILES = {
  'training-data': [
    'enhanced-features-2026-01-06T02-53-58-291Z.json',
    'enhanced-features-2026-01-06T02-54-15-865Z.json',
    'enhanced-features-2026-01-06T05-13-48-424Z.json',
    'high-quality-repos-analysis.json',
    'scanned-repos-2026-01-05T16-59-19-258Z.json',
    'scanned-repos-2026-01-05T18-23-20-808Z.json',
    'scanned-repos-lower-quality-2026-01-06T17-17-57-389Z.json',
    'scanned-repos-lower-quality-2026-01-06T20-50-46-094Z.json',
    'scanned-repos-missing-languages-2026-01-06T04-03-51-428Z.json',
    'scanned-repos-notable-2026-01-05T23-39-47.json',
    'high-value-repos-2026-01-05T15-15-45-679Z.json',
    'high-value-repos-2026-01-05T15-16-54-570Z.json',
    'high-value-repos-diverse-2026-01-05T18-01-14-901Z.json',
    'lower-quality-repos-2026-01-06T17-00-36-521Z.json',
    'lower-quality-repos-2026-01-06T20-32-29-533Z.json',
    'notable-repos-2026-01-05T19-32-51.json'
  ],
  'models': [
    'model-notable-quality-2026-01-05T21-01-16.json',
    'model-notable-quality-2026-01-06T01-48-25.json',
    'model-notable-quality-2026-01-06T03-27-22.json',
    'model-notable-quality-2026-01-07T00-11-13.json'
  ],
  'oracle': [
    'oracle-embeddings.json',
    'oracle_manifest.json'
  ],
  'audit': [
    'exports/export-2026-01-06T02-52-28-614Z.json',
    'logs/audit-2026-01-05.jsonl',
    'logs/audit-2026-01-06.jsonl'
  ]
};

// Local file paths
const LOCAL_PATHS = {
  'training-data': {
    base: path.join(BEAST_MODE_DIR, '.beast-mode/training-data'),
    subdirs: {
      'scanned-repos': 'scanned-repos',
      'discovered-repos': 'discovered-repos'
    }
  },
  'models': {
    base: path.join(BEAST_MODE_DIR, '.beast-mode/models')
  },
  'oracle': {
    base: path.join(__dirname, '../../smuggler-oracle/data')
  },
  'audit': {
    base: path.join(BEAST_MODE_DIR, '.beast-mode/audit'),
    subdirs: {
      'exports': '',
      'logs': ''
    }
  }
};

class FileArchiver {
  constructor() {
    this.storage = getMLStorageClient();
    this.dryRun = process.argv.includes('--dry-run');
    this.archive = process.argv.includes('--archive');
    this.remove = process.argv.includes('--remove');
    this.archived = [];
    this.failed = [];
    this.notFound = [];
  }

  log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', step: '📦' };
    const prefix = this.dryRun ? '[DRY RUN]' : '';
    console.log(`${icons[type] || '•'} ${prefix} ${message}`);
  }

  async verifyInStorage(storagePath) {
    return await this.storage.fileExists(storagePath);
  }

  getLocalPath(category, fileName) {
    const config = LOCAL_PATHS[category];
    if (!config) return null;

    // Check subdirectories
    if (config.subdirs) {
      for (const [subdir, subdirPath] of Object.entries(config.subdirs)) {
        if (fileName.includes(subdir) || fileName.startsWith(subdir)) {
          const fullPath = path.join(config.base, subdirPath || subdir, fileName);
          if (fs.existsSync(fullPath)) {
            return fullPath;
          }
        }
      }
    }

    // Check base directory
    const basePath = path.join(config.base, fileName);
    if (fs.existsSync(basePath)) {
      return basePath;
    }

    // For scanned-repos, check scanned-repos subdirectory
    if (category === 'training-data' && fileName.startsWith('scanned-repos-')) {
      const scannedPath = path.join(config.base, 'scanned-repos', fileName);
      if (fs.existsSync(scannedPath)) {
        return scannedPath;
      }
    }

    // For discovered-repos, check discovered-repos subdirectory
    if (category === 'training-data' && (fileName.includes('high-value') || fileName.includes('notable') || fileName.includes('lower-quality'))) {
      const discoveredPath = path.join(config.base, 'discovered-repos', fileName);
      if (fs.existsSync(discoveredPath)) {
        return discoveredPath;
      }
    }

    // For audit exports
    if (category === 'audit' && fileName.startsWith('export-')) {
      const exportPath = path.join(config.base, fileName);
      if (fs.existsSync(exportPath)) {
        return exportPath;
      }
    }

    // For audit logs
    if (category === 'audit' && fileName.startsWith('audit-')) {
      const logPath = path.join(config.base, fileName);
      if (fs.existsSync(logPath)) {
        return logPath;
      }
    }

    return null;
  }

  async archiveFile(category, fileName) {
    // Handle subdirectory paths (e.g., 'exports/file.json' or 'logs/file.jsonl')
    const storagePath = fileName.includes('/') 
      ? `${category}/${fileName}` 
      : `${category}/${fileName}`;
    
    // Extract just the filename for local lookup
    const fileNameOnly = fileName.includes('/') ? fileName.split('/').pop() : fileName;
    const localPath = this.getLocalPath(category, fileNameOnly);

    if (!localPath) {
      this.notFound.push({ category, fileName, reason: 'Local file not found' });
      return false;
    }

    // Verify in Storage
    const inStorage = await this.verifyInStorage(storagePath);
    if (!inStorage) {
      this.failed.push({ category, fileName, reason: 'Not found in Storage' });
      return false;
    }

    // Archive file - preserve subdirectory structure
    const archiveCategoryDir = path.join(ARCHIVE_DIR, category);
    
    // If fileName has subdirectory (e.g., 'exports/file.json'), preserve it
    let archivePath;
    if (fileName.includes('/')) {
      const [subdir, ...rest] = fileName.split('/');
      const archiveSubdir = path.join(archiveCategoryDir, subdir);
      archivePath = path.join(archiveSubdir, rest.join('/'));
    } else {
      archivePath = path.join(archiveCategoryDir, fileName);
    }

    if (this.dryRun) {
      this.log(`Would archive: ${localPath} → ${archivePath}`, 'step');
      this.archived.push({ category, fileName, localPath, archivePath });
      return true;
    }

    if (this.archive) {
      // Create archive directory (including subdirectories)
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Copy to archive
      fs.copyFileSync(localPath, archivePath);
      this.log(`Archived: ${fileName}`, 'success');
      this.archived.push({ category, fileName, localPath, archivePath });

      // Remove if requested
      if (this.remove) {
        fs.unlinkSync(localPath);
        this.log(`Removed: ${localPath}`, 'success');
      }
    }

    return true;
  }

  async archiveAll() {
    console.log('📦 Archiving Files Moved to Storage\n');
    console.log('═══════════════════════════════════════════════════════\n');

    if (this.dryRun) {
      this.log('DRY RUN MODE - No files will be archived', 'warning');
    } else if (this.archive) {
      this.log('ARCHIVE MODE - Files will be copied to archive', 'info');
      if (this.remove) {
        this.log('REMOVE MODE - Local files will be deleted after archiving', 'warning');
      }
    } else {
      this.log('No action specified. Use --archive or --remove', 'warning');
      return;
    }

    // Process each category
    for (const [category, files] of Object.entries(UPLOADED_FILES)) {
      this.log(`\n📁 Processing ${category}...`, 'info');
      
      for (const fileName of files) {
        await this.archiveFile(category, fileName);
      }
    }

    // Summary
    console.log('\n📊 Archive Summary:');
    console.log('═══════════════════════════════════════════════════════');
    this.log(`✅ Archived: ${this.archived.length}`, 'success');
    this.log(`❌ Failed: ${this.failed.length}`, this.failed.length > 0 ? 'error' : 'info');
    this.log(`⚠️  Not Found: ${this.notFound.length}`, this.notFound.length > 0 ? 'warning' : 'info');

    if (this.failed.length > 0) {
      console.log('\n❌ Failed to archive (not in Storage):');
      this.failed.forEach(({ fileName, reason }) => {
        this.log(`  ${fileName}: ${reason}`, 'error');
      });
    }

    if (this.notFound.length > 0) {
      console.log('\n⚠️  Local files not found:');
      this.notFound.forEach(({ fileName, reason }) => {
        this.log(`  ${fileName}: ${reason}`, 'warning');
      });
    }

    if (this.archived.length > 0 && !this.dryRun) {
      // Create manifest
      const manifestPath = path.join(ARCHIVE_DIR, 'ARCHIVED_MANIFEST.json');
      const manifest = {
        archivedAt: new Date().toISOString(),
        reason: 'Files moved to Supabase Storage (ml-artifacts bucket)',
        totalFiles: this.archived.length,
        files: this.archived.map(({ category, fileName, localPath, archivePath }) => ({
          category,
          fileName,
          localPath,
          archivePath,
          storagePath: `${category}/${fileName}`
        }))
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      this.log(`\n📄 Manifest created: ${manifestPath}`, 'success');
    }

    console.log('\n✅ Archive complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const archiver = new FileArchiver();
  archiver.archiveAll().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { FileArchiver };

