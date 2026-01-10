/**
 * Feature Gate Utility
 * Helper functions for feature gating based on subscription tier
 */

const { LicenseValidator } = require('./license-validator');

/**
 * Create a feature gate function
 */
function createFeatureGate(licenseValidator) {
  return function(feature, errorMessage) {
    if (!licenseValidator.checkFeature(feature)) {
      const tier = licenseValidator.getTier();
      const message = errorMessage || 
        `Feature "${feature}" requires a paid subscription. Current tier: ${tier}. Upgrade at https://beast-mode.dev/pricing`;
      throw new Error(message);
    }
  };
}

/**
 * Check if feature is available (returns boolean, doesn't throw)
 */
function hasFeature(licenseValidator, feature) {
  return licenseValidator.checkFeature(feature);
}

/**
 * Get upgrade message for feature
 */
function getUpgradeMessage(feature, currentTier) {
  const tierMap = {
    'day2-operations': 'Developer',
    'team-collaboration': 'Team',
    'white-label': 'Enterprise',
    'sso': 'Enterprise',
    'custom-integrations': 'Enterprise'
  };

  const requiredTier = tierMap[feature] || 'Developer';
  const currentTierName = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);

  return {
    feature: feature,
    currentTier: currentTierName,
    requiredTier: requiredTier,
    message: `"${feature}" requires ${requiredTier} tier. You're currently on ${currentTierName} tier.`,
    upgradeUrl: 'https://beast-mode.dev/pricing'
  };
}

module.exports = {
  createFeatureGate,
  hasFeature,
  getUpgradeMessage
};

