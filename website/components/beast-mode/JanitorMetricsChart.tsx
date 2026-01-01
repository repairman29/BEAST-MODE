"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface MetricData {
  date: string;
  issuesFixed: number;
  violationsBlocked: number;
  testsRun: number;
  scansRun: number;
}

export default function JanitorMetricsChart() {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/beast-mode/janitor/metrics?range=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.metrics || []);
      } else {
        // Mock data
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const mockData: MetricData[] = [];
        for (let i = days - 1; i >= 0; i--) {
          mockData.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            issuesFixed: Math.floor(Math.random() * 30) + 10,
            violationsBlocked: Math.floor(Math.random() * 15) + 5,
            testsRun: Math.floor(Math.random() * 20) + 5,
            scansRun: Math.floor(Math.random() * 50) + 20
          });
        }
        setData(mockData);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.issuesFixed, d.violationsBlocked, d.testsRun, d.scansRun)),
    1
  );

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Metrics Over Time</CardTitle>
            <CardDescription className="text-slate-400">
              Track janitor performance over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  timeRange === range
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-slate-400">Issues Fixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-slate-400">Violations Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 rounded"></div>
              <span className="text-slate-400">Tests Run</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-slate-400">Scans Run</span>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {data.map((point, idx) => {
                const date = new Date(point.date);
                const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex flex-col items-center gap-0.5 relative">
                      {/* Issues Fixed */}
                      <div
                        className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-400 group-hover:opacity-90"
                        style={{ height: `${(point.issuesFixed / maxValue) * 100}%` }}
                        title={`Issues Fixed: ${point.issuesFixed}`}
                      ></div>
                      {/* Violations Blocked */}
                      <div
                        className="w-full bg-blue-500 transition-all hover:bg-blue-400 group-hover:opacity-90"
                        style={{ height: `${(point.violationsBlocked / maxValue) * 100}%` }}
                        title={`Violations Blocked: ${point.violationsBlocked}`}
                      ></div>
                      {/* Tests Run */}
                      <div
                        className="w-full bg-cyan-500 transition-all hover:bg-cyan-400 group-hover:opacity-90"
                        style={{ height: `${(point.testsRun / maxValue) * 100}%` }}
                        title={`Tests Run: ${point.testsRun}`}
                      ></div>
                      {/* Scans Run */}
                      <div
                        className="w-full bg-orange-500 rounded-b transition-all hover:bg-orange-400 group-hover:opacity-90"
                        style={{ height: `${(point.scansRun / maxValue) * 100}%` }}
                        title={`Scans Run: ${point.scansRun}`}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {dayLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {data.reduce((sum, d) => sum + d.issuesFixed, 0)}
              </div>
              <div className="text-xs text-slate-500">Total Issues Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {data.reduce((sum, d) => sum + d.violationsBlocked, 0)}
              </div>
              <div className="text-xs text-slate-500">Violations Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {data.reduce((sum, d) => sum + d.testsRun, 0)}
              </div>
              <div className="text-xs text-slate-500">Tests Run</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {data.reduce((sum, d) => sum + d.scansRun, 0)}
              </div>
              <div className="text-xs text-slate-500">Scans Run</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

