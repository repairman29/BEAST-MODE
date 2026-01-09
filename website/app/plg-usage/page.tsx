'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * PLG Component Usage Dashboard
 * 
 * Shows which components are used most to guide development
 */

interface ComponentUsage {
  componentName: string;
  componentType: string;
  count: number;
  uniqueRepos: number;
  uniqueUsers: number;
}

interface UsageStats {
  total: number;
  days: number;
  components: ComponentUsage[];
}

export default function PLGUsageDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [days, setDays] = useState(30);
  const [componentType, setComponentType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, [days, componentType]);

  const fetchUsageStats = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/plg/usage?days=${days}`;
      if (componentType) {
        url += `&type=${componentType}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'badge':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'widget':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'button':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'cards':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getUsagePercentage = (count: number) => {
    if (!stats || stats.total === 0) return 0;
    return (count / stats.total * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">PLG Component Usage Dashboard</h1>
          <p className="text-slate-400">
            Track which components are used most to guide development decisions
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Time Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Component Type:</label>
            <select
              value={componentType || ''}
              onChange={(e) => setComponentType(e.target.value || null)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="">All Types</option>
              <option value="badge">Badge</option>
              <option value="widget">Widget</option>
              <option value="button">Button</option>
              <option value="cards">Cards</option>
            </select>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Total Events</div>
                <div className="text-2xl font-bold text-white">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Unique Components</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {stats.components.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/90 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-sm text-slate-400 mb-1">Time Period</div>
                <div className="text-2xl font-bold text-purple-400">
                  {days} days
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading usage stats...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/50">
            <CardContent className="pt-6">
              <p className="text-red-400">Error: {error}</p>
              <p className="text-sm text-slate-400 mt-2">
                Make sure the database table exists and the API is running.
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Data */}
        {!loading && !error && stats && stats.components.length === 0 && (
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-slate-400 mb-4">No component usage tracked yet</p>
              <p className="text-sm text-slate-500">
                Components will start tracking when used on pages
              </p>
            </CardContent>
          </Card>
        )}

        {/* Component Usage List */}
        {!loading && !error && stats && stats.components.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Component Usage</h2>
            
            {stats.components.map((comp, idx) => (
              <Card key={comp.componentName} className="bg-slate-900/90 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {idx + 1}. {comp.componentName}
                        </h3>
                        <Badge className={getComponentTypeColor(comp.componentType)}>
                          {comp.componentType}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        {comp.componentName} component usage statistics
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">
                        {comp.count}
                      </div>
                      <div className="text-xs text-slate-400">
                        {getUsagePercentage(comp.count)}% of total
                      </div>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${getUsagePercentage(comp.count)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1">Unique Repos</div>
                      <div className="text-lg font-semibold text-green-400">
                        {comp.uniqueRepos}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1">Unique Users</div>
                      <div className="text-lg font-semibold text-purple-400">
                        {comp.uniqueUsers}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Insights */}
            {stats.components.length > 0 && (
              <Card className="bg-cyan-900/20 border-cyan-500/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">💡 Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300">
                      <strong>Most Used:</strong> {stats.components[0].componentName} ({stats.components[0].count} uses)
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Recommendation:</strong> Focus on improving {stats.components[0].componentName} and building more features using this component.
                    </p>
                    {stats.components.length > 1 && (
                      <p className="text-sm text-slate-400 mt-4">
                        <strong>All Components:</strong> {stats.components.map(c => c.componentName).join(', ')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
