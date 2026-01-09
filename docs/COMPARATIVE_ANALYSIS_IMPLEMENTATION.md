# Comparative Analysis Implementation


/**
 * Find similar repositories for comparison
 */
async function findSimilarRepos(repo: string, features: Record<string, any>) {
  // Get historical predictions from database
  try {
    const { getDatabaseWriter } = require('../../../../../lib/mlops/databaseWriter');
    const databaseWriter = getDatabaseWriter();
    
    if (!databaseWriter) {
      return null;
    }
    
    // Query similar repos from ml_predictions
    // Similar = same language, similar size, similar stars
    const language = features.language || 'unknown';
    const stars = features.stars || 0;
    const fileCount = features.fileCount || 0;
    
    // Get repos with similar characteristics
    const similarRepos = await databaseWriter.querySimilar({
      language,
      starsRange: [stars * 0.5, stars * 2], // 50% to 200% of stars
      fileCountRange: [fileCount * 0.5, fileCount * 2], // 50% to 200% of files
      limit: 10
    });
    
    return similarRepos;
  } catch (error) {
    console.warn('[Quality API] Failed to find similar repos:', error.message);
    return null;
  }
}

/**
 * Generate comparative analysis
 */
function generateComparativeAnalysis(
  quality: number,
  similarRepos: any[],
  features: Record<string, any>
) {
  if (!similarRepos || similarRepos.length === 0) {
    return null;
  }
  
  // Calculate statistics from similar repos
  const similarQualities = similarRepos.map(r => r.predicted_value || r.quality || 0);
  const avgSimilarQuality = similarQualities.reduce((a, b) => a + b, 0) / similarQualities.length;
  const medianSimilarQuality = [...similarQualities].sort((a, b) => a - b)[Math.floor(similarQualities.length / 2)];
  
  // Calculate percentile
  const betterCount = similarQualities.filter(q => q > quality).length;
  const percentile = (betterCount / similarQualities.length) * 100;
  
  // Find top differentiators
  const differentiators = findTopDifferentiators(features, similarRepos);
  
  return {
    similarReposCount: similarRepos.length,
    averageQuality: avgSimilarQuality,
    medianQuality: medianSimilarQuality,
    percentile: percentile,
    comparison: {
      vsAverage: quality - avgSimilarQuality,
      vsMedian: quality - medianSimilarQuality,
      vsTop10: quality - (similarQualities.sort((a, b) => b - a).slice(0, Math.ceil(similarQualities.length * 0.1)).reduce((a, b) => a + b, 0) / Math.ceil(similarQualities.length * 0.1))
    },
    differentiators: differentiators,
    insights: generateInsights(quality, avgSimilarQuality, percentile, differentiators)
  };
}

/**
 * Find top differentiators (what makes this repo different)
 */
function findTopDifferentiators(features: Record<string, any>, similarRepos: any[]) {
  const differentiators = [];
  
  // Compare key features
  const keyFeatures = ['hasTests', 'hasCI', 'hasReadme', 'hasLicense', 'stars', 'forks', 'openIssues'];
  
  for (const feature of keyFeatures) {
    const thisValue = features[feature] || 0;
    const similarValues = similarRepos.map(r => r.context?.features?.[feature] || 0);
    const avgSimilar = similarValues.reduce((a, b) => a + b, 0) / similarValues.length;
    
    const difference = thisValue - avgSimilar;
    const percentDiff = avgSimilar > 0 ? (difference / avgSimilar) * 100 : 0;
    
    if (Math.abs(percentDiff) > 20) { // 20% difference threshold
      differentiators.push({
        feature,
        value: thisValue,
        average: avgSimilar,
        difference: difference,
        percentDifference: percentDiff,
        type: difference > 0 ? 'strength' : 'weakness'
      });
    }
  }
  
  return differentiators.sort((a, b) => Math.abs(b.percentDifference) - Math.abs(a.percentDifference)).slice(0, 5);
}

/**
 * Generate insights from comparison
 */
function generateInsights(quality: number, avgQuality: number, percentile: number, differentiators: any[]) {
  const insights = [];
  
  if (quality > avgQuality * 1.1) {
    insights.push({
      type: 'excellent',
      message: `Your repo ranks in the top ${(100 - percentile).toFixed(0)}% of similar repos`,
      action: 'Keep up the excellent work!'
    });
  } else if (quality < avgQuality * 0.9) {
    insights.push({
      type: 'improvement',
      message: `Your repo ranks below average compared to similar repos`,
      action: 'Focus on the top differentiators to improve'
    });
  } else {
    insights.push({
      type: 'good',
      message: `Your repo is performing well compared to similar repos`,
      action: 'Continue maintaining quality standards'
    });
  }
  
  // Add differentiator insights
  const strengths = differentiators.filter(d => d.type === 'strength');
  const weaknesses = differentiators.filter(d => d.type === 'weakness');
  
  if (strengths.length > 0) {
    insights.push({
      type: 'strength',
      message: `Your repo excels in: ${strengths.map(s => s.feature).join(', ')}`,
      action: 'These are your competitive advantages'
    });
  }
  
  if (weaknesses.length > 0) {
    insights.push({
      type: 'weakness',
      message: `Areas to improve: ${weaknesses.map(w => w.feature).join(', ')}`,
      action: 'Focus on these to catch up to similar repos'
    });
  }
  
  return insights;
}


## Usage

Add to quality route.ts:

```typescript
// In POST handler, after getting quality prediction:
const similarRepos = await findSimilarRepos(repo, features);
const comparativeAnalysis = generateComparativeAnalysis(quality, similarRepos, features);

// Add to response:
comparativeAnalysis: comparativeAnalysis
```

## Response Structure

```typescript
comparativeAnalysis: {
  similarReposCount: number,
  averageQuality: number,
  medianQuality: number,
  percentile: number,
  comparison: {
    vsAverage: number,
    vsMedian: number,
    vsTop10: number
  },
  differentiators: Array<{
    feature: string,
    value: number,
    average: number,
    difference: number,
    percentDifference: number,
    type: 'strength' | 'weakness'
  }>,
  insights: Array<{
    type: string,
    message: string,
    action: string
  }>
}
```
