'use client';

/**
 * Feature Panel Component
 * 
 * Displays and manages IDE features
 */

import { useState, useEffect } from 'react';
import { featureRegistry, Feature } from '@/lib/ide/featureRegistry';

interface FeaturePanelProps {
  onFeatureSelect?: (feature: Feature) => void;
}

export default function FeaturePanel({ onFeatureSelect }: FeaturePanelProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatures = () => {
      const allFeatures = featureRegistry.getAllFeatures();
      setFeatures(allFeatures);
      setLoading(false);
    };

    loadFeatures();
  }, []);

  const categories = ['All', 'File Management', 'Code Editing', 'Terminal', 'AI Assistance', 'Quality Assurance', 'Code Completion'];
  
  const filteredFeatures = selectedCategory === 'All'
    ? features
    : features.filter(f => f.category.includes(selectedCategory));

  if (loading) {
    return (
      <div className="p-4 text-slate-400 text-sm">Loading features...</div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Features ({features.length})</h2>
      </div>

      {/* Category Filter */}
      <div className="p-2 border-b border-slate-700">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Features List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFeatures.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No features found
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFeatures.map((feature) => (
              <button
                key={feature.id}
                onClick={() => onFeatureSelect?.(feature)}
                className="w-full text-left p-2 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="text-sm font-medium text-slate-200">{feature.title}</div>
                <div className="text-xs text-slate-400 mt-1">{feature.category}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
