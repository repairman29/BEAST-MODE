#!/usr/bin/env node

/**
 * Tool Discovery and Ratings
 * BEAST MODE Q3 2025: Ecosystem Marketplace
 *
 * Intelligent discovery system that helps users find the best tools
 * for their specific needs with AI-powered recommendations and ratings
 */

const fs = require('fs').promises;
const path = require('path');
// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const log = createLogger('ToolDiscovery');

class ToolDiscovery {
    constructor() {
        this.toolsDir = path.join(__dirname, '..', 'tools');
        this.ratingsDir = path.join(this.toolsDir, 'ratings');
        this.recommendationsDir = path.join(this.toolsDir, 'recommendations');
        this.searchIndexDir = path.join(this.toolsDir, 'search-index');

        this.availableTools = new Map();
        this.toolRatings = new Map();
        this.userProfiles = new Map();
        this.searchIndex = new Map();

        this.discoveryAPI = 'https://discovery.beast-mode.dev/api';
    }

    async initialize() {
        log.info('Initializing Tool Discovery...');
        await this.ensureDirectories();
        await this.loadAvailableTools();
        await this.loadToolRatings();
        await this.buildSearchIndex();
        await this.loadUserProfiles();
        log.info(`Tool Discovery ready with ${this.availableTools.size} available tools`);
    }

    /**
     * Discover tools based on user needs
     */
    async discoverTools(userQuery, userContext = {}) {
        const {
            experience = 'intermediate',
            projectType = 'web',
            languages = [],
            budget = 'any',
            preferredTools = [],
            excludeTools = []
        } = userContext;

        log.info(`Discovering tools for query: "${userQuery}"`);

        // Parse user query
        const queryAnalysis = await this.analyzeQuery(userQuery);

        // Find matching tools
        let candidates = await this.findMatchingTools(queryAnalysis);

        // Apply user context filters
        candidates = this.applyUserFilters(candidates, userContext);

        // Rank and score tools
        const rankedTools = await this.rankTools(candidates, queryAnalysis, userContext);

        // Generate personalized recommendations
        const recommendations = await this.generateRecommendations(rankedTools, userContext);

        return {
            query: userQuery,
            analysis: queryAnalysis,
            recommendations: recommendations,
            totalFound: candidates.length,
            topMatches: rankedTools.slice(0, 10)
        };
    }

