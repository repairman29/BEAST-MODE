# ML Storage Strategy
## When to Use Supabase Storage vs Database vs Local Files

**Date:** January 6, 2026  
**Status:** ✅ **Recommended Strategy**

---

## 📊 Storage Decision Matrix

### Use **Supabase Storage** (ml-artifacts bucket) for:

✅ **Large Training Datasets** (> 1MB)
- `enhanced-features-*.json` (3-3.4MB)
- `dataset.json`, `dataset-split.json` (> 100KB)
- Repository catalog files (1-5MB)
- Historical training data snapshots

✅ **Model Artifacts** (> 100KB)
- `model-notable-quality-*.json` (up to 1.7MB)
- Model version archives
- Model comparison snapshots

✅ **Large Analysis Files** (> 500KB)
- `high-quality-repos-analysis.json` (172KB)
- Export files from audits
- Batch processing results

**Why Storage?**
- Files are too large for JSONB columns (PostgreSQL has practical limits)
- Need versioning and backup
- Can be accessed via API without loading into memory
- Better for archival and long-term storage

---

### Use **Supabase Database** (JSONB columns) for:

✅ **ML Predictions** (current implementation)
- Individual predictions from services
- Context data (JSONB in `ml_predictions.context`)
- Feedback data
- Performance metrics

**Why Database?**
- Need querying (filter, aggregate, search)
- Real-time access
- Relationships with other tables
- Indexed for performance
- Small to medium size (< 1MB per record)

---

### Use **Local Files** (`.beast-mode/`) for:

✅ **Active Development**
- Files being actively generated/processed
- Temporary files during training
- Log files
- Cache files

✅ **Small Files** (< 100KB)
- Individual repo scans
- Small analysis results
- Configuration files

**Why Local?**
- Fast access during development
- No network latency
- Easy to iterate on
- Can be git-ignored

---

## 🗂️ Recommended Folder Structure in Storage

```
ml-artifacts/
├── training-data/
│   ├── enhanced-features-2026-01-06T05-13-48-424Z.json
│   ├── dataset.json
│   └── dataset-split.json
├── models/
│   ├── model-notable-quality-2026-01-06T20-26-17.json
│   └── model-notable-quality-2026-01-05T21-01-16.json
├── catalogs/
│   ├── COMPLETE_CATALOG.json
│   └── TOP_REPOS_WITH_CODE.json
└── exports/
    └── audit-2026-01-05.json
```

---

## 📝 Migration Plan

### Phase 1: Create Storage Bucket ✅
- [x] Create migration for `ml-artifacts` bucket
- [x] Create CLI script to apply migration (`scripts/apply-ml-storage-migration.js`)
- [ ] Apply migration to Supabase: `node scripts/apply-ml-storage-migration.js`
- [ ] Verify bucket exists and policies work

### Phase 2: Upload Large Files ✅
- [x] Create upload script (`scripts/upload-ml-artifacts-to-storage.js`)
- [ ] Upload training data files (> 1MB): `node scripts/upload-ml-artifacts-to-storage.js`
- [ ] Upload model files (> 500KB): `node scripts/upload-ml-artifacts-to-storage.js`
- [ ] Upload catalog files (> 1MB): `node scripts/upload-ml-artifacts-to-storage.js`
- [ ] Update code to read from Storage when needed

### Phase 3: Update Code References
- [ ] Update training scripts to check Storage first
- [ ] Update model loading to check Storage
- [ ] Add fallback to local files for development

### Phase 4: Cleanup
- [ ] Archive old local files
- [ ] Document Storage URLs in code
- [ ] Update `.gitignore` to exclude large files

---

## 💻 Code Examples

### Upload Large File to Storage

**✅ Automated Script Available:**
```bash
# Upload all large ML files automatically
node scripts/upload-ml-artifacts-to-storage.js

# Dry run (see what would be uploaded)
node scripts/upload-ml-artifacts-to-storage.js --dry-run

# Upload specific file
node scripts/upload-ml-artifacts-to-storage.js --file=path/to/file.json
```

