'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Theme {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedFiles: number;
  totalFiles: number;
  impact: string;
  recommendation: string;
  estimatedEffort: string;
  estimatedImpact: number;
}

interface Opportunity {
  type: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  estimatedQualityGain: number;
  filesToGenerate: string[];
  businessValue: string;
}

interface ThemesAndOpportunitiesProps {
  repo: string;
}

export default function ThemesAndOpportunities({ repo }: ThemesAndOpportunitiesProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (repo) {
      fetchThemes();
    }
  }, [repo]);

  const fetchThemes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/repos/quality/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch themes');
      }

      const data = await response.json();
      setThemes(data.themes || []);
      setOpportunities(data.opportunities || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getImpactColor = (impact: string) => {
    if (impact.toLowerCase().includes('high')) return 'text-green-400';
    if (impact.toLowerCase().includes('medium')) return 'text-amber-400';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Themes & Opportunities</CardTitle>
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
          <CardTitle className="text-white">Themes & Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Themes */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Codebase Themes</CardTitle>
          <CardDescription className="text-slate-400">
            Recurring patterns and systemic issues across your codebase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No themes detected. Your codebase looks good! 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {themes.map((theme, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(theme.severity)}>
                        {theme.severity}
                      </Badge>
                      <h3 className="text-white font-semibold">{theme.name}</h3>
                    </div>
                    <div className="text-xs text-slate-400">
                      {theme.affectedFiles} / {theme.totalFiles} files
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{theme.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Impact:</span>
                      <span className={`ml-2 ${getImpactColor(theme.impact)}`}>
                        {theme.impact}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Effort:</span>
                      <span className="ml-2 text-slate-300">{theme.estimatedEffort}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-sm text-cyan-400 font-medium">Recommendation:</p>
                    <p className="text-sm text-slate-300 mt-1">{theme.recommendation}</p>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/20"
                      onClick={() => {
                        // Trigger improvement plan for this theme
                        console.log('Generate improvement for theme:', theme.name);
                      }}
                    >
                      Generate Fix
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Improvement Opportunities</CardTitle>
          <CardDescription className="text-slate-400">
            Bigger improvements that can significantly boost codebase quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No major opportunities detected.
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                        {opp.type}
                      </Badge>
                      <h3 className="text-white font-semibold mt-2">{opp.title}</h3>
                    </div>
                    <div className="text-xs text-green-400 font-semibold">
                      +{((opp.estimatedQualityGain || 0) * 100).toFixed(0)}% quality
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{opp.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div>
                      <span className="text-slate-500">Impact:</span>
                      <span className={`ml-2 ${getImpactColor(opp.impact)}`}>
                        {opp.impact}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Effort:</span>
                      <span className="ml-2 text-slate-300">{opp.effort}</span>
                    </div>
                  </div>
                  {opp.filesToGenerate && opp.filesToGenerate.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">Files to generate:</p>
                      <div className="flex flex-wrap gap-1">
                        {opp.filesToGenerate.map((file, i) => (
                          <Badge
                            key={i}
                            className="bg-slate-700/50 text-slate-300 text-xs"
                          >
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Business Value:</p>
                    <p className="text-sm text-slate-300">{opp.businessValue}</p>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => {
                        // Generate code for this opportunity
                        console.log('Generate code for opportunity:', opp.title);
                      }}
                    >
                      Generate Code
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

