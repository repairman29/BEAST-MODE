# Repository Scanning - Next Steps

## Current Status

The repository scanning process is **actively running** and will automatically:

1. ✅ **Scan 500 high-value repositories** (metadata only, no source code)
2. ✅ **Check for opt-outs** (`.ai_exclude` files)
3. ✅ **Extract enhanced features** (interaction, temporal, language, architecture, quality)
4. ✅ **Save training data** to `.beast-mode/training-data/scanned-repos/`

## What Happens When Scan Completes

### 1. **Training Data Saved**
- Location: `.beast-mode/training-data/scanned-repos/scanned-repos-{timestamp}.json`
- Contains: Enhanced features for each repository
- Format: JSON with metadata and training-ready features

### 2. **Next Steps (Automated or Manual)**

#### Option A: Automated Training Pipeline
```bash
cd BEAST-MODE-PRODUCT
npm run train:quality
```

This will:
- Load the scanned training data
- Combine with existing production predictions
- Train improved quality prediction models
- Save models for deployment

#### Option B: Manual Review & Training
```bash
# 1. Review the training data
cat .beast-mode/training-data/scanned-repos/scanned-repos-*.json | jq '.trainingData | length'

# 2. Check feature statistics
node scripts/monitor-scan-progress.js

# 3. Train models
npm run train:quality
```

#### Option C: Full ML Pipeline (Recommended)
```bash
# Run complete pipeline: scan → extract → train → deploy
node scripts/run-ml-pipeline-with-audit.js
```

This comprehensive script:
- ✅ Combines production predictions + GitHub code
- ✅ Trains improved models with new data
- ✅ Validates model performance
- ✅ Records everything in audit trail

## Training Pipeline Details

### What Gets Trained

1. **Quality Prediction Model**
   - Predicts repository quality scores
   - Uses: Enhanced features (interaction, temporal, language, architecture)
   - Output: Quality score (0-100)

2. **Feature Importance Analysis**
   - Identifies which features matter most
   - Helps optimize future feature engineering

3. **Model Performance Metrics**
   - R² (coefficient of determination)
   - MAE (Mean Absolute Error)
   - RMSE (Root Mean Square Error)

### Training Data Sources

1. **Production Predictions** (from Supabase)
   - Real-world usage data
   - Actual quality scores
   - User feedback

2. **GitHub Repository Data** (from scan)
   - High-quality public repos
   - Enhanced features
   - Metadata only (no source code)

3. **Combined Dataset**
   - Merged and validated
   - Quality-filtered
   - Ready for training

## Monitoring Progress

### Check Scan Status
```bash
./scripts/scan-status.sh
```

### Real-Time Monitoring
```bash
node scripts/monitor-scan-progress.js --watch
```

### View Scan Log
```bash
tail -f .beast-mode/scan-progress.log
```

## Expected Timeline

- **Scanning**: ~10-15 minutes (500 repos at ~1 repo/second)
- **Feature Extraction**: ~2-5 minutes (after scanning)
- **Training**: ~5-10 minutes (depending on dataset size)
- **Total**: ~20-30 minutes end-to-end

## What to Expect

### After Scanning:
- ✅ Training data file saved
- ✅ Feature statistics displayed
- ✅ Language/license distribution
- ✅ Opt-out list (if any)

### After Training:
- ✅ Model performance metrics (R², MAE, RMSE)
- ✅ Feature importance rankings
- ✅ Model saved for deployment
- ✅ Audit trail updated

## Troubleshooting

### If Scan Fails:
1. Check rate limits: `./scripts/scan-status.sh`
2. Review logs: `tail -50 .beast-mode/scan-progress.log`
3. Restart scan: `node scripts/scan-discovered-repos.js`

### If Training Fails:
1. Verify data exists: `ls -lh .beast-mode/training-data/scanned-repos/`
2. Check data format: `cat .beast-mode/training-data/scanned-repos/*.json | jq '.trainingData[0]'`
3. Review training logs: Check console output

## Success Criteria

✅ **Scan Complete When:**
- All 500 repos scanned
- Training data file created
- Feature extraction complete
- Statistics displayed

✅ **Training Complete When:**
- Model metrics shown (R² > 0.7 ideal)
- Model file saved
- Performance validated
- Ready for deployment

## Next Actions

Once scan completes, you can:

1. **Immediate**: Review training data quality
2. **Short-term**: Train improved models
3. **Long-term**: Deploy models to production
4. **Ongoing**: Monitor model performance and retrain as needed

---

**Status**: Scan in progress - check `./scripts/scan-status.sh` for current progress

