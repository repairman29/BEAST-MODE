#!/usr/bin/env node

/**
 * Simple Quality Calculation
 * 
 * Simplified quality calculation that creates more variance
 * for machine learning models to learn from.
 * 
 * Instead of a complex deterministic formula, we use simpler
 * metrics that leave room for the model to discover patterns.
 */

/**
 * Simple quality calculation based on engagement metrics
 * This creates more variance and allows ML models to learn patterns
 */
function calculateSimpleQuality(repo) {
  const f = repo.features || {};
  
  // Core engagement metrics (normalized)
  const stars = f.stars || 0;
  const forks = f.forks || 0;
  const openIssues = f.openIssues || 0;
  
  // Normalize stars (log scale, max at 1M stars = 1.0)
  const starsScore = Math.min(1, Math.log10(stars + 1) / 6);
  
  // Normalize forks (log scale, max at 100K forks = 1.0)
  const forksScore = Math.min(1, Math.log10(forks + 1) / 5);
  
  // Normalize issues (linear, max at 1000 issues = 1.0)
  const issuesScore = Math.min(1, openIssues / 1000);
  
  // Base quality from engagement (weighted)
  let quality = (starsScore * 0.5) + (forksScore * 0.3) + (issuesScore * 0.2);
  
  // Quality indicators (binary bonuses)
  const hasTests = (f.hasTests || 0) * 0.1;
  const hasCI = (f.hasCI || 0) * 0.08;
  const hasReadme = (f.hasReadme || 0) * 0.05;
  const hasLicense = (f.hasLicense || 0) * 0.05;
  const hasDocker = (f.hasDocker || 0) * 0.02;
  
  quality += hasTests + hasCI + hasReadme + hasLicense + hasDocker;
  
  // Activity bonus (recent activity is good)
  const isActive = f.isActive || 0;
  quality += isActive * 0.1;
  
  // Penalty for very low engagement (creates variance in low range)
  if (stars < 10 && forks < 5) {
    quality *= 0.5; // Reduce quality for very low engagement
  }
  
  // Ensure quality is in [0, 1] range
  quality = Math.max(0, Math.min(1, quality));
  
  return quality;
}

/**
 * Alternative: Even simpler - just use normalized stars
 * This creates maximum variance for the model
 */
function calculateVerySimpleQuality(repo) {
  const f = repo.features || {};
  const stars = f.stars || 0;
  
  // Simple log normalization: log10(stars + 1) / 6
  // This maps: 1 star = 0.017, 1000 stars = 0.5, 1M stars = 1.0
  const quality = Math.min(1, Math.log10(stars + 1) / 6);
  
  return quality;
}

/**
 * Hybrid: Simple base + small bonuses
 * Good balance between simplicity and information
 */
function calculateHybridQuality(repo) {
  const f = repo.features || {};
  const stars = f.stars || 0;
  
  // Base quality from stars (log scale)
  let quality = Math.min(1, Math.log10(stars + 1) / 6);
  
  // Small bonuses for quality indicators (max +0.2 total)
  quality += (f.hasTests || 0) * 0.05;
  quality += (f.hasCI || 0) * 0.05;
  quality += (f.hasReadme || 0) * 0.03;
  quality += (f.hasLicense || 0) * 0.03;
  quality += (f.isActive || 0) * 0.04;
  
  // Ensure quality is in [0, 1] range
  quality = Math.max(0, Math.min(1, quality));
  
  return quality;
}

module.exports = {
  calculateSimpleQuality,
  calculateVerySimpleQuality,
  calculateHybridQuality,
};

