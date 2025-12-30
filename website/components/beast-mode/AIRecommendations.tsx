"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

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
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
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
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">🤖 AI Recommendations</CardTitle>
            <Button onClick={fetchRecommendations} disabled={isLoading} className="bg-white text-black hover:bg-slate-100">
              {isLoading ? '🔄 Analyzing...' : '🔍 Get Recommendations'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>

        {/* Project Context */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Project Type</label>
            <select
              value={projectContext.type}
              onChange={(e) => setProjectContext(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="web">Web App</option>
              <option value="mobile">Mobile App</option>
              <option value="api">API Service</option>
              <option value="desktop">Desktop App</option>
              <option value="cli">CLI Tool</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Team Size</label>
            <select
              value={projectContext.teamSize}
              onChange={(e) => setProjectContext(prev => ({ ...prev, teamSize: e.target.value }))}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="solo">Solo Developer</option>
              <option value="small">Small Team (2-5)</option>
              <option value="medium">Medium Team (6-20)</option>
              <option value="large">Large Team (20+)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Timeline</label>
            <select
              value={projectContext.timeline}
              onChange={(e) => setProjectContext(prev => ({ ...prev, timeline: e.target.value }))}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="prototype">Prototype</option>
              <option value="mvp">MVP</option>
              <option value="production">Production</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Budget</label>
            <select
              value={projectContext.budget}
              onChange={(e) => setProjectContext(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="free">Free Only</option>
              <option value="low">Low ($)</option>
              <option value="medium">Medium ($$)</option>
              <option value="high">High ($$$)</option>
            </select>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`capitalize ${
                  selectedCategory === category 
                    ? 'bg-white text-black hover:bg-slate-100' 
                    : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="text-slate-400 text-sm">
            Showing {filteredRecommendations.length} recommendations
            {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Grid */}
      {isLoading ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
            <span className="text-cyan-400">Analyzing your project and generating recommendations...</span>
          </CardContent>
        </Card>
      ) : filteredRecommendations.length === 0 ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="text-center py-12">
            <div className="text-amber-400 text-lg mb-2">🤔 No recommendations found</div>
            <div className="text-slate-400 text-sm">
              Try adjusting your project context or category filter
            </div>
            <Button onClick={fetchRecommendations} className="mt-4 bg-white text-black hover:bg-slate-100">
              🔍 Get Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.pluginId} className="bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 transition-colors">
              <CardContent className="p-6">
              {/* Plugin Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{rec.plugin.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rec.plugin.price === 0 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
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
              <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                {rec.plugin.description}
              </p>

              {/* Languages & Category */}
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                  {rec.plugin.category}
                </span>
                {rec.plugin.languages.slice(0, 2).map(lang => (
                  <span key={lang} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                    {lang}
                  </span>
                ))}
                {rec.plugin.languages.length > 2 && (
                  <span className="text-xs text-slate-500">
                    +{rec.plugin.languages.length - 2} more
                  </span>
                )}
              </div>

              {/* Recommendation Reasons */}
              {rec.reasons && rec.reasons.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setExpandedRecommendation(expandedRecommendation === rec.pluginId ? null : rec.pluginId)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between text-amber-400 text-sm font-semibold mb-1">
                      <span>💡 Why recommended:</span>
                      <span className="text-xs">
                        {expandedRecommendation === rec.pluginId ? '▼' : '▶'} {rec.reasons.length} reasons
                      </span>
                    </div>
                  </button>
                  <ul className={`text-sm text-slate-300 space-y-1 transition-all ${
                    expandedRecommendation === rec.pluginId ? 'max-h-none' : 'max-h-20 overflow-hidden'
                  }`}>
                    {rec.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  {expandedRecommendation === rec.pluginId && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <div className="text-xs text-slate-500 mb-1">Match Factors:</div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400">
                          • Score: {rec.score}/100
                        </div>
                        <div className="text-xs text-slate-400">
                          • Confidence: {Math.round(rec.confidence * 100)}%
                        </div>
                        {rec.plugin.category && (
                          <div className="text-xs text-slate-400">
                            • Category match: {rec.plugin.category}
                          </div>
                        )}
                        {rec.plugin.languages.length > 0 && (
                          <div className="text-xs text-slate-400">
                            • Language support: {rec.plugin.languages.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendation Sources */}
              <div className="mb-4">
                <div className="text-slate-400 text-xs mb-1">Based on:</div>
                <div className="flex flex-wrap gap-1">
                  {rec.sources.map(source => (
                    <span key={source} className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">
                      {source.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => installPlugin(rec.pluginId)}
                  className="flex-1 bg-white text-black hover:bg-slate-100"
                  size="sm"
                >
                  📥 Install
                </Button>
                <Button size="sm" variant="outline" className="border-slate-800">
                  ℹ️ Details
                </Button>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="text-xs text-slate-400 text-center">
          🤖 AI Recommendations | 📊 {recommendations.length} total recommendations |
          🎯 Confidence threshold: 70% | 🔄 Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default AIRecommendations;
