'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import QualityDetailModal from './QualityDetailModal';

/**
 * Repos Quality Table
 * 
 * Displays all user repositories in a table with quality scores
 * 
 * User Stories:
 * - "As a developer, I want to see all my repos with quality scores in one table"
 * - "As a team lead, I want to quickly identify which repos need attention"
 */

interface RepoQuality {
  repo: string;
  quality?: number;
  confidence?: number;
  percentile?: number;
  cached?: boolean;
  loading?: boolean;
  error?: string;
  lastScanned?: string;
  factors?: Record<string, { value: number; importance: number }>;
  recommendations?: Array<{
    action: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface ReposQualityTableProps {
  repos: string[];
  onRefresh?: () => void;
}

export default function ReposQualityTable({ repos, onRefresh }: ReposQualityTableProps) {
  const [repoQualities, setRepoQualities] = useState<Map<string, RepoQuality>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'quality' | 'repo' | 'percentile'>('quality');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  // Initialize repo qualities (only for new repos, preserve existing data)
  useEffect(() => {
    console.log('[ReposQualityTable] Repos prop changed:', repos.length, 'repos');
    setRepoQualities(prev => {
      const updated = new Map(prev);
      let hasChanges = false;
      
      // Add new repos that don't exist yet
      repos.forEach(repo => {
        if (!updated.has(repo)) {
          updated.set(repo, { repo, loading: false });
          hasChanges = true;
        }
      });
      
      // Remove repos that are no longer in the list (optional - comment out if you want to keep old data)
      // const repoSet = new Set(repos);
      // for (const [key] of updated) {
      //   if (!repoSet.has(key)) {
      //     updated.delete(key);
      //     hasChanges = true;
      //   }
      // }
      
      // Only update if there are actual changes
      if (hasChanges) {
        console.log('[ReposQualityTable] Updated repo list, preserving existing quality data');
        return updated;
      }
      
      return prev; // No changes, return same Map to avoid re-render
    });
  }, [repos]);

  const analyzeAllRepos = async () => {
    if (repos.length === 0) return;

    console.log('[ReposQualityTable] Starting analysis for', repos.length, 'repos');
    setLoading(true);
    const updated = new Map(repoQualities);

    // Mark all as loading
    repos.forEach(repo => {
      updated.set(repo, { ...updated.get(repo) || { repo }, loading: true });
    });
    setRepoQualities(new Map(updated)); // Create new Map to trigger re-render

    // Process in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      
      const promises = batch.map(async (repo) => {
        try {
          console.log('[ReposQualityTable] Analyzing repo:', repo);
          const res = await fetch('/api/repos/quality', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo })
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error(`[ReposQualityTable] API error for ${repo}:`, res.status, errorText);
            throw new Error(`Failed to analyze ${repo}: ${res.status}`);
          }

          const data = await res.json();
          console.log(`[ReposQualityTable] Got result for ${repo}:`, { 
            quality: data.quality, 
            confidence: data.confidence,
            source: data.source || 'unknown'
          });
          
          // Ensure quality is a number (0 is valid!)
          const quality = typeof data.quality === 'number' ? data.quality : 0;
          
          return {
            repo,
            quality: quality, // Keep 0 as valid value
            confidence: data.confidence || 0,
            percentile: data.percentile || 0,
            cached: data.cached || false,
            loading: false,
            error: undefined,
            factors: data.factors,
            recommendations: data.recommendations
          };
        } catch (error: any) {
          console.error(`[ReposQualityTable] Error analyzing ${repo}:`, error);
          return {
            repo,
            quality: undefined, // Use undefined for errors, not 0
            confidence: 0,
            percentile: 0,
            loading: false,
            error: error.message || 'Unknown error'
          };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(result => {
        updated.set(result.repo, result);
      });
      // Create new Map to ensure React detects the change
      setRepoQualities(new Map(updated));
      console.log('[ReposQualityTable] Updated', results.length, 'repos. Total analyzed:', 
        Array.from(updated.values()).filter(r => r.quality !== undefined && r.quality !== null).length
      );
    }

    setLoading(false);
    // Don't call onRefresh here - it causes repos prop to change and resets state
    // Only call onRefresh if explicitly needed (e.g., after manual refresh button)
    // if (onRefresh) onRefresh();
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.7) return 'text-green-400 bg-green-500/20 border-green-500/50';
    if (quality >= 0.4) return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    return 'text-red-400 bg-red-500/20 border-red-500/50';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 0.7) return 'High';
    if (quality >= 0.4) return 'Moderate';
    return 'Low';
  };