    /**
     * Rate a tool
     */
    async rateTool(toolId, rating, review = '', userId = 'anonymous') {
        const tool = this.availableTools.get(toolId);
        if (!tool) {
            throw new Error(`Tool ${toolId} not found`);
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const reviewData = {
            toolId: toolId,
            userId: userId,
            rating: rating,
            review: review,
            timestamp: new Date().toISOString(),
            verified: false // Could be verified based on usage data
        };

        // Save review
        await this.saveReview(reviewData);

        // Update tool rating
        await this.updateToolRating(toolId);

        // Update user profile
        await this.updateUserProfile(userId, { toolId, rating, categories: tool.categories });

        log.info(`Review submitted for ${tool.name}: ${rating} stars by ${userId}`);
        return reviewData;
    }

    /**
     * Get tool details with ratings
     */
    getToolDetails(toolId) {
        const tool = this.availableTools.get(toolId);
        if (!tool) {
            throw new Error(`Tool ${toolId} not found`);
        }

        const ratings = this.toolRatings.get(toolId) || {
            average: 0,
            count: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };

        const reviews = this.getToolReviews(toolId);

        return {
            ...tool,
            ratings: ratings,
            reviews: reviews,
            relatedTools: this.findRelatedTools(toolId),
            alternatives: this.findAlternatives(toolId),
            trending: this.isToolTrending(toolId)
        };
    }

    /**
     * Search tools with advanced filters
     */
    async searchTools(query, filters = {}) {
        const {
            category,
            language,
            price,
            rating,
            platform,
            sortBy = 'relevance',
            limit = 20
        } = filters;

        // Use search index for fast lookup
        let results = [];

        if (query) {
            const searchTerms = this.tokenizeQuery(query);
            results = await this.searchIndexLookup(searchTerms);
        } else {
            results = Array.from(this.availableTools.values());
        }

        // Apply filters
        results = results.filter(tool => {
            if (category && !tool.categories?.includes(category)) return false;
            if (language && !tool.languages?.includes(language)) return false;
            if (platform && !tool.platforms?.includes(platform)) return false;
            if (price === 'free' && tool.price > 0) return false;
            if (price === 'paid' && tool.price === 0) return false;
            if (rating && (tool.rating || 0) < rating) return false;
            return true;
        });

        // Sort results
        results.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'downloads':
                    return (b.downloads || 0) - (a.downloads || 0);
                case 'price':
                    return (a.price || 0) - (b.price || 0);
                case 'newest':
                    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
                case 'relevance':
                default:
                    // Use relevance score from search
                    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
            }
        });

        return {
            query: query,
            filters: filters,
            results: results.slice(0, limit),
            total: results.length,
            categories: this.getCategoryStats(),
            languages: this.getLanguageStats()
        };
    }

    /**
     * Get trending tools
     */
    getTrendingTools(timeframe = '30d', limit = 10) {
        const cutoffDate = this.parseTimeframe(timeframe);
        const tools = Array.from(this.availableTools.values());

        const trending = tools
            .filter(tool => {
                const lastUpdated = new Date(tool.updatedAt || tool.publishedAt);
                return lastUpdated > cutoffDate;
            })
            .map(tool => ({
                ...tool,
                trendScore: this.calculateTrendScore(tool, timeframe)
            }))
            .sort((a, b) => b.trendScore - a.trendScore)
            .slice(0, limit);

        return trending;
    }

    /**
     * Get personalized recommendations
     */
    async getPersonalizedRecommendations(userId, limit = 5) {
        const userProfile = this.userProfiles.get(userId);

        if (!userProfile) {
            // Return popular tools for new users
            return this.getPopularTools(limit);
        }

        // Find tools similar to user's rated tools
        const likedTools = userProfile.ratings
            .filter(r => r.rating >= 4)
            .map(r => r.toolId);

        const recommendations = [];
        const seenTools = new Set([...likedTools, ...userProfile.viewedTools]);

        for (const toolId of likedTools) {
            const similarTools = this.findRelatedTools(toolId)
                .filter(tool => !seenTools.has(tool.id))
                .slice(0, 3);

            recommendations.push(...similarTools);
        }

        // Remove duplicates and sort by relevance
        const uniqueRecommendations = Array.from(
            new Map(recommendations.map(tool => [tool.id, tool])).values()
        ).slice(0, limit);

        return {
            userId: userId,
            recommendations: uniqueRecommendations,
            basedOn: likedTools.slice(0, 3),
            reason: 'Based on tools you\'ve rated highly'
        };
    }

    /**
     * Compare tools
     */
    compareTools(toolIds) {
        const tools = toolIds
            .map(id => this.availableTools.get(id))
            .filter(Boolean);

        if (tools.length < 2) {
            throw new Error('Need at least 2 tools to compare');
        }

        const comparison = {
            tools: tools.map(tool => ({
                id: tool.id,
                name: tool.name,
                rating: tool.rating || 0,
                price: tool.price || 0,
                categories: tool.categories || [],
                languages: tool.languages || [],
                platforms: tool.platforms || [],
                features: tool.features || []
            })),
            metrics: {
                averageRating: tools.reduce((sum, t) => sum + (t.rating || 0), 0) / tools.length,
                priceRange: {
                    min: Math.min(...tools.map(t => t.price || 0)),
                    max: Math.max(...tools.map(t => t.price || 0))
                },
                commonCategories: this.findCommonCategories(tools),
                uniqueFeatures: this.findUniqueFeatures(tools)
            }
        };

        return comparison;
    }

    /**
     * Get tool statistics
     */
    async getToolStats() {
        const stats = {
            totalTools: this.availableTools.size,
            categories: this.getCategoryBreakdown(),
            languages: this.getLanguageBreakdown(),
            platforms: this.getPlatformBreakdown(),
            pricing: this.getPricingStats(),
            ratings: this.getRatingStats(),
            downloads: this.getDownloadStats(),
            trending: this.getTrendingStats()
        };

        return stats;
    }

    // Internal methods

    async analyzeQuery(query) {
        // Simple NLP analysis - in a real implementation, this would use AI
        const tokens = this.tokenizeQuery(query);
        const categories = this.identifyCategories(tokens);
        const languages = this.identifyLanguages(tokens);
        const useCases = this.identifyUseCases(tokens);

        return {
            tokens: tokens,
            categories: categories,
            languages: languages,
            useCases: useCases,
            intent: this.classifyIntent(tokens)
        };
    }

    tokenizeQuery(query) {
        return query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 1);
    }

    identifyCategories(tokens) {
        const categoryKeywords = {
            'linting': ['lint', 'eslint', 'style', 'code quality', 'static analysis'],
            'testing': ['test', 'jest', 'mocha', 'unit test', 'integration test'],
            'build': ['build', 'webpack', 'babel', 'bundler', 'compiler'],
            'deployment': ['deploy', 'ci/cd', 'pipeline', 'docker', 'kubernetes'],
            'monitoring': ['monitor', 'log', 'metrics', 'performance', 'observability'],
            'security': ['security', 'audit', 'vulnerability', 'encryption'],
            'collaboration': ['git', 'review', 'pr', 'merge', 'collaboration']
        };

        const categories = [];
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (tokens.some(token => keywords.some(kw => token.includes(kw)))) {
                categories.push(category);
            }
        }

        return categories;
    }

    identifyLanguages(tokens) {
        const languageKeywords = {
            'javascript': ['js', 'javascript', 'node', 'react', 'vue', 'angular'],
            'typescript': ['ts', 'typescript'],
            'python': ['python', 'django', 'flask'],
            'java': ['java', 'spring'],
            'csharp': ['c#', 'csharp', '.net'],
            'go': ['go', 'golang'],
            'rust': ['rust'],
            'php': ['php', 'laravel']
        };

        const languages = [];
        for (const [language, keywords] of Object.entries(languageKeywords)) {
            if (tokens.some(token => keywords.includes(token))) {
                languages.push(language);
            }
        }

        return languages;
    }

    identifyUseCases(tokens) {
        const useCaseKeywords = {
            'web-development': ['web', 'frontend', 'backend', 'fullstack'],
            'mobile-development': ['mobile', 'ios', 'android', 'react native'],
            'api-development': ['api', 'rest', 'graphql', 'microservice'],
            'data-processing': ['data', 'analytics', 'ml', 'ai'],
            'devops': ['devops', 'infrastructure', 'cloud'],
            'game-development': ['game', 'unity', 'unreal']
        };

        const useCases = [];
        for (const [useCase, keywords] of Object.entries(useCaseKeywords)) {
            if (tokens.some(token => keywords.some(kw => token.includes(kw)))) {
                useCases.push(useCase);
            }
        }

        return useCases;
    }

    classifyIntent(tokens) {
        if (tokens.includes('free') || tokens.includes('cheap')) return 'budget-conscious';
        if (tokens.includes('best') || tokens.includes('top')) return 'quality-focused';
        if (tokens.includes('easy') || tokens.includes('simple')) return 'beginner-friendly';
        if (tokens.includes('fast') || tokens.includes('performance')) return 'performance-focused';
        return 'general';
    }

    async findMatchingTools(queryAnalysis) {
        const candidates = [];

        for (const [toolId, tool] of this.availableTools) {
            let relevanceScore = 0;

            // Category matching
            if (queryAnalysis.categories.some(cat => tool.categories?.includes(cat))) {
                relevanceScore += 30;
            }

            // Language matching
            if (queryAnalysis.languages.some(lang => tool.languages?.includes(lang))) {
                relevanceScore += 25;
            }

            // Text matching in name/description
            const toolText = `${tool.name} ${tool.description} ${tool.tags?.join(' ') || ''}`.toLowerCase();
            const textMatches = queryAnalysis.tokens.filter(token =>
                toolText.includes(token)
            ).length;
            relevanceScore += textMatches * 5;

            // Use case matching
            if (queryAnalysis.useCases.some(uc => tool.useCases?.includes(uc))) {
                relevanceScore += 20;
            }

            if (relevanceScore > 0) {
                candidates.push({
                    ...tool,
                    relevanceScore: relevanceScore
                });
            }
        }

        return candidates;
    }

    applyUserFilters(tools, userContext) {
        return tools.filter(tool => {
            // Experience level filtering
            if (userContext.experience === 'beginner' && tool.complexity === 'expert') {
                return false;
            }

            // Project type filtering
            if (userContext.projectType && !tool.projectTypes?.includes(userContext.projectType)) {
                // Allow some flexibility
            }

            // Preferred/excluded tools
            if (userContext.excludeTools?.includes(tool.id)) {
                return false;
            }

            return true;
        });
    }

    async rankTools(tools, queryAnalysis, userContext) {
        const ranked = tools.map(tool => {
            let score = tool.relevanceScore || 0;

            // Rating boost
            score += (tool.rating || 0) * 10;

            // Download popularity boost
            score += Math.log((tool.downloads || 1) + 1) * 5;

            // Recency boost
            const daysSincePublished = (Date.now() - new Date(tool.publishedAt || 0)) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 30 - daysSincePublished / 30) * 2;

            // User preference boost
            if (userContext.preferredTools?.includes(tool.id)) {
                score += 50;
            }

            // Intent-based adjustments
            switch (queryAnalysis.intent) {
                case 'budget-conscious':
                    if (tool.price === 0) score += 20;
                    break;
                case 'quality-focused':
                    score += (tool.rating || 0) * 15;
                    break;
                case 'beginner-friendly':
                    if (tool.complexity === 'beginner') score += 25;
                    break;
            }

            return { ...tool, finalScore: score };
        });

        return ranked.sort((a, b) => b.finalScore - a.finalScore);
    }

    async generateRecommendations(rankedTools, userContext) {
        const recommendations = [];

        // Primary recommendation
        if (rankedTools.length > 0) {
            recommendations.push({
                tool: rankedTools[0],
                type: 'primary',
                reason: 'Best match for your requirements'
            });
        }

        // Alternative options
        if (rankedTools.length > 1) {
            recommendations.push({
                tool: rankedTools[1],
                type: 'alternative',
                reason: 'Good alternative with different strengths'
            });
        }

        // Free option if user has paid tools
        const freeTools = rankedTools.filter(t => t.price === 0);
        if (freeTools.length > 0 && !recommendations.some(r => r.tool.price === 0)) {
            recommendations.push({
                tool: freeTools[0],
                type: 'budget',
                reason: 'Free option that meets your needs'
            });
        }

        // Popular choice
        const popularTools = rankedTools.filter(t => (t.downloads || 0) > 1000);
        if (popularTools.length > 0 && !recommendations.some(r => r.tool.id === popularTools[0].id)) {
            recommendations.push({
                tool: popularTools[0],
                type: 'popular',
                reason: 'Popular choice among developers'
            });
        }

        return recommendations;
    }

    async saveReview(review) {
        const reviewFile = path.join(this.ratingsDir, `review-${review.toolId}-${Date.now()}.json`);
        await fs.writeFile(reviewFile, JSON.stringify(review, null, 2));
    }

    async updateToolRating(toolId) {
        const reviews = this.getToolReviews(toolId);
        if (reviews.length === 0) return;

        const ratings = reviews.map(r => r.rating);
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
            distribution[rating] = (distribution[rating] || 0) + 1;
        });

        this.toolRatings.set(toolId, {
            average: Math.round(average * 10) / 10,
            count: reviews.length,
            distribution: distribution
        });

        // Update tool's rating in available tools
        const tool = this.availableTools.get(toolId);
        if (tool) {
            tool.rating = Math.round(average * 10) / 10;
            await this.saveAvailableTools();
        }
    }

    getToolReviews(toolId) {
        const reviews = [];
        try {
            // In a real implementation, this would read from files
            // For now, return mock data
            return reviews;
        } catch {
            return reviews;
        }
    }

    findRelatedTools(toolId) {
        const tool = this.availableTools.get(toolId);
        if (!tool) return [];

        return Array.from(this.availableTools.values())
            .filter(t => t.id !== toolId &&
                        (t.categories?.some(cat => tool.categories?.includes(cat)) ||
                         t.languages?.some(lang => tool.languages?.includes(lang))))
            .slice(0, 5);
    }

    findAlternatives(toolId) {
        const tool = this.availableTools.get(toolId);
        if (!tool) return [];

        return Array.from(this.availableTools.values())
            .filter(t => t.id !== toolId &&
                        t.categories?.some(cat => tool.categories?.includes(cat)) &&
                        Math.abs((t.price || 0) - (tool.price || 0)) < 50)
            .slice(0, 3);
    }

    isToolTrending(toolId) {
        const tool = this.availableTools.get(toolId);
        if (!tool) return false;

        const recentDownloads = tool.recentDownloads || [];
        const last30Days = recentDownloads.slice(-30);
        const previous30Days = recentDownloads.slice(-60, -30);

        if (previous30Days.length === 0) return false;

        const recentAvg = last30Days.reduce((sum, d) => sum + d, 0) / last30Days.length;
        const previousAvg = previous30Days.reduce((sum, d) => sum + d, 0) / previous30Days.length;

        return recentAvg > previousAvg * 1.5; // 50% increase
    }

    async searchIndexLookup(searchTerms) {
        const results = [];
        const termSet = new Set(searchTerms);

        for (const [term, toolIds] of this.searchIndex) {
            if (termSet.has(term)) {
                for (const toolId of toolIds) {
                    const tool = this.availableTools.get(toolId);
                    if (tool) {
                        results.push(tool);
                    }
                }
            }
        }

        return Array.from(new Set(results));
    }

    async buildSearchIndex() {
        this.searchIndex = new Map();

        for (const [toolId, tool] of this.availableTools) {
            const searchableText = `${tool.name} ${tool.description} ${tool.tags?.join(' ') || ''} ${tool.categories?.join(' ') || ''}`.toLowerCase();
            const terms = searchableText.split(/\s+/).filter(term => term.length > 1);

            for (const term of terms) {
                if (!this.searchIndex.has(term)) {
                    this.searchIndex.set(term, []);
                }
                if (!this.searchIndex.get(term).includes(toolId)) {
                    this.searchIndex.get(term).push(toolId);
                }
            }
        }
    }

    calculateTrendScore(tool, timeframe) {
        const recentDownloads = tool.recentDownloads || [];
        const days = this.parseTimeframeToDays(timeframe);
        const recent = recentDownloads.slice(-days);

        if (recent.length === 0) return 0;

        const avgRecent = recent.reduce((sum, d) => sum + d, 0) / recent.length;
        const growth = recent[recent.length - 1] - recent[0];

        return avgRecent + growth * 0.1;
    }

    parseTimeframe(timeframe) {
        const now = new Date();
        const value = parseInt(timeframe.slice(0, -1));
        const unit = timeframe.slice(-1);

        switch (unit) {
            case 'd': return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
            case 'w': return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
            case 'M': return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
            default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }

    parseTimeframeToDays(timeframe) {
        const value = parseInt(timeframe.slice(0, -1));
        const unit = timeframe.slice(-1);

        switch (unit) {
            case 'd': return value;
            case 'w': return value * 7;
            case 'M': return value * 30;
            default: return 30;
        }
    }

    getPopularTools(limit = 5) {
        return Array.from(this.availableTools.values())
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, limit);
    }

    findCommonCategories(tools) {
        if (tools.length === 0) return [];

        const categoryCounts = {};
        tools.forEach(tool => {
            tool.categories?.forEach(category => {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
        });

        return Object.entries(categoryCounts)
            .filter(([, count]) => count === tools.length)
            .map(([category]) => category);
    }

    findUniqueFeatures(tools) {
        const uniqueFeatures = {};

        tools.forEach(tool => {
            uniqueFeatures[tool.id] = tool.features?.filter(feature => {
                return tools.every(otherTool =>
                    otherTool.id === tool.id ||
                    !otherTool.features?.includes(feature)
                );
            }) || [];
        });

        return uniqueFeatures;
    }

    getCategoryStats() {
        const stats = {};
        for (const tool of this.availableTools.values()) {
            tool.categories?.forEach(category => {
                stats[category] = (stats[category] || 0) + 1;
            });
        }
        return stats;
    }

    getLanguageStats() {
        const stats = {};
        for (const tool of this.availableTools.values()) {
            tool.languages?.forEach(language => {
                stats[language] = (stats[language] || 0) + 1;
            });
        }
        return stats;
    }

    getCategoryBreakdown() {
        return this.getCategoryStats();
    }

    getLanguageBreakdown() {
        return this.getLanguageStats();
    }

    getPlatformBreakdown() {
        const stats = {};
        for (const tool of this.availableTools.values()) {
            tool.platforms?.forEach(platform => {
                stats[platform] = (stats[platform] || 0) + 1;
            });
        }
        return stats;
    }

    getPricingStats() {
        let free = 0, paid = 0, totalRevenue = 0;

        for (const tool of this.availableTools.values()) {
            if (tool.price === 0) {
                free++;
            } else {
                paid++;
                totalRevenue += tool.price * (tool.downloads || 0);
            }
        }

        return { free, paid, totalRevenue };
    }

    getRatingStats() {
        const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0, count = 0;

        for (const tool of this.availableTools.values()) {
            if (tool.rating) {
                const rounded = Math.round(tool.rating);
                ratings[rounded] = (ratings[rounded] || 0) + 1;
                totalRating += tool.rating;
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
        const topTools = Array.from(this.availableTools.values())
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 10)
            .map(t => ({ name: t.name, downloads: t.downloads || 0 }));

        for (const tool of this.availableTools.values()) {
            totalDownloads += t.downloads || 0;
        }

        return {
            total: totalDownloads,
            topTools: topTools
        };
    }

    getTrendingStats() {
        const trendingTools = Array.from(this.availableTools.values())
            .filter(tool => this.isToolTrending(tool.id))
            .length;

        return {
            trendingCount: trendingTools,
            percentage: Math.round((trendingTools / this.availableTools.size) * 100)
        };
    }

    async updateUserProfile(userId, interaction) {
        const profile = this.userProfiles.get(userId) || {
            userId: userId,
            ratings: [],
            viewedTools: [],
            preferredCategories: {},
            preferredLanguages: {},
            lastActive: new Date().toISOString()
        };

        // Update ratings
        if (interaction.rating) {
            profile.ratings.push({
                toolId: interaction.toolId,
                rating: interaction.rating,
                timestamp: new Date().toISOString()
            });
        }

        // Update preferences
        if (interaction.categories) {
            interaction.categories.forEach(category => {
                profile.preferredCategories[category] = (profile.preferredCategories[category] || 0) + 1;
            });
        }

        profile.lastActive = new Date().toISOString();

        this.userProfiles.set(userId, profile);
        await this.saveUserProfiles();
    }

    async loadAvailableTools() {
        try {
            const data = await fs.readFile(path.join(this.toolsDir, 'available-tools.json'), 'utf8');
            const tools = JSON.parse(data);
            this.availableTools = new Map(Object.entries(tools));
        } catch {
            // Initialize with some sample tools
            this.availableTools = new Map([
                ['eslint-beast-mode', {
                    id: 'eslint-beast-mode',
                    name: 'ESLint Beast Mode',
                    description: 'Enhanced ESLint rules for ultimate code quality',
                    categories: ['linting', 'code-quality'],
                    languages: ['javascript', 'typescript'],
                    platforms: ['node', 'browser'],
                    price: 0,
                    rating: 4.8,
                    downloads: 1250,
                    complexity: 'intermediate',
                    features: ['custom-rules', 'auto-fix', 'integration'],
                    publishedAt: '2024-01-15T00:00:00Z'
                }],
                ['ai-code-review', {
                    id: 'ai-code-review',
                    name: 'AI Code Review Assistant',
                    description: 'AI-powered code review with 80%+ confidence',
                    categories: ['ai-assistant', 'code-review'],
                    languages: ['javascript', 'typescript', 'python'],
                    platforms: ['github', 'gitlab'],
                    price: 29.99,
                    rating: 4.9,
                    downloads: 890,
                    complexity: 'beginner',
                    features: ['ai-analysis', 'automated-reviews', 'integrations'],
                    publishedAt: '2024-02-20T00:00:00Z'
                }]
            ]);
            await this.saveAvailableTools();
        }
    }

    async saveAvailableTools() {
        const toolsObj = Object.fromEntries(this.availableTools);
        await fs.writeFile(
            path.join(this.toolsDir, 'available-tools.json'),
            JSON.stringify(toolsObj, null, 2)
        );
    }

    async loadToolRatings() {
        // Load ratings from individual review files
        this.toolRatings = new Map();
        // Implementation would load ratings from files
    }

    async loadUserProfiles() {
        try {
            const data = await fs.readFile(path.join(this.toolsDir, 'user-profiles.json'), 'utf8');
            const profiles = JSON.parse(data);
            this.userProfiles = new Map(Object.entries(profiles));
        } catch {
            this.userProfiles = new Map();
        }
    }

    async saveUserProfiles() {
        const profilesObj = Object.fromEntries(this.userProfiles);
        await fs.writeFile(
            path.join(this.toolsDir, 'user-profiles.json'),
            JSON.stringify(profilesObj, null, 2)
        );
    }

    async ensureDirectories() {
        await fs.mkdir(this.toolsDir, { recursive: true });
        await fs.mkdir(this.ratingsDir, { recursive: true });
        await fs.mkdir(this.recommendationsDir, { recursive: true });
        await fs.mkdir(this.searchIndexDir, { recursive: true });
    }
}

module.exports = ToolDiscovery;
