# ML Storage Expert Guide
## Complete Guide for AI Agents - Storage-First ML Data Access

**Date:** January 6, 2026  
**Status:** ✅ **Production Ready**  
**Purpose:** Enable AI agents to efficiently access ML artifacts from Supabase Storage

---

## 🎯 Quick Start

### The Pattern: Storage-First with Local Fallback

```javascript
const { loadTrainingData, loadScannedRepos, loadModel } = require('../lib/mlops/loadTrainingData');

// Load training data (checks Storage first, then local)
const data = await loadTrainingData('enhanced-features-*.json', 'training-data');

// Load scanned repos (combines from Storage or local)
const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 10 });

// Load model (checks Storage first, then local)
const model = await loadModel('model-notable-quality-*.json');
```

---

## 📚 Storage Client API

### Basic Operations

```javascript
const { getMLStorageClient } = require('../lib/mlops/storageClient');
const storage = getMLStorageClient();

// Download file
await storage.downloadFile('training-data/file.json', './local-file.json');

// Load JSON directly (no local file)
const data = await storage.loadJSON('training-data/file.json');

// Check if file exists
const exists = await storage.fileExists('training-data/file.json');

// List files in folder
const files = await storage.listFiles('training-data');

// Get latest file matching pattern
const latest = await storage.getLatestFile('training-data', 'enhanced-features-*.json');
```

---

## 🔧 Integration Patterns

### Pattern 1: Update Existing Training Scripts

**Before (Local Only):**
```javascript
const data = JSON.parse(fs.readFileSync('path/to/file.json', 'utf8'));
```

**After (Storage-First):**
```javascript
const { loadTrainingData } = require('../lib/mlops/loadTrainingData');
const data = await loadTrainingData('file.json', 'training-data', './path/to');
```

### Pattern 2: Load Scanned Repos

**Before:**
```javascript
function loadScannedRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-'))
    .sort()
    .reverse();
  // ... combine files
}
```

**After:**
```javascript
const { loadScannedRepos } = require('../lib/mlops/loadTrainingData');
const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 10 });
```

### Pattern 3: Load Models

**Before:**
```javascript
const modelPath = path.join(MODELS_DIR, 'model.json');
const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
```

**After:**
```javascript
const { loadModel } = require('../lib/mlops/loadTrainingData');
const model = await loadModel('model-notable-quality-*.json');
```

---

## 📁 Storage Structure

```
ml-artifacts/
├── training-data/
│   ├── enhanced-features-*.json (3-3.4MB)
│   ├── scanned-repos-*.json (358KB-1.3MB)
│   ├── discovered-repos/*.json (110KB-462KB)
│   └── high-quality-repos-analysis.json (172KB)
├── models/
│   └── model-notable-quality-*.json (623KB-1.7MB)
├── catalogs/
│   ├── COMPLETE_CATALOG_FIXED.json (5.5MB)
│   ├── TOP_REPOS_WITH_CODE.json (4.4MB)
│   └── COMPLETE_CATALOG.json (1.1MB)
├── oracle/
│   ├── oracle-embeddings.json (11MB)
│   └── oracle_manifest.json (3.6MB)
└── audit/
    ├── exports/ (1.3MB)
    └── logs/ (575KB-935KB)
```

---

## ✅ Best Practices

### 1. Always Use Storage-First Pattern

```javascript
// ✅ GOOD: Storage-first with fallback
const data = await loadTrainingData('file.json');

// ❌ BAD: Local-only
const data = JSON.parse(fs.readFileSync('file.json', 'utf8'));
```

### 2. Use Pattern Matching for Latest Files

```javascript
// ✅ GOOD: Gets latest automatically
const data = await loadTrainingData('enhanced-features-*.json');

// ❌ BAD: Hardcoded filename
const data = await loadTrainingData('enhanced-features-2026-01-06T05-13-48-424Z.json');
```

### 3. Handle Missing Files Gracefully

```javascript
// ✅ GOOD: Check for null
const data = await loadTrainingData('file.json');
if (!data) {
  console.error('File not found');
  return;
}

// ❌ BAD: Assume file exists
const data = await loadTrainingData('file.json');
console.log(data.trainingData.length); // Might crash!
```

---

## 🚀 Migration Checklist

When updating scripts to use Storage:

- [ ] Replace `fs.readFileSync` with `loadTrainingData`
- [ ] Replace local file loading with `loadScannedRepos`
- [ ] Replace model loading with `loadModel`
- [ ] Test with Storage available
- [ ] Test with Storage unavailable (fallback to local)
- [ ] Verify performance (Storage might be slower for large files)

---

## 📊 Performance Considerations

### Storage vs Local

- **Storage:** Network latency (~100-500ms), but centralized
- **Local:** Instant, but only on one machine
- **Recommendation:** Use Storage for production, local for development

### Caching Strategy

For frequently accessed files, consider:
1. Download to local cache on first access
2. Check cache before Storage
3. Invalidate cache when file updates

---

## 🔍 Troubleshooting

### Issue: "Supabase credentials not found"

**Solution:** Set environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: "File not found in Storage"

**Solution:** 
1. Check file was uploaded: `node scripts/upload-ml-artifacts-to-storage.js --dry-run`
2. Verify Storage path matches folder structure
3. Fallback to local should work automatically

### Issue: "Slow loading from Storage"

**Solution:**
1. Large files (>5MB) will be slower
2. Consider downloading to local cache
3. Use `downloadFile` for one-time downloads

---

## 📖 Related Documentation

- **Storage Strategy:** `docs/ML_STORAGE_STRATEGY.md`
- **Implementation:** `docs/ML_STORAGE_IMPLEMENTATION.md`
- **Upload Script:** `scripts/upload-ml-artifacts-to-storage.js`
- **Storage Client:** `lib/mlops/storageClient.js`
- **Load Utilities:** `lib/mlops/loadTrainingData.js`

---

**Status:** ✅ **READY FOR USE**  
**CLI/API-First:** ✅ **No UI Required!**  
**Storage-First:** ✅ **Automatic Fallback!**