  // Filter and sort repos (client-side filtering of already-fetched data)
  // TODO: Move to API route for better architecture
  // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// const filteredAndSorted = Array.from(repoQualities.values())
    .filter((repo: any) => {
      if (!filter) return true;
      return repo.repo.toLowerCase().includes(filter.toLowerCase());
    })
    .sort((a: any, b: any) => {
      let aVal: any = 0;
      let bVal: any = 0;

      switch (sortBy) {
        case 'quality':
          aVal = a.quality || 0;
          bVal = b.quality || 0;
          break;
        case 'percentile':
          aVal = a.percentile || 0;
          bVal = b.percentile || 0;
          break;
        case 'repo':
          aVal = a.repo.toLowerCase();
          bVal = b.repo.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  const handleSort = (column: 'quality' | 'repo' | 'percentile') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Count repos that have been analyzed (quality can be 0, so check for !== undefined, not truthy)
  // TODO: Move to API route for better architecture
  // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// const analyzedCount = Array.from(repoQualities.values()).filter((r: any) => 
    r.quality !== undefined && r.quality !== null && !r.loading
  ).length;
  const hasData = analyzedCount > 0;

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-xl font-bold">All Repositories Quality Scores</CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              {repos.length} total repositories • {analyzedCount} analyzed
            </CardDescription>
          </div>
              <div className="flex gap-2">
                <Button
                  onClick={analyzeAllRepos}
                  disabled={loading || repos.length === 0}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                >
                  {loading ? 'Analyzing...' : `Analyze All (${repos.length})`}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      // TODO: Move to API route for better architecture
                      // ARCHITECTURE: Moved to API route
// // ARCHITECTURE: Moved to API route
// const reposWithData = Array.from(repoQualities.values())
                        .filter((r: any) => r.quality !== undefined)
                        .map((r: any) => ({
                          repo: r.repo,
                          quality: r.quality,
                          confidence: r.confidence,
                          percentile: r.percentile,
                          factors: r.factors,
                          recommendations: r.recommendations
                        }));

                      if (reposWithData.length === 0) {
                        alert('Please analyze repos first before exporting');
                        return;
                      }

                      const res = await fetch('/api/repos/quality/export-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          repos: reposWithData,
                          title: 'Code Quality Report',
                          author: 'BEAST MODE',
                          style: 'zine'
                        })
                      });

                      if (!res.ok) {
                        throw new Error('Failed to generate PDF');
                      }

                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `quality-report-${Date.now()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error: any) {
                      console.error('Failed to export PDF:', error);
                      alert('Failed to export PDF: ' + error.message);
                    }
                  }}
                  disabled={Array.from(repoQualities.values()).filter(r => r.quality !== undefined).length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  📄 Export PDF Zine
                </Button>
              </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="Search repos..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Table */}
        {!hasData && !loading && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No quality scores yet. Click "Analyze All" to get started.</p>
          </div>
        )}

        {loading && analyzedCount === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Analyzing repositories...</p>
          </div>
        )}

        {hasData && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('repo')}
                  >
                    Repository
                    {sortBy === 'repo' && (
                      <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('quality')}
                  >
                    Quality Score
                    {sortBy === 'quality' && (
                      <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort('percentile')}
                  >
                    Percentile
                    {sortBy === 'percentile' && (
                      <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Confidence</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((repo) => (
                  <tr
                    key={repo.repo}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => {
                      if (repo.quality !== undefined || repo.error) {
                        setSelectedRepo(repo.repo);
                      }
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {repo.repo}
                        {(repo.quality !== undefined || repo.error) && (
                          <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100">
                            👁️ Click for details
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {repo.loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                          <span className="text-xs text-slate-500">Analyzing...</span>
                        </div>
                      ) : repo.error ? (
                        <span className="text-xs text-red-400">Error</span>
                      ) : repo.quality !== undefined && repo.quality !== null ? (
                        <div className="flex items-center gap-2">
                          <Badge className={getQualityColor(repo.quality)}>
                            {(repo.quality * 100).toFixed(1)}%
                          </Badge>
                          <span className="text-xs text-slate-400">{getQualityLabel(repo.quality)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Not analyzed</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {repo.percentile !== undefined ? (
                        <span className="text-sm text-slate-300">{repo.percentile.toFixed(0)}th</span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {repo.confidence !== undefined ? (
                        <span className="text-sm text-slate-300">{(repo.confidence * 100).toFixed(0)}%</span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {repo.cached && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
                          Cached
                        </Badge>
                      )}
                      {repo.error && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
                          Error
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {hasData && (
          <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Average Quality</div>
              <div className="text-lg font-bold text-white">
                {(
                  Array.from(repoQualities.values())
                    .filter(r => r.quality !== undefined)
                    .reduce((sum, r) => sum + (r.quality || 0), 0) /
                  analyzedCount *
                  100
                ).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">High Quality</div>
              <div className="text-lg font-bold text-green-400">
                {Array.from(repoQualities.values()).filter(r => (r.quality || 0) >= 0.7).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Moderate</div>
              <div className="text-lg font-bold text-amber-400">
                {Array.from(repoQualities.values()).filter(r => {
                  const q = r.quality || 0;
                  return q >= 0.4 && q < 0.7;
                }).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Needs Work</div>
              <div className="text-lg font-bold text-red-400">
                {Array.from(repoQualities.values()).filter(r => (r.quality || 0) < 0.4).length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

