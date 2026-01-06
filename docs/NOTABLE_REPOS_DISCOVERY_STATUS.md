# Notable Repositories Discovery Status

## Overview
Discovering and scanning high-quality, notable open-source repositories to improve ML model training data quality.

## Discovery Results

### Phase 1: Discovery ✅
- **Date**: 2026-01-05
- **Target**: 1000 repositories with 5,000+ stars
- **Discovered**: 986 notable repositories
- **Strategies Used**:
  1. Trending repositories (last 7 days) - 412 repos
  2. Most starred repositories (all time) - 345 repos
  3. Recently updated high-quality repos - 229 repos
  4. High engagement ratio repos - 0 repos

### Repository Quality Metrics
- **Min stars**: 5,008
- **Max stars**: 435,560 (freeCodeCamp)
- **Avg stars**: 36,835
- **Total unique repos**: 986

### Language Distribution
- JavaScript: 81 repos
- TypeScript: 76 repos
- Java: 76 repos
- Go: 76 repos
- C++: 74 repos
- Swift: 74 repos
- Python: 73 repos
- PHP: 70 repos
- Kotlin: 70 repos
- Rust: 69 repos
- C#: 66 repos
- Ruby: 59 repos
- Dart: 54 repos
- Scala: 25 repos
- Clojure: 14 repos
- Elixir: 14 repos
- Haskell: 11 repos
- R: 4 repos

## Phase 2: Scanning 🔄
- **Status**: In Progress
- **Target**: Scan all 986 discovered repositories
- **Delay**: 2 seconds between scans (rate limit compliance)
- **Estimated Time**: ~33 minutes
- **Output**: `.beast-mode/training-data/scanned-repos/scanned-repos-notable-*.json`

## Phase 3: Retraining 📋
- **Status**: Pending
- **Plan**: 
  1. Combine existing 869 repos with new notable repos
  2. Use improved quality calculation (`calculateNotableQuality`)
  3. Train multiple algorithms (Linear Regression, Random Forest)
  4. Select best performer based on R², MAE, RMSE

## Quality Calculation Improvements

The new `calculateNotableQuality` function focuses on:

1. **High Engagement** (40% weight)
   - Stars (log scale, normalized)
   - Forks (log scale, normalized)
   - Open issues (linear, normalized)

2. **Quality Indicators** (40% weight)
   - Has tests (15%)
   - Has CI/CD (12%)
   - Has README (5%)
   - Has license (5%)
   - Has Docker (3%)

3. **Code Quality** (20% weight)
   - Code quality score (10%)
   - Code file ratio (10%)

4. **Activity & Maintenance** (15% weight)
   - Is active (10%)
   - Repository age (5%)

5. **Community Health** (5% weight)
   - Community health score

6. **Bonuses/Penalties**
   - +0.1 for 10K+ stars
   - +0.1 for 50K+ stars
   - +0.15 for 100K+ stars
   - -0.2 for <100 stars and <20 forks
   - -0.3 for <50 stars
   - Penalty for high issue ratio (>50% or >100%)

## Expected Outcomes

1. **Better Quality Labels**: More realistic variance in quality scores
2. **Improved Model Performance**: Positive R² (currently -0.29)
3. **Larger Dataset**: ~1,800+ total repositories
4. **Higher Quality Training Data**: Focus on notable, well-maintained projects

## Next Steps

1. ✅ Discover notable repos
2. 🔄 Scan discovered repos (in progress)
3. ⏳ Retrain model with improved labels
4. ⏳ Evaluate model performance
5. ⏳ Deploy improved model

## Files

- **Discovery Script**: `scripts/discover-notable-repos.js`
- **Scanning Script**: `scripts/scan-notable-repos.js`
- **Analysis Script**: `scripts/analyze-high-quality-repos.js`
- **Retraining Script**: `scripts/retrain-with-notable-repos.js`
- **Output Directory**: `.beast-mode/training-data/`

## Notes

- All scanning respects `.ai_exclude` opt-out files
- Rate limits are handled with delays between requests
- Audit trail logs all operations
- Quality calculation emphasizes engagement and maintenance indicators

