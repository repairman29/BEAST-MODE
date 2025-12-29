"use client";

import React, { useState, useEffect } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';

interface Recommendation {
  pluginId: string;
  score: number;
  confidence: number;
  sources: string[];
  reasons: string[];
  plugin: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    downloads: number;
    languages: string[];
    tags: string[];
  };
}

/**
 * BEAST MODE AI Recommendations Dashboard
 *
 * Intelligent plugin recommendations powered by AI
 */
function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectContext, setProjectContext] = useState({
    type: 'web',
    languages: ['javascript', 'typescript'],
    teamSize: 'small',
    timeline: 'production',
    budget: 'medium',
    qualityScore: 75
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchRecommendations();
  }, [projectContext]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user', // In real app, get from auth
          projectContext: projectContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const installPlugin = async (pluginId: string) => {
    try {
      const response = await fetch('/api/beast-mode/marketplace/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pluginId,
          userId: 'demo-user'
        })
      });

      if (response.ok) {
        console.log(`Plugin ${pluginId} installation initiated`);
        // Could show success notification
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const filteredRecommendations = selectedCategory === 'all'
    ? recommendations
    : recommendations.filter(rec => rec.plugin.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(recommendations.map(r => r.plugin.category)))];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-holo-green';
    if (confidence >= 0.6) return 'text-holo-amber';
    return 'text-holo-red';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header */}
      <HudPanel>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-holo-cyan font-bold text-xl">🤖 AI Recommendations</h2>
          <HudButton onClick={fetchRecommendations} disabled={isLoading}>
            {isLoading ? '🔄 Analyzing...' : '🔍 Get Recommendations'}
          </HudButton>
        </div>

        {/* Project Context */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-holo-cyan/70 text-sm mb-1">Project Type</label>
            <select
              value={projectContext.type}
              onChange={(e) => setProjectContext(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-2 py-1 text-holo-cyan text-sm"
            >
              <option value="web">Web App</option>
              <option value="mobile">Mobile App</option>
              <option value="api">API Service</option>
              <option value="desktop">Desktop App</option>
              <option value="cli">CLI Tool</option>
            </select>
          </div>

          <div>
            <label className="block text-holo-cyan/70 text-sm mb-1">Team Size</label>
            <select
              value={projectContext.teamSize}
              onChange={(e) => setProjectContext(prev => ({ ...prev, teamSize: e.target.value }))}
              className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-2 py-1 text-holo-cyan text-sm"
            >
              <option value="solo">Solo Developer</option>
              <option value="small">Small Team (2-5)</option>
              <option value="medium">Medium Team (6-20)</option>
              <option value="large">Large Team (20+)</option>
            </select>
          </div>

          <div>
            <label className="block text-holo-cyan/70 text-sm mb-1">Timeline</label>
            <select
              value={projectContext.timeline}
              onChange={(e) => setProjectContext(prev => ({ ...prev, timeline: e.target.value }))}
              className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-2 py-1 text-holo-cyan text-sm"
            >
              <option value="prototype">Prototype</option>
              <option value="mvp">MVP</option>
              <option value="production">Production</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-holo-cyan/70 text-sm mb-1">Budget</label>
            <select
              value={projectContext.budget}
              onChange={(e) => setProjectContext(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-2 py-1 text-holo-cyan text-sm"
            >
              <option value="free">Free Only</option>
              <option value="low">Low ($)</option>
              <option value="medium">Medium ($$)</option>
              <option value="high">High ($$$)</option>
            </select>
          </div>
        </div>
      </HudPanel>

      {/* Category Filter */}
      <HudPanel>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <HudButton
              key={category}
              variant={selectedCategory === category ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </HudButton>
          ))}
        </div>

        <div className="text-holo-cyan/70 text-sm">
          Showing {filteredRecommendations.length} recommendations
          {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
        </div>
      </HudPanel>

      {/* Recommendations Grid */}
      {isLoading ? (
        <HudPanel>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-holo-cyan border-t-transparent rounded-full mr-4"></div>
            <span className="text-holo-cyan">Analyzing your project and generating recommendations...</span>
          </div>
        </HudPanel>
      ) : filteredRecommendations.length === 0 ? (
        <HudPanel>
          <div className="text-center py-12">
            <span className="text-holo-amber text-lg">🤔 No recommendations found</span>
            <div className="text-holo-cyan/70 mt-2">
              Try adjusting your project context or category filter
            </div>
          </div>
        </HudPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <HudPanel key={rec.pluginId} className="hover:border-holo-cyan/50 transition-colors">
              {/* Plugin Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-holo-cyan font-bold text-lg">{rec.plugin.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-holo-cyan/70">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rec.plugin.price === 0 ? 'bg-holo-green/20 text-holo-green' : 'bg-holo-amber/20 text-holo-amber'
                    }`}>
                      {rec.plugin.price === 0 ? 'FREE' : `$${rec.plugin.price}`}
                    </span>
                    <span>⭐ {rec.plugin.rating}</span>
                    <span>📥 {rec.plugin.downloads}</span>
                  </div>
                </div>
                <div className={`text-right ${getConfidenceColor(rec.confidence)}`}>
                  <div className="text-sm font-semibold">
                    {Math.round(rec.confidence * 100)}%
                  </div>
                  <div className="text-xs">
                    {getConfidenceLabel(rec.confidence)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-holo-cyan/80 text-sm mb-3 line-clamp-2">
                {rec.plugin.description}
              </p>

              {/* Languages & Category */}
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-holo-purple/20 text-holo-purple px-2 py-1 rounded">
                  {rec.plugin.category}
                </span>
                {rec.plugin.languages.slice(0, 2).map(lang => (
                  <span key={lang} className="text-xs bg-holo-cyan/20 text-holo-cyan px-2 py-1 rounded">
                    {lang}
                  </span>
                ))}
                {rec.plugin.languages.length > 2 && (
                  <span className="text-xs text-holo-cyan/70">
                    +{rec.plugin.languages.length - 2} more
                  </span>
                )}
              </div>

              {/* Recommendation Reasons */}
              {rec.reasons && rec.reasons.length > 0 && (
                <div className="mb-3">
                  <div className="text-holo-amber text-sm font-semibold mb-1">💡 Why recommended:</div>
                  <ul className="text-sm text-holo-cyan/80 space-y-1">
                    {rec.reasons.slice(0, 2).map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-holo-green mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation Sources */}
              <div className="mb-4">
                <div className="text-holo-cyan/70 text-xs mb-1">Based on:</div>
                <div className="flex flex-wrap gap-1">
                  {rec.sources.map(source => (
                    <span key={source} className="text-xs bg-holo-cyan/10 text-holo-cyan px-2 py-1 rounded">
                      {source.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <HudButton
                  onClick={() => installPlugin(rec.pluginId)}
                  className="flex-1"
                  size="sm"
                >
                  📥 Install
                </HudButton>
                <HudButton size="sm" variant="ghost">
                  ℹ️ Details
                </HudButton>
              </div>
            </HudPanel>
          ))}
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-void-surface/50 rounded-lg border border-holo-cyan/20">
        <div className="text-xs text-holo-cyan/70 text-center">
          🤖 AI Recommendations | 📊 {recommendations.length} total recommendations |
          🎯 Confidence threshold: 70% | 🔄 Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default AIRecommendations;
