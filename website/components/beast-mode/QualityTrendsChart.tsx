'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface QualitySnapshot {
  quality_score: number;
  average_file_score: number | null;
  created_at: string;
}

interface QualityTrends {
  repository: string;
  period: string;
  snapshots: QualitySnapshot[];
  trend: {
    direction: 'improving' | 'declining' | 'stable' | 'insufficient_data';
    change: number;
    changePercent?: string;
  };
}

interface QualityTrendsChartProps {
  repo: string;
  days?: number;
}

export default function QualityTrendsChart({ repo, days = 30 }: QualityTrendsChartProps) {
  const [trends, setTrends] = useState<QualityTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, [repo, days]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/repos/quality/history?repo=${encodeURIComponent(repo)}&type=trends&days=${days}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quality trends');
      }

      const data = await response.json();
      setTrends(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quality Trends</CardTitle>
          <CardDescription className="text-slate-400">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quality Trends</CardTitle>
          <CardDescription className="text-slate-400">Error loading trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!trends || trends.snapshots.length === 0) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quality Trends</CardTitle>
          <CardDescription className="text-slate-400">No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-500 text-sm">No quality snapshots found for this repository.</div>
        </CardContent>
      </Card>
    );
  }

  const snapshots = trends.snapshots;
  const maxQuality = Math.max(...snapshots.map(s => s.quality_score), 1);
  const minQuality = Math.min(...snapshots.map(s => s.quality_score), 0);
  const qualityRange = maxQuality - minQuality || 1;

  // Calculate chart dimensions
  const chartHeight = 200;
  const chartWidth = 100;
  const pointSpacing = chartWidth / Math.max(snapshots.length - 1, 1);

  // Generate path for line chart
  const points = snapshots.map((snapshot, index) => {
    const x = index * pointSpacing;
    const y = chartHeight - ((snapshot.quality_score - minQuality) / qualityRange) * chartHeight;
    return { x, y, quality: snapshot.quality_score, date: snapshot.created_at };
  });

  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  const getTrendColor = () => {
    switch (trends.trend.direction) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      case 'stable':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  const getTrendIcon = () => {
    switch (trends.trend.direction) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Quality Trends</CardTitle>
            <CardDescription className="text-slate-400">
              {trends.period} • {snapshots.length} snapshots
            </CardDescription>
          </div>
          <div className={`text-2xl ${getTrendColor()}`}>
            {getTrendIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Trend Summary */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Trend</div>
              <div className={`text-lg font-semibold ${getTrendColor()}`}>
                {trends.trend.direction.charAt(0).toUpperCase() + trends.trend.direction.slice(1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Change</div>
              <div className={`text-lg font-semibold ${getTrendColor()}`}>
                {trends.trend.change > 0 ? '+' : ''}{(trends.trend.change * 100).toFixed(1)}%
                {trends.trend.changePercent && (
                  <span className="text-xs text-slate-500 ml-1">({trends.trend.changePercent}%)</span>
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative" style={{ height: `${chartHeight}px`, width: '100%' }}>
            <svg width="100%" height={chartHeight} className="overflow-visible">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((value) => {
                const y = chartHeight - (value * chartHeight);
                return (
                  <line
                    key={value}
                    x1="0"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Line path */}
              <path
                d={pathData}
                fill="none"
                stroke="rgb(34, 211, 238)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="rgb(34, 211, 238)"
                  className="hover:r-6 transition-all cursor-pointer"
                  title={`${(point.quality * 100).toFixed(1)}% - ${new Date(point.date).toLocaleDateString()}`}
                />
              ))}
            </svg>

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-500 pr-2">
              <span>{(maxQuality * 100).toFixed(0)}%</span>
              <span>{(minQuality * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Latest snapshot */}
          {snapshots.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-400">
                Latest: <span className="text-white font-semibold">{(snapshots[snapshots.length - 1].quality_score * 100).toFixed(1)}%</span>
              </div>
              <div className="text-slate-400">
                {new Date(snapshots[snapshots.length - 1].created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

