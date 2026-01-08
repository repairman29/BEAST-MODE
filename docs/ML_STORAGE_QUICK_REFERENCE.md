# ML Storage Quick Reference
## For AI Agents - One-Page Cheat Sheet

**Storage Bucket:** `ml-artifacts`  
**Pattern:** Storage-first with local fallback

---

## 🚀 Quick Start

```javascript
const { loadTrainingData, loadScannedRepos, loadModel } = require('../lib/mlops/loadTrainingData');

// Load training data
const data = await loadTrainingData('enhanced-features-*.json', 'training-data');

// Load scanned repos
const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 10 });

// Load model
const model = await loadModel('model-notable-quality-*.json');
```

---

## 📁 Storage Structure

```
ml-artifacts/
├── training-data/     # Enhanced features, scanned repos, discovered repos
├── models/            # ML model files
├── catalogs/          # Repository catalogs
├── oracle/            # Oracle embeddings & manifest
└── audit/             # Audit exports & logs
```

---

## 🔧 Common Patterns

### Load Latest File
```javascript
// Pattern matching gets latest automatically
const data = await loadTrainingData('enhanced-features-*.json');
```

### Load Specific File
```javascript
// Exact filename
const data = await loadTrainingData('high-quality-repos-analysis.json');
```

### Combine Multiple Files
```javascript
// Automatically combines and deduplicates
const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 5 });
```

### Direct Storage Access
```javascript
const { getMLStorageClient } = require('../lib/mlops/storageClient');
const storage = getMLStorageClient();

// List files
const files = await storage.listFiles('training-data');

// Load JSON
const data = await storage.loadJSON('training-data/file.json');

// Download file
await storage.downloadFile('training-data/file.json', './local.json');
```

---

## ✅ Rules

1. **Always use Storage-first** - `loadTrainingData()` not `fs.readFileSync()`
2. **Use pattern matching** - `*.json` for latest files
3. **Handle null** - Files might not exist
4. **Storage for large files** - Database (JSONB) for predictions

---

## 📚 Documentation

- **Expert Guide:** `docs/ML_STORAGE_EXPERT_GUIDE.md`
- **Strategy:** `docs/ML_STORAGE_STRATEGY.md`
- **Implementation:** `docs/ML_STORAGE_IMPLEMENTATION.md`
- **.cursorrules:** `ml_storage` section

---

**Status:** ✅ Ready to Use


