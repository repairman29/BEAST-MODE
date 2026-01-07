/**
 * Feature Store
 * Centralized storage and versioning of features
 * 
 * Month 2: Week 2 - Feature Store
 */

const { createLogger } = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const log = createLogger('FeatureStore');

class FeatureStore {
    constructor() {
        this.storePath = path.join(process.cwd(), '.beast-mode', 'features');
        this.features = new Map();
        this.versions = new Map();
    }

    /**
     * Initialize feature store
     */
    async initialize() {
        try {
            await fs.mkdir(this.storePath, { recursive: true });
            
            // Load existing features
            await this.loadFeatures();
            
            log.info(`✅ Feature store initialized (${this.features.size} features)`);
        } catch (error) {
            log.error('Failed to initialize feature store:', error.message);
        }
    }

    /**
     * Store features for a context
     */
    async store(featureName, features, metadata = {}) {
        try {
            const version = this.generateVersion();
            const featureId = this.generateFeatureId(featureName, features);
            
            const featureRecord = {
                id: featureId,
                name: featureName,
                version: version,
                features: features,
                metadata: {
                    ...metadata,
                    storedAt: new Date().toISOString(),
                    hash: this.hashFeatures(features)
                }
            };

            // Store in memory
            if (!this.features.has(featureName)) {
                this.features.set(featureName, []);
            }
            this.features.get(featureName).push(featureRecord);

            // Store on disk
            await this.saveFeature(featureName, featureRecord);

            // Update version tracking
            this.versions.set(featureName, version);

            log.debug(`Stored feature: ${featureName} v${version}`);

            return {
                id: featureId,
                version: version,
                storedAt: featureRecord.metadata.storedAt
            };

        } catch (error) {
            log.error(`Failed to store feature ${featureName}:`, error.message);
            throw error;
        }
    }

    /**
     * Retrieve features by name and version
     */
    async retrieve(featureName, version = 'latest') {
        try {
            const features = this.features.get(featureName);
            if (!features || features.length === 0) {
                return null;
            }

            if (version === 'latest') {
                return features[features.length - 1];
            }

            return features.find(f => f.version === version) || null;

        } catch (error) {
            log.error(`Failed to retrieve feature ${featureName}:`, error.message);
            return null;
        }
    }

    /**
     * Get all versions of a feature
     */
    async getVersions(featureName) {
        const features = this.features.get(featureName);
        if (!features) {
            return [];
        }

        return features.map(f => ({
            version: f.version,
            storedAt: f.metadata.storedAt,
            hash: f.metadata.hash
        }));
    }

    /**
     * Search features by metadata
     */
    async search(query) {
        const results = [];

        for (const [name, features] of this.features.entries()) {
            for (const feature of features) {
                if (this.matchesQuery(feature, query)) {
                    results.push({
                        name,
                        version: feature.version,
                        metadata: feature.metadata
                    });
                }
            }
        }

        return results;
    }

    /**
     * Check if feature matches query
     */
    matchesQuery(feature, query) {
        // Match by name
        if (query.name && !feature.name.includes(query.name)) {
            return false;
        }

        // Match by metadata
        if (query.metadata) {
            for (const [key, value] of Object.entries(query.metadata)) {
                if (feature.metadata[key] !== value) {
                    return false;
                }
            }
        }

        // Match by date range
        if (query.dateFrom || query.dateTo) {
            const storedAt = new Date(feature.metadata.storedAt);
            if (query.dateFrom && storedAt < new Date(query.dateFrom)) {
                return false;
            }
            if (query.dateTo && storedAt > new Date(query.dateTo)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate feature ID
     */
    generateFeatureId(name, features) {
        const data = JSON.stringify({ name, features });
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Generate version number
     */
    generateVersion() {
        return Date.now().toString(36);
    }

    /**
     * Hash features for deduplication
     */
    hashFeatures(features) {
        const data = JSON.stringify(features, Object.keys(features).sort());
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Save feature to disk
     */
    async saveFeature(featureName, featureRecord) {
        const featureDir = path.join(this.storePath, featureName);
        await fs.mkdir(featureDir, { recursive: true });

        const filePath = path.join(featureDir, `${featureRecord.version}.json`);
        await fs.writeFile(filePath, JSON.stringify(featureRecord, null, 2));
    }

    /**
     * Load features from disk
     */
    async loadFeatures() {
        try {
            const entries = await fs.readdir(this.storePath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const featureName = entry.name;
                    const featureDir = path.join(this.storePath, featureName);
                    const files = await fs.readdir(featureDir);

                    const features = [];
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const filePath = path.join(featureDir, file);
                            const data = await fs.readFile(filePath, 'utf8');
                            const featureRecord = JSON.parse(data);
                            features.push(featureRecord);
                        }
                    }

                    // Sort by version
                    features.sort((a, b) => a.version.localeCompare(b.version));

                    this.features.set(featureName, features);
                    if (features.length > 0) {
                        this.versions.set(featureName, features[features.length - 1].version);
                    }
                }
            }
        } catch (error) {
            // Store doesn't exist yet, that's okay
            log.debug('Feature store directory not found, will create on first store');
        }
    }

    /**
     * Get feature statistics
     */
    getStats() {
        const stats = {
            totalFeatures: this.features.size,
            totalVersions: 0,
            features: []
        };

        for (const [name, versions] of this.features.entries()) {
            stats.totalVersions += versions.length;
            stats.features.push({
                name,
                versions: versions.length,
                latestVersion: versions.length > 0 ? versions[versions.length - 1].version : null
            });
        }

        return stats;
    }

    /**
     * Delete feature version
     */
    async delete(featureName, version) {
        try {
            const features = this.features.get(featureName);
            if (!features) {
                return false;
            }

            const index = features.findIndex(f => f.version === version);
            if (index === -1) {
                return false;
            }

            // Remove from memory
            features.splice(index, 1);
            if (features.length === 0) {
                this.features.delete(featureName);
                this.versions.delete(featureName);
            }

            // Remove from disk
            const filePath = path.join(this.storePath, featureName, `${version}.json`);
            await fs.unlink(filePath).catch(() => {}); // Ignore if file doesn't exist

            log.info(`Deleted feature: ${featureName} v${version}`);
            return true;

        } catch (error) {
            log.error(`Failed to delete feature ${featureName} v${version}:`, error.message);
            return false;
        }
    }
}

// Singleton instance
let featureStoreInstance = null;

async function getFeatureStore() {
    if (!featureStoreInstance) {
        featureStoreInstance = new FeatureStore();
        await featureStoreInstance.initialize();
    }
    return featureStoreInstance;
}

module.exports = {
    FeatureStore,
    getFeatureStore
};

