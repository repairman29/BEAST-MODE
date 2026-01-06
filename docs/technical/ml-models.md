# ML Quality Prediction Model - Usage Guide

## What This Model Does

The ML Quality Prediction Model predicts code quality scores (0-1 scale) for GitHub repositories using 59 enhanced features.

### Use Cases

1. **Repository Quality Assessment**
   - Predict quality before manual review
   - Identify high-quality codebases for training data
   - Filter repositories by predicted quality

2. **Code Quality Intelligence**
   - Power BEAST MODE's quality scoring
   - Prioritize code review efforts
   - Predict quality impact of changes

3. **Service Routing**
   - Route requests to best service
   - Predict which service provides best quality
   - Optimize resource allocation

4. **Predictive Analytics**
   - Forecast quality trends
   - Risk assessment
   - Quality degradation prediction

## Current Model Performance

- **Training Data**: 483 repositories
- **Features**: 59 enhanced features
- **Quality Range**: 0.53 - 1.0 (mean: 0.992, std: 0.051)
- **Status**: ✅ Trained with variance (R² should be calculable now)

## How to Use

### 1. Direct API Call

```bash
curl -X POST http://localhost:3000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "repo": "owner/repo",
      "features": {
        "stars": 1000,
        "forks": 100,
        "hasTests": 1,
        "hasCI": 1,
        ...
      }
    }
  }'
```

### 2. JavaScript/Node.js

```javascript
const { getMLIntegration } = require('./lib/mlops/mlIntegration');
const ml = getMLIntegration();

const prediction = ml.predictQualitySync({
  repo: 'owner/repo',
  features: {
    stars: 1000,
    forks: 100,
    hasTests: 1,
    hasCI: 1,
    codeQualityScore: 0.8,
    activityScore: 0.9,
    // ... other features
  }
});

console.log(`Predicted Quality: ${prediction.predictedQuality}`);
console.log(`Confidence: ${prediction.confidence}`);
```

### 3. Batch Predictions

```javascript
const repos = ['repo1', 'repo2', 'repo3'];
const predictions = repos.map(repo => {
  const features = extractFeatures(repo);
  return ml.predictQualitySync({ repo, features });
});

// Sort by predicted quality
predictions.sort((a, b) => b.predictedQuality - a.predictedQuality);
```

## Feature List (59 Features)

### Basic Metrics
- `stars`, `forks`, `openIssues`
- `fileCount`, `codeFileCount`
- `codeFileRatio`

### Quality Indicators (Binary)
- `hasTests`, `hasCI`, `hasDocker`, `hasConfig`
- `hasReadme`, `hasLicense`, `hasDescription`, `hasTopics`

### Quality Scores (0-1)
- `codeQualityScore`
- `activityScore`
- `communityHealth`
- `complexityScore`

### Temporal Features
- `repoAgeDays`, `repoAgeMonths`, `repoAgeYears`
- `daysSinceUpdate`, `daysSincePush`
- `isActive`, `recentlyPushed`

### Language Features
- `languageCount`
- `hasTypeScript`, `hasJavaScript`, `hasPython`, etc.
- `hasMultipleLanguages`
- `primaryTypeScript`, `primaryJavaScript`, etc.

### Architecture Features
- `isMonorepo`, `isMicroservice`, `isLibrary`, `isApp`

### Interaction Features
- `starsForksRatio`, `starsPerFile`, `forksPerFile`
- `engagementPerIssue`
- `testsAndCI`, `testsAndDocker`, `ciAndDocker`
- `readmeAndLicense`, `readmeAndDescription`, `descriptionAndTopics`

### Composite Features
- `hasAllQualityIndicators`
- `hasCommunity`

## Quality Calculation

The model uses a weighted combination of features:

```javascript
quality = 
  codeQualityScore * 1.0 +
  stars_normalized * 0.2 +
  forks_normalized * 0.15 +
  hasTests * 0.1 +
  hasCI * 0.08 +
  hasReadme * 0.05 +
  hasLicense * 0.03 +
  hasDescription * 0.02 +
  activityScore * 0.15 +
  communityHealth * 0.1 +
  complexityScore * 0.05 +
  codeFileRatio * 0.1 -
  issueRatio * 0.1
```

## Integration Points

### BEAST MODE Website
- `/api/ml/predict` - Single prediction
- `/api/ml/predict-all` - All prediction types
- `/api/beast-mode/intelligence/predictive-analytics` - Analytics

### Services
- **Code Roach**: Code quality predictions
- **Oracle**: Knowledge quality predictions
- **AI GM**: Narrative quality predictions
- **First Mate**: Player experience quality

## Next Steps

1. **Improve Model**: Add more diverse training data
2. **Collect Feedback**: Get real quality labels from users
3. **Expand Features**: Add 20+ new features
4. **Deploy**: Put model in production
5. **Monitor**: Track prediction accuracy

## Files

- **Model**: `.beast-mode/models/quality-predictor-v2.json`
- **Training Data**: `.beast-mode/training-data/scanned-repos/`
- **Documentation**: `docs/ML_MODEL_ROADMAP.md`

---

**Last Updated**: 2026-01-05

