# Additional Large Files for Supabase Storage
## Files That Should Be Moved to Storage

**Date:** January 6, 2026  
**Status:** 📋 **Recommendations**

---

## 🎯 Priority Files (Should Move to Storage)

### 1. **Oracle Embeddings** ⚠️ **HIGH PRIORITY**
- **File:** `smuggler-oracle/data/oracle-embeddings.json`
- **Size:** 11MB
- **Why:** Very large, ML-related embeddings data
- **Action:** Move to `ml-artifacts/oracle/`

### 2. **Oracle Manifest** ⚠️ **HIGH PRIORITY**
- **File:** `smuggler-oracle/data/oracle_manifest.json`
- **Size:** 3.6MB
- **Why:** Large manifest file, ML-related
- **Action:** Move to `ml-artifacts/oracle/`

### 3. **Large Scanned Repos Files** ⚠️ **MEDIUM PRIORITY**
- **Files:** Multiple files in `.beast-mode/training-data/scanned-repos/`
- **Sizes:** 358KB - 1.3MB each
- **Examples:**
  - `scanned-repos-notable-2026-01-05T23-39-47.json` (1.3MB)
  - `scanned-repos-2026-01-05T16-59-19-258Z.json` (1.0MB)
  - `scanned-repos-2026-01-05T18-23-20-808Z.json` (980KB)
  - `scanned-repos-lower-quality-2026-01-06T20-50-46-094Z.json` (650KB)
  - `scanned-repos-lower-quality-2026-01-06T17-17-57-389Z.json` (378KB)
  - `scanned-repos-missing-languages-2026-01-06T04-03-51-428Z.json` (358KB)
- **Why:** Training data, should be archived
- **Action:** Move to `ml-artifacts/training-data/scanned-repos/`

### 4. **Large Audit Exports** ⚠️ **MEDIUM PRIORITY**
- **Files:** Multiple files in `.beast-mode/audit/`
- **Sizes:** 269KB - 1.3MB each
- **Examples:**
  - `export-2026-01-06T02-52-28-614Z.json` (1.3MB)
  - `export-2026-01-05T17-21-09-582Z.json` (313KB)
  - `export-2026-01-05T17-20-30-800Z.json` (308KB)
  - `export-2026-01-05T17-19-38-915Z.json` (303KB)
  - Plus 8 more export files (269KB-298KB each)
- **Why:** Audit exports, should be archived
- **Action:** Move to `ml-artifacts/audit/exports/`

### 5. **Audit JSONL Files** ⚠️ **LOW PRIORITY**
- **Files:** 
  - `audit-2026-01-05.jsonl` (935KB)
  - `audit-2026-01-06.jsonl` (575KB)
- **Why:** Audit logs, could be archived
- **Action:** Move to `ml-artifacts/audit/logs/`

### 6. **Other Training Data** ⚠️ **LOW PRIORITY**
- **Files:**
  - `repo-graph.json` (748KB)
  - `data/training/quality.json` (571KB)
  - `training-data/discovered-repos/` files (110KB-462KB each)
- **Why:** Training/analysis data
- **Action:** Move to `ml-artifacts/training-data/` (various subfolders)

---

## 📊 Summary

| Category | Count | Total Size | Priority |
|----------|-------|------------|----------|
| Oracle Files | 2 | ~14.6MB | HIGH |
| Scanned Repos | 6+ | ~5MB | MEDIUM |
| Audit Exports | 12+ | ~4MB | MEDIUM |
| Audit Logs | 2 | ~1.5MB | LOW |
| Other Training | 5+ | ~2MB | LOW |
| **TOTAL** | **25+** | **~27MB** | |

---

## 🚀 Recommended Actions

### Immediate (High Priority)
1. Move Oracle embeddings (11MB) - **Biggest file!**
2. Move Oracle manifest (3.6MB)

### Soon (Medium Priority)
3. Archive large scanned repos files (>500KB)
4. Archive large audit exports (>500KB)

### Optional (Low Priority)
5. Archive audit JSONL files
6. Archive other training data files

---

## 📝 Implementation

Update the upload script to include these additional files:

```javascript
const FILES_TO_UPLOAD = {
  'training-data': [
    'enhanced-features-*.json',
    'scanned-repos/*.json',  // Add this
    'discovered-repos/*.json',  // Add this
    // ...
  ],
  'oracle': [  // New category
    'oracle-embeddings.json',
    'oracle_manifest.json'
  ],
  'audit': [  // New category
    'export-*.json',
    'audit-*.jsonl'
  ],
  // ...
};
```

---

## 💡 Decision Criteria

**Move to Storage if:**
- ✅ File size > 500KB
- ✅ ML/training data
- ✅ Archive/export files
- ✅ Not frequently accessed
- ✅ Historical data

**Keep Local if:**
- ❌ File size < 100KB
- ❌ Active development files
- ❌ Frequently accessed
- ❌ Configuration files

---

**Next Steps:**
1. Update upload script to include Oracle files
2. Update upload script to include scanned repos
3. Update upload script to include audit files
4. Run upload for additional files

