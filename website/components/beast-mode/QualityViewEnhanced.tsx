"use client";

import React, { useState, useEffect } from 'react';
import { CardEnhanced, CardHeaderEnhanced, CardTitleEnhanced, CardDescriptionEnhanced, CardContentEnhanced } from '../ui/CardEnhanced';
import { ButtonEnhanced } from '../ui/ButtonEnhanced';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import { Search, Scan, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import QualityExplanationTooltip from '../llm/QualityExplanationTooltip';

/**
 * Enhanced Quality View
 * 
 * UX Principles Applied:
 * 1. Visual Hierarchy - Clear primary action (Scan Repository)
 * 2. Progressive Disclosure - Summary first, details on demand
 * 3. Cognitive Load Reduction - Simple, focused interface
 * 4. Feedback - Clear loading, success, error states
 * 5. Empty States - Helpful onboarding for new users
 */

interface QualityViewEnhancedProps {
  data?: any;
  onScan?: (repo: string) => Promise<any>;
}

export default function QualityViewEnhanced({ data, onScan }: QualityViewEnhancedProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [hasScans, setHasScans] = useState(false);
  const [latestScan, setLatestScan] = useState<any>(null);

  // Check if user has any scans
  useEffect(() => {
    // This would come from props or API
    if (data?.latestScan) {
      setLatestScan(data.latestScan);
      setHasScans(true);
    }
  }, [data]);

  const handleScan = async () => {
    if (!repoInput.trim()) return;
    
    setIsScanning(true);
    try {
      if (onScan) {
        const result = await onScan(repoInput.trim());
        if (result) {
          setLatestScan(result);
          setHasScans(true);
        }
      } else {
        // Default scan behavior - use GitHub scan API
        const response = await fetch('/api/github/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: repoInput.trim(), url: `https://github.com/${repoInput.trim()}` })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Scan failed');
        }
        
        const result = await response.json();
        setLatestScan(result);
        setHasScans(true);
      }
    } catch (error: any) {
      // Show error to user via notification system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beast-mode-notification', {
          detail: { 
            type: 'error', 
            message: error.message || 'Scan failed. Please try again.' 
          }
        }));
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Empty State - No scans yet
  if (!hasScans) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Hero Section - Clear primary action */}
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 mb-4">
            <Scan className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Scan Your Repository
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Get instant quality insights for any GitHub repository. See what's working, what needs improvement, and get actionable recommendations.
          </p>
        </div>

        {/* Primary Action - Prominent Scan Input */}
        <CardEnhanced hover interactive className="border-cyan-500/30">
          <CardContentEnhanced className="p-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="owner/repo (e.g., facebook/react)"
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <ButtonEnhanced
                  size="lg"
                  variant="gradient"
                  icon={<Scan className="w-5 h-5" />}
                  iconPosition="left"
                  onClick={handleScan}
                  loading={isScanning}
                  disabled={!repoInput.trim() || isScanning}
                  className="min-w-[140px]"
                >
                  {isScanning ? 'Scanning...' : 'Scan Repository'}
                </ButtonEnhanced>
              </div>
              
              {/* Quick Examples */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-3">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {['facebook/react', 'vercel/next.js', 'microsoft/vscode'].map((example) => (
                    <button
                      key={example}
                      onClick={() => {
                        setRepoInput(example);
                        setTimeout(() => handleScan(), 100);
                      }}
                      className="px-3 py-1.5 text-sm bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContentEnhanced>
        </CardEnhanced>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardEnhanced hover>
            <CardContentEnhanced className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Quality Score</h3>
              <p className="text-sm text-slate-400">Get a 0-100 quality score with detailed breakdown</p>
            </CardContentEnhanced>
          </CardEnhanced>

          <CardEnhanced hover>
            <CardContentEnhanced className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Issue Detection</h3>
              <p className="text-sm text-slate-400">Identify problems before they reach production</p>
            </CardContentEnhanced>
          </CardEnhanced>

          <CardEnhanced hover>
            <CardContentEnhanced className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">AI Recommendations</h3>
              <p className="text-sm text-slate-400">Get actionable improvements powered by AI</p>
            </CardContentEnhanced>
          </CardEnhanced>
        </div>
      </div>
    );
  }

  // Has Scans - Show Results with Progressive Disclosure
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quality Analysis</h1>
          <p className="text-slate-400">Monitor and improve your code quality</p>
        </div>
        <ButtonEnhanced
          variant="gradient"
          icon={<Scan className="w-5 h-5" />}
          iconPosition="left"
          onClick={() => setHasScans(false)}
        >
          Scan New Repository
        </ButtonEnhanced>
      </div>

      {/* Latest Scan Summary - Prominent */}
      {latestScan && (
        <CardEnhanced hover className="border-cyan-500/30">
          <CardHeaderEnhanced>
            <div className="flex items-center justify-between">
              <div>
                <CardTitleEnhanced className="text-2xl mb-2">
                  {latestScan.repo || 'Repository'}
                </CardTitleEnhanced>
                <CardDescriptionEnhanced>
                  Last scanned: {latestScan.timestamp ? new Date(latestScan.timestamp).toLocaleString() : 'Recently'}
                </CardDescriptionEnhanced>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className={`text-4xl font-bold mb-1 ${
                    latestScan.score >= 80 ? 'text-green-400' :
                    latestScan.score >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {latestScan.score || 0}
                    <span className="text-2xl text-slate-400">/100</span>
                  </div>
                  <QualityExplanationTooltip
                    score={(latestScan.score || 0) / 100}
                    code={latestScan.codeSnippet || ''}
                    issues={latestScan.issues || []}
                    repo={latestScan.repo}
                    filePath={latestScan.filePath}
                  />
                </div>
                <div className="text-sm text-slate-400">Quality Score</div>
              </div>
            </div>
          </CardHeaderEnhanced>
          <CardContentEnhanced>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">{latestScan.issues || 0}</div>
                <div className="text-xs text-slate-400">Issues Found</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">{latestScan.improvements || 0}</div>
                <div className="text-xs text-slate-400">Improvements</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">{latestScan.filesScanned || 0}</div>
                <div className="text-xs text-slate-400">Files Scanned</div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white mb-1">{latestScan.confidence || 0}%</div>
                <div className="text-xs text-slate-400">Confidence</div>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap gap-3">
              <ButtonEnhanced variant="default" icon={<CheckCircle2 className="w-4 h-4" />}>
                View Details
              </ButtonEnhanced>
              <ButtonEnhanced variant="outline" icon={<TrendingUp className="w-4 h-4" />}>
                View Trends
              </ButtonEnhanced>
              <ButtonEnhanced variant="outline" icon={<Sparkles className="w-4 h-4" />}>
                Get Recommendations
              </ButtonEnhanced>
            </div>
          </CardContentEnhanced>
        </CardEnhanced>
      )}

      {/* Additional content would go here - progressively disclosed */}
    </div>
  );
}
