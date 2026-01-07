/**
 * BEAST MODE Brand Configuration
 * Dual-brand support: BEAST MODE (Community) + SENTINEL (Enterprise)
 */

const BRAND_CONFIG = {
    'beast-mode': {
        name: 'BEAST MODE',
        tagline: 'The AI Janitor for Vibe Coders',
        subTagline: 'Code Better. Ship Faster. Have Fun.',
        tone: 'energetic',
        visual: 'bold',
        emojis: true,
        target: 'community',
        messaging: {
            primary: 'Code with passion, build with purpose, ship with style',
            value: 'The missing piece of vibe coding',
            energy: 'high'
        }
    },
    'sentinel': {
        name: 'SENTINEL',
        tagline: 'The Governance Layer for AI-Generated Code',
        subTagline: 'Compliance-as-a-Service for the AI Coding Era',
        tone: 'professional',
        visual: 'minimal',
        emojis: false,
        target: 'enterprise',
        messaging: {
            primary: 'Governance-as-a-Service for AI-Generated Code',
            value: 'The firewall between AI prompts and production code',
            energy: 'low'
        }
    }
};

/**
 * Get brand configuration
 */
function getBrandConfig(brand = 'beast-mode') {
    return BRAND_CONFIG[brand] || BRAND_CONFIG['beast-mode'];
}

/**
 * Detect brand from context
 */
function detectBrand(options = {}) {
    // Check explicit brand setting
    if (options.brand) {
        return options.brand;
    }

    // Check enterprise flags
    if (options.enterprise || options.sentinel) {
        return 'sentinel';
    }

    // Default to BEAST MODE
    return 'beast-mode';
}

/**
 * Get messaging for brand
 */
function getMessaging(brand, context = 'default') {
    const config = getBrandConfig(brand);
    
    const messages = {
        'beast-mode': {
            default: 'Code Better. Ship Faster. Have Fun.',
            janitor: 'The AI Janitor for Vibe Coders',
            refactoring: 'Overnight code cleanup while you sleep',
            enforcement: 'Prevents bad patterns automatically',
            restoration: 'Rewind to last working state'
        },
        'sentinel': {
            default: 'The Governance Layer for AI-Generated Code',
            janitor: 'Automated code maintenance with human oversight',
            refactoring: 'Automated code maintenance with human oversight',
            enforcement: 'Governance rules enforced before code reaches production',
            restoration: 'Compliance monitoring and rollback capabilities'
        }
    };

    return messages[brand]?.[context] || config.tagline;
}

module.exports = {
    BRAND_CONFIG,
    getBrandConfig,
    detectBrand,
    getMessaging
};