**Manual Code Example:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadMLArtifact(filePath, folder = 'training-data') {
  const fileName = path.basename(filePath);
  const storagePath = `${folder}/${fileName}`;
  
  const fileContent = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from('ml-artifacts')
    .upload(storagePath, fileContent, {
      contentType: 'application/json',
      upsert: true // Overwrite if exists
    });
  
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  
  // Get signed URL for access
  const { data: urlData } = supabase.storage
    .from('ml-artifacts')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry
  
  return urlData?.signedUrl;
}
```

### Download from Storage

```javascript
async function downloadMLArtifact(storagePath, localPath) {
  const { data, error } = await supabase.storage
    .from('ml-artifacts')
    .download(storagePath);
  
  if (error) {
    console.error('Download error:', error);
    return false;
  }
  
  // Convert blob to buffer and save
  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
  return true;
}
```

### List Files in Storage

```javascript
async function listMLArtifacts(folder = '') {
  const { data, error } = await supabase.storage
    .from('ml-artifacts')
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) {
    console.error('List error:', error);
    return [];
  }
  
  return data;
}
```

---

## 🎯 Current File Recommendations

### Should Move to Storage:

1. **Training Data** (3-3.4MB each)
   - `enhanced-features-2026-01-06T05-13-48-424Z.json` → `training-data/`
   - `enhanced-features-2026-01-06T02-54-15-865Z.json` → `training-data/`
   - `enhanced-features-2026-01-06T02-53-58-291Z.json` → `training-data/`

2. **Large Models** (> 500KB)
   - `model-notable-quality-2026-01-05T21-01-16.json` (1.7MB) → `models/`
   - `model-notable-quality-2026-01-06T01-48-25.json` (648KB) → `models/`
   - `model-notable-quality-2026-01-06T03-27-22.json` (624KB) → `models/`

3. **Catalog Files** (1-5MB)
   - `COMPLETE_CATALOG_FIXED.json` (5.5MB) → `catalogs/`
   - `TOP_REPOS_WITH_CODE.json` (4.4MB) → `catalogs/`
   - `COMPLETE_CATALOG.json` (1.1MB) → `catalogs/`

### Keep in Database:

- All `ml_predictions` records (already there ✅)
- All `ml_feedback` records (already there ✅)
- All service-specific prediction tables (already there ✅)

### Keep Local (for now):

- Small model files (< 100KB) - active development
- Individual repo scans (< 100KB)
- Log files
- Cache files

---

## 📈 Benefits

1. **Scalability**: No size limits for large files
2. **Versioning**: Keep multiple versions of models/training data
3. **Backup**: Automatic backup via Supabase
4. **Access Control**: Service role only (private bucket)
5. **Performance**: Can stream large files without loading into memory
6. **Cost**: Storage is cheaper than database for large files

---

## ⚠️ Considerations

1. **File Size Limits**: 50MB per file (can be increased if needed)
2. **Access**: Service role only (no public URLs)
3. **Cost**: Storage costs scale with usage
4. **Migration**: Need to update code to read from Storage
5. **Local Development**: May want to keep local copies for speed

---

**Next Steps:**
1. ✅ Apply the migration: `node scripts/apply-ml-storage-migration.js`
   - Or manually: `cd BEAST-MODE-PRODUCT && supabase db push --linked --include-all --yes`
2. ✅ Upload files: `node scripts/upload-ml-artifacts-to-storage.js`
   - Dry run first: `node scripts/upload-ml-artifacts-to-storage.js --dry-run`
3. Update code to check Storage before local files
4. Document Storage URLs in code/config

**Quick Start:**
```bash
# 1. Apply migration (creates bucket)
cd BEAST-MODE-PRODUCT
node scripts/apply-ml-storage-migration.js

# 2. Upload files (dry run first)
node scripts/upload-ml-artifacts-to-storage.js --dry-run

# 3. Upload for real
node scripts/upload-ml-artifacts-to-storage.js
```

