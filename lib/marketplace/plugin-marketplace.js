#!/usr/bin/env node

/**
 * Plugin Marketplace
 * BEAST MODE Q3 2025: Ecosystem Marketplace
 *
 * Comprehensive marketplace for discovering, installing, and monetizing
 * quality analysis plugins, tools, and integrations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createLogger } = require('../server/utils/logger');
const log = createLogger('PluginMarketplace');

class PluginMarketplace {
    constructor() {
        this.marketplaceDir = path.join(__dirname, '..', 'marketplace');
        this.pluginsDir = path.join(this.marketplaceDir, 'plugins');
        this.themesDir = path.join(this.marketplaceDir, 'themes');
        this.templatesDir = path.join(this.marketplaceDir, 'templates');
        this.reviewsDir = path.join(this.marketplaceDir, 'reviews');
        this.transactionsDir = path.join(this.marketplaceDir, 'transactions');

        this.marketplaceAPI = 'https://marketplace.beast-mode.dev/api';
        this.installedPlugins = new Map();
        this.availablePlugins = new Map();
        this.userPurchases = new Map();
        this.pluginStats = new Map();
        this.aiRecommendations = null;
        this.usageAnalytics = null;

        // Revenue tracking
        this.totalRevenue = 0;
        this.monthlyRevenue = 0;
        this.topEarners = new Map();
    }

    async initialize() {
        log.info('Initializing Plugin Marketplace...');
        await this.ensureDirectories();
        await this.loadInstalledPlugins();
        await this.syncAvailablePlugins();
        await this.loadMarketplaceStats();

        // Initialize AI Recommendations
        const { AIRecommendations } = require('./ai-recommendations');
        this.aiRecommendations = new AIRecommendations();
        await this.aiRecommendations.initialize();

        // Initialize Usage Analytics
        const { UsageAnalytics } = require('./usage-analytics');
        this.usageAnalytics = new UsageAnalytics();
        await this.usageAnalytics.initialize();

        log.info(`Plugin Marketplace ready with ${this.availablePlugins.size} available plugins`);
    }

    /**
     * Discover available plugins
     */
    async discoverPlugins(filters = {}) {
        const {
            category,
            language,
            price,
            rating,
            sortBy = 'downloads',
            limit = 50
        } = filters;

        let plugins = Array.from(this.availablePlugins.values());

        // Apply filters
        if (category) {
            plugins = plugins.filter(p => p.category === category);
        }

        if (language) {
            plugins = plugins.filter(p => p.languages?.includes(language));
        }

        if (price !== undefined) {
            if (price === 'free') {
                plugins = plugins.filter(p => p.price === 0);
            } else if (price === 'paid') {
                plugins = plugins.filter(p => p.price > 0);
            }
        }

        if (rating) {
            plugins = plugins.filter(p => (p.rating || 0) >= rating);
        }

        // Sort results
        plugins.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'downloads':
                    return (b.downloads || 0) - (a.downloads || 0);
                case 'price':
                    return (a.price || 0) - (b.price || 0);
                case 'newest':
                    return new Date(b.publishedAt) - new Date(a.publishedAt);
                case 'updated':
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                default:
                    return (b.downloads || 0) - (a.downloads || 0);
            }
        });

        return {
            plugins: plugins.slice(0, limit),
            total: plugins.length,
            filters: filters,
            categories: await this.getCategoryStats(),
            languages: await this.getLanguageStats()
        };
    }

    /**
     * Install a plugin
     */
    async installPlugin(pluginId, options = {}) {
        const {
            version = 'latest',
            licenseKey,
            autoUpdate = true
        } = options;

        const plugin = this.availablePlugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found in marketplace`);
        }

        // Check if already installed
        if (this.installedPlugins.has(pluginId)) {
            throw new Error(`Plugin ${pluginId} is already installed`);
        }

        // Verify license for paid plugins
        if (plugin.price > 0 && !licenseKey) {
            throw new Error(`License key required for paid plugin ${pluginId}`);
        }

        if (plugin.price > 0) {
            const licenseValid = await this.validateLicense(pluginId, licenseKey);
            if (!licenseValid) {
                throw new Error(`Invalid license key for plugin ${pluginId}`);
            }
        }

        log.info(`Installing plugin: ${plugin.name} v${version}`);

        try {
            // Download plugin
            const pluginData = await this.downloadPlugin(plugin, version);

            // Install plugin files
            const installPath = await this.installPluginFiles(plugin, pluginData);

            // Configure plugin
            await this.configurePlugin(plugin, installPath, options);

            // Register plugin
            const installedPlugin = {
                id: pluginId,
                name: plugin.name,
                version: pluginData.version,
                path: installPath,
                installedAt: new Date().toISOString(),
                autoUpdate: autoUpdate,
                licenseKey: licenseKey,
                status: 'active'
            };

            this.installedPlugins.set(pluginId, installedPlugin);
            await this.saveInstalledPlugins();

            // Update download stats
            await this.updateDownloadStats(pluginId);

            // Initialize plugin if it has an init script
            if (pluginData.initScript) {
                await this.initializePlugin(pluginData, installPath);
            }

            log.info(`✅ Successfully installed plugin: ${plugin.name}`);
            return installedPlugin;

        } catch (error) {
            log.error(`Failed to install plugin ${pluginId}:`, error.message);
            throw error;
        }
    }

    /**
     * Uninstall a plugin
     */
    async uninstallPlugin(pluginId) {
        const plugin = this.installedPlugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} is not installed`);
        }

        log.info(`Uninstalling plugin: ${plugin.name}`);

        try {
            // Run plugin cleanup if available
            await this.cleanupPlugin(plugin);

            // Remove plugin files
            if (plugin.path && await this.fileExists(plugin.path)) {
                await fs.rm(plugin.path, { recursive: true, force: true });
            }

            // Remove from installed plugins
            this.installedPlugins.delete(pluginId);
            await this.saveInstalledPlugins();

            log.info(`✅ Successfully uninstalled plugin: ${plugin.name}`);

        } catch (error) {
            log.error(`Failed to uninstall plugin ${pluginId}:`, error.message);
            throw error;
        }
    }

    /**
     * Update all installed plugins
     */
    async updateAllPlugins() {
        const updatablePlugins = Array.from(this.installedPlugins.values())
            .filter(p => p.autoUpdate);

        log.info(`Checking for updates for ${updatablePlugins.length} plugins...`);

        const updates = [];
        for (const plugin of updatablePlugins) {
            try {
                const updateInfo = await this.checkPluginUpdate(plugin.id);
                if (updateInfo.available) {
                    updates.push({
                        plugin: plugin,
                        update: updateInfo
                    });
                }
            } catch (error) {
                log.warn(`Failed to check updates for ${plugin.id}:`, error.message);
            }
        }

        if (updates.length === 0) {
            log.info('All plugins are up to date');
            return { updated: 0, available: 0 };
        }

        log.info(`Found ${updates.length} plugin updates`);

        // Apply updates
        let updated = 0;
        for (const { plugin, update } of updates) {
            try {
                await this.updatePlugin(plugin.id, update.version);
                updated++;
            } catch (error) {
                log.error(`Failed to update ${plugin.id}:`, error.message);
            }
        }

        log.info(`Successfully updated ${updated}/${updates.length} plugins`);
        return { updated, available: updates.length };
    }

    /**
     * Publish a plugin to the marketplace
     */
    async publishPlugin(pluginData, options = {}) {
        const {
            price = 0,
            license = 'MIT',
            categories = [],
            screenshots = [],
            demoUrl,
            documentationUrl
        } = options;

        log.info(`Publishing plugin: ${pluginData.name}`);

        // Validate plugin data
        this.validatePluginData(pluginData);

        // Prepare plugin package
        const pluginPackage = {
            ...pluginData,
            id: this.generatePluginId(pluginData.name),
            version: pluginData.version || '1.0.0',
            price: price,
            license: license,
            categories: categories,
            screenshots: screenshots,
            demoUrl: demoUrl,
            documentationUrl: documentationUrl,
            publishedAt: new Date().toISOString(),
            publisher: pluginData.publisher || 'Anonymous',
            downloads: 0,
            rating: 0,
            reviews: 0,
            status: 'pending-review'
        };

        try {
            // Upload to marketplace
            const result = await this.uploadToMarketplace(pluginPackage, pluginData.packagePath);

            // Update local registry
            this.availablePlugins.set(pluginPackage.id, pluginPackage);
            await this.saveAvailablePlugins();

            log.info(`✅ Plugin published: ${pluginData.name} (${pluginPackage.id})`);
            return {
                id: pluginPackage.id,
                status: 'published',
                marketplaceUrl: `${this.marketplaceAPI}/plugins/${pluginPackage.id}`
            };

        } catch (error) {
            log.error(`Failed to publish plugin:`, error.message);
            throw error;
        }
    }

    /**
     * Rate and review a plugin
     */
    async ratePlugin(pluginId, rating, review = '') {
        const plugin = this.availablePlugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Save review
        const reviewData = {
            pluginId: pluginId,
            rating: rating,
            review: review,
            reviewer: 'Anonymous', // In real implementation, get from auth
            timestamp: new Date().toISOString()
        };

        await this.saveReview(reviewData);

        // Update plugin rating
        await this.updatePluginRating(pluginId);

        log.info(`Review submitted for ${plugin.name}: ${rating} stars`);
        return reviewData;
    }

    /**
     * Get plugin details
     */
    getPluginDetails(pluginId) {
        const plugin = this.availablePlugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        const installed = this.installedPlugins.get(pluginId);

        return {
            ...plugin,
            installed: !!installed,
            installInfo: installed ? {
                version: installed.version,
                installedAt: installed.installedAt,
                status: installed.status
            } : null,
            reviews: this.getPluginReviews(pluginId),
            relatedPlugins: this.getRelatedPlugins(pluginId),
            stats: this.getPluginStats(pluginId)
        };
    }

    /**
     * Get marketplace statistics
     */
    async getMarketplaceStats() {
        const stats = {
            totalPlugins: this.availablePlugins.size,
            installedPlugins: this.installedPlugins.size,
            categories: this.getCategoryBreakdown(),
            languages: this.getLanguageBreakdown(),
            pricing: this.getPricingStats(),
            ratings: this.getRatingStats(),
            downloads: this.getDownloadStats(),
            revenue: {
                total: this.totalRevenue,
                monthly: this.monthlyRevenue,
                topEarners: Array.from(this.topEarners.entries())
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
            }
        };

        return stats;
    }

    /**
     * Search plugins
     */
    searchPlugins(query, filters = {}) {
        const searchTerm = query.toLowerCase();
        let results = Array.from(this.availablePlugins.values());

        // Text search
        results = results.filter(plugin =>
            plugin.name.toLowerCase().includes(searchTerm) ||
            plugin.description.toLowerCase().includes(searchTerm) ||
            plugin.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            plugin.category.toLowerCase().includes(searchTerm)
        );

        // Apply additional filters
        if (filters.category) {
            results = results.filter(p => p.category === filters.category);
        }

        if (filters.minRating) {
            results = results.filter(p => (p.rating || 0) >= filters.minRating);
        }

        if (filters.price) {
            if (filters.price === 'free') {
                results = results.filter(p => p.price === 0);
            } else if (filters.price === 'paid') {
                results = results.filter(p => p.price > 0);
            }
        }

        return results.map(plugin => ({
            ...plugin,
            installed: this.installedPlugins.has(plugin.id)
        }));
    }

    /**
     * Get featured plugins
     */
    getFeaturedPlugins(limit = 6) {
        const plugins = Array.from(this.availablePlugins.values());

        // Sort by featured score (downloads + rating + recency)
        const featured = plugins
            .filter(p => p.featured || (p.downloads > 100 && p.rating >= 4.0))
            .map(p => ({
                ...p,
                featuredScore: (p.downloads || 0) * 0.4 + (p.rating || 0) * 0.4 +
                              (p.featured ? 10 : 0) +
                              (Date.now() - new Date(p.updatedAt || p.publishedAt).getTime()) / (1000 * 60 * 60 * 24) * -0.2
            }))
            .sort((a, b) => b.featuredScore - a.featuredScore)
            .slice(0, limit);

        return featured;
    }

    /**
     * Get AI-powered recommendations for a user
     */
    async getAIRecommendations(userId, projectContext = {}, options = {}) {
        if (!this.aiRecommendations) {
            throw new Error('AI Recommendations not initialized');
        }

        const recommendations = await this.aiRecommendations.generateRecommendations(
            userId,
            projectContext,
            options
        );

        // Enrich recommendations with plugin details
        const enrichedRecommendations = [];
        for (const rec of recommendations.recommendations) {
            const pluginDetails = this.getPluginDetails(rec.pluginId);
            if (pluginDetails) {
                enrichedRecommendations.push({
                    ...rec,
                    plugin: pluginDetails
                });
            }
        }

        return {
            ...recommendations,
            recommendations: enrichedRecommendations
        };
    }

    /**
     * Track marketplace usage
     */
    trackUsage(userId, action, data = {}) {
        if (this.usageAnalytics) {
            switch (action) {
                case 'plugin_install':
                case 'plugin_uninstall':
                case 'plugin_use':
                case 'plugin_error':
                case 'plugin_update':
                    this.usageAnalytics.trackPluginUsage(userId, data.pluginId, action.replace('plugin_', ''), data);
                    break;
                case 'search':
                case 'browse':
                case 'download':
                case 'purchase':
                case 'review':
                    this.usageAnalytics.trackMarketplaceInteraction(userId, action, data);
                    break;
                case 'page_view':
                case 'feature_use':
                case 'time_spent':
                case 'conversion':
                    this.usageAnalytics.trackEngagement(userId, action, data);
                    break;
                default:
                    this.usageAnalytics.trackEvent(action, userId, data);
            }
        }
    }

    /**
     * Get marketplace analytics
     */
    async getAnalytics(timeframe = '30d', metrics = []) {
        if (!this.usageAnalytics) {
            throw new Error('Usage analytics not initialized');
        }

        return await this.usageAnalytics.getAnalytics(timeframe, metrics);
    }

    /**
     * Get trending plugins
     */
    getTrendingPlugins(timeframe = '30d', limit = 10) {
        const cutoffDate = new Date(Date.now() - this.parseTimeframe(timeframe));
        const plugins = Array.from(this.availablePlugins.values());

        return plugins
            .filter(p => new Date(p.updatedAt || p.publishedAt) > cutoffDate)
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, limit);
    }

    // Internal methods

    async downloadPlugin(plugin, version) {
        // In a real implementation, this would download from the marketplace API
        // For now, return mock data
        return {
            version: version,
            files: ['index.js', 'package.json', 'README.md'],
            initScript: 'index.js'
        };
    }

    async installPluginFiles(plugin, pluginData) {
        const installPath = path.join(this.pluginsDir, plugin.id);
        await fs.mkdir(installPath, { recursive: true });

        // In a real implementation, this would extract and install files
        // For now, create a basic plugin structure

        const packageJson = {
            name: plugin.name,
            version: pluginData.version,
            main: pluginData.initScript,
            beastMode: {
                plugin: true,
                category: plugin.category,
                languages: plugin.languages
            }
        };

        await fs.writeFile(
            path.join(installPath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        return installPath;
    }

    async configurePlugin(plugin, installPath, options) {
        // Create plugin configuration
        const config = {
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            installedAt: new Date().toISOString(),
            autoUpdate: options.autoUpdate,
            settings: plugin.defaultSettings || {}
        };

        await fs.writeFile(
            path.join(installPath, 'config.json'),
            JSON.stringify(config, null, 2)
        );
    }

    async initializePlugin(pluginData, installPath) {
        // Run plugin initialization if available
        const initScript = path.join(installPath, pluginData.initScript);
        if (await this.fileExists(initScript)) {
            // In a real implementation, this would safely execute the plugin
            log.info(`Initialized plugin at ${initScript}`);
        }
    }

    async updateDownloadStats(pluginId) {
        const plugin = this.availablePlugins.get(pluginId);
        if (plugin) {
            plugin.downloads = (plugin.downloads || 0) + 1;
            await this.saveAvailablePlugins();
        }
    }

    async checkPluginUpdate(pluginId) {
        const installed = this.installedPlugins.get(pluginId);
        const available = this.availablePlugins.get(pluginId);

        if (!installed || !available) {
            return { available: false };
        }

        const hasUpdate = this.compareVersions(available.version, installed.version) > 0;

        return {
            available: hasUpdate,
            currentVersion: installed.version,
            newVersion: available.version,
            releaseNotes: available.releaseNotes || 'Bug fixes and improvements'
        };
    }

    async updatePlugin(pluginId, newVersion) {
        const installed = this.installedPlugins.get(pluginId);
        if (!installed) {
            throw new Error(`Plugin ${pluginId} is not installed`);
        }

        log.info(`Updating ${pluginId} to v${newVersion}`);

        // Download new version
        const plugin = this.availablePlugins.get(pluginId);
        const newData = await this.downloadPlugin(plugin, newVersion);

        // Backup current version
        const backupPath = `${installed.path}.backup.${Date.now()}`;
        await fs.rename(installed.path, backupPath);

        try {
            // Install new version
            const newPath = await this.installPluginFiles(plugin, newData);
            await this.configurePlugin(plugin, newPath, { autoUpdate: installed.autoUpdate });

            // Update installed record
            installed.version = newVersion;
            installed.updatedAt = new Date().toISOString();
            await this.saveInstalledPlugins();

            // Remove backup
            await fs.rm(backupPath, { recursive: true, force: true });

            log.info(`✅ Updated ${pluginId} to v${newVersion}`);

        } catch (error) {
            // Restore backup on failure
            await fs.rename(backupPath, installed.path);
            throw error;
        }
    }

    async cleanupPlugin(plugin) {
        // Run plugin cleanup if available
        const cleanupScript = path.join(plugin.path, 'cleanup.js');
        if (await this.fileExists(cleanupScript)) {
            // Execute cleanup script
            log.info(`Running cleanup for ${plugin.name}`);
        }
    }

    async validateLicense(pluginId, licenseKey) {
        // In a real implementation, this would validate against a license server
        return licenseKey && licenseKey.length > 10;
    }

    async uploadToMarketplace(pluginPackage, packagePath) {
        // In a real implementation, this would upload to the marketplace API
        return {
            id: pluginPackage.id,
            status: 'uploaded',
            url: `${this.marketplaceAPI}/plugins/${pluginPackage.id}`
        };
    }

    validatePluginData(data) {
        const required = ['name', 'description', 'category', 'languages'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    generatePluginId(name) {
        const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const random = crypto.randomBytes(4).toString('hex');
        return `${baseId}-${random}`;
    }

    async saveReview(review) {
        const reviewFile = path.join(this.reviewsDir, `review-${Date.now()}.json`);
        await fs.writeFile(reviewFile, JSON.stringify(review, null, 2));

        // Update plugin rating
        await this.updatePluginRating(review.pluginId);
    }

    async updatePluginRating(pluginId) {
        const plugin = this.availablePlugins.get(pluginId);
        if (!plugin) return;

        // Calculate new rating from all reviews
        const reviews = await this.getPluginReviews(pluginId);
        if (reviews.length === 0) return;

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        plugin.rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
        plugin.reviews = reviews.length;

        await this.saveAvailablePlugins();
    }

    async getPluginReviews(pluginId) {
        const reviews = [];
        try {
            const files = await fs.readdir(this.reviewsDir);
            for (const file of files) {
                if (file.startsWith('review-')) {
                    const review = JSON.parse(await fs.readFile(path.join(this.reviewsDir, file), 'utf8'));
                    if (review.pluginId === pluginId) {
                        reviews.push(review);
                    }
                }
            }
        } catch {
            // No reviews yet
        }
        return reviews;
    }

    getRelatedPlugins(pluginId) {
        const plugin = this.availablePlugins.get(pluginId);
        if (!plugin) return [];

        return Array.from(this.availablePlugins.values())
            .filter(p => p.id !== pluginId &&
                        (p.category === plugin.category ||
                         p.languages?.some(lang => plugin.languages?.includes(lang))))
            .slice(0, 5);
    }

    getPluginStats(pluginId) {
        return this.pluginStats.get(pluginId) || {
            downloads: 0,
            rating: 0,
            reviews: 0,
            trending: false
        };
    }

    getCategoryBreakdown() {
        const categories = {};
        for (const plugin of this.availablePlugins.values()) {
            categories[plugin.category] = (categories[plugin.category] || 0) + 1;
        }
        return categories;
    }

    getLanguageBreakdown() {
        const languages = {};
        for (const plugin of this.availablePlugins.values()) {
            for (const lang of (plugin.languages || [])) {
                languages[lang] = (languages[lang] || 0) + 1;
            }
        }
        return languages;
    }

    getPricingStats() {
        let free = 0, paid = 0, totalRevenue = 0;

        for (const plugin of this.availablePlugins.values()) {
            if (plugin.price === 0) {
                free++;
            } else {
                paid++;
                totalRevenue += plugin.price * (plugin.downloads || 0);
            }
        }

        return { free, paid, totalRevenue };
    }

    getRatingStats() {
        const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0, count = 0;

        for (const plugin of this.availablePlugins.values()) {
            if (plugin.rating) {
                const rounded = Math.round(plugin.rating);
                ratings[rounded] = (ratings[rounded] || 0) + 1;
                totalRating += plugin.rating;
                count++;
            }
        }

        return {
            distribution: ratings,
            average: count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0
        };
    }

    getDownloadStats() {
        let totalDownloads = 0;
        const topPlugins = Array.from(this.availablePlugins.values())
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 10)
            .map(p => ({ name: p.name, downloads: p.downloads || 0 }));

        for (const plugin of this.availablePlugins.values()) {
            totalDownloads += plugin.downloads || 0;
        }

        return {
            total: totalDownloads,
            topPlugins: topPlugins
        };
    }

    async getCategoryStats() {
        return this.getCategoryBreakdown();
    }

    async getLanguageStats() {
        return this.getLanguageBreakdown();
    }

    async syncAvailablePlugins() {
        // In a real implementation, this would sync with the marketplace API
        // For now, load from local storage
        await this.loadAvailablePlugins();
    }

    async loadAvailablePlugins() {
        try {
            const data = await fs.readFile(path.join(this.marketplaceDir, 'available-plugins.json'), 'utf8');
            const plugins = JSON.parse(data);
            this.availablePlugins = new Map(Object.entries(plugins));
        } catch {
            // Initialize with some sample plugins
            this.availablePlugins = new Map([
                ['eslint-beast-mode', {
                    id: 'eslint-beast-mode',
                    name: 'ESLint Beast Mode',
                    description: 'Enhanced ESLint rules for Beast Mode quality standards',
                    category: 'linting',
                    languages: ['javascript', 'typescript'],
                    price: 0,
                    rating: 4.8,
                    downloads: 1250,
                    version: '2.1.0',
                    publisher: 'Beast Mode Team',
                    publishedAt: '2024-01-15T00:00:00Z',
                    tags: ['eslint', 'linting', 'quality']
                }],
                ['ai-code-review', {
                    id: 'ai-code-review',
                    name: 'AI Code Review Assistant',
                    description: 'AI-powered code review with 80%+ confidence recommendations',
                    category: 'ai-assistant',
                    languages: ['javascript', 'typescript', 'python'],
                    price: 29.99,
                    rating: 4.9,
                    downloads: 890,
                    version: '1.3.2',
                    publisher: 'AI Code Labs',
                    publishedAt: '2024-02-20T00:00:00Z',
                    tags: ['ai', 'review', 'automation']
                }]
            ]);
            await this.saveAvailablePlugins();
        }
    }

    async saveAvailablePlugins() {
        const pluginsObj = Object.fromEntries(this.availablePlugins);
        await fs.writeFile(
            path.join(this.marketplaceDir, 'available-plugins.json'),
            JSON.stringify(pluginsObj, null, 2)
        );
    }

    async loadInstalledPlugins() {
        try {
            const data = await fs.readFile(path.join(this.marketplaceDir, 'installed-plugins.json'), 'utf8');
            const plugins = JSON.parse(data);
            this.installedPlugins = new Map(Object.entries(plugins));
        } catch {
            this.installedPlugins = new Map();
        }
    }

    async saveInstalledPlugins() {
        const pluginsObj = Object.fromEntries(this.installedPlugins);
        await fs.writeFile(
            path.join(this.marketplaceDir, 'installed-plugins.json'),
            JSON.stringify(pluginsObj, null, 2)
        );
    }

    async loadMarketplaceStats() {
        try {
            const data = await fs.readFile(path.join(this.marketplaceDir, 'stats.json'), 'utf8');
            const stats = JSON.parse(data);
            this.totalRevenue = stats.totalRevenue || 0;
            this.monthlyRevenue = stats.monthlyRevenue || 0;
            this.topEarners = new Map(Object.entries(stats.topEarners || {}));
        } catch {
            // Initialize default stats
        }
    }

    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);

        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1 = v1Parts[i] || 0;
            const v2 = v2Parts[i] || 0;

            if (v1 > v2) return 1;
            if (v1 < v2) return -1;
        }

        return 0;
    }

    parseTimeframe(timeframe) {
        const unit = timeframe.slice(-1);
        const value = parseInt(timeframe.slice(0, -1));

        const multipliers = {
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000,
            'M': 30 * 24 * 60 * 60 * 1000
        };

        return value * (multipliers[unit] || multipliers['d']);
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async ensureDirectories() {
        await fs.mkdir(this.marketplaceDir, { recursive: true });
        await fs.mkdir(this.pluginsDir, { recursive: true });
        await fs.mkdir(this.themesDir, { recursive: true });
        await fs.mkdir(this.templatesDir, { recursive: true });
        await fs.mkdir(this.reviewsDir, { recursive: true });
        await fs.mkdir(this.transactionsDir, { recursive: true });
    }
}

module.exports = PluginMarketplace;
