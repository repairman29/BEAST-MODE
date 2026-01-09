"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sparkles, Loader2, CheckCircle2, Code2 } from 'lucide-react';

interface IssueRecommendationCardProps {
  issue: string | {
    type: string;
    description: string;
    severity?: 'low' | 'medium' | 'high';
  };
  code: string;
  filePath?: string;
  repo?: string;
  onApplyFix?: (fix: string) => void;
}

export default function IssueRecommendationCard({
  issue,
  code,
  filePath,
  repo,
  onApplyFix
}: IssueRecommendationCardProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, [issue, code]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const issueDescription = typeof issue === 'string' 
        ? issue 
        : issue.description;

      const response = await fetch('/api/llm/issue-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: issueDescription,
          code,
          filePath,
          options: {
            repo,
            includeCode: true,
            includeExamples: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.warn('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFix = (index: number, fix: string) => {
    setAppliedFixes(new Set(Array.from(appliedFixes).concat(index)));
    if (onApplyFix) {
      onApplyFix(fix);
    }
  };

  const issueType = typeof issue === 'string' ? issue : issue.type;
  const issueDescription = typeof issue === 'string' ? issue : issue.description;
  const severity = typeof issue === 'object' ? issue.severity : 'medium';

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white text-sm">{issueType}</CardTitle>
            {severity && (
              <Badge 
                variant={
                  severity === 'high' ? 'destructive' :
                  severity === 'medium' ? 'default' : 'secondary'
                }
                className="text-xs"
              >
                {severity}
              </Badge>
            )}
          </div>
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-slate-400 text-sm mt-2">{issueDescription}</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating recommendations...</span>
          </div>
        )}

        {!isLoading && recommendations.length === 0 && (
          <div className="text-slate-400 text-sm py-4">
            No recommendations available at this time.
          </div>
        )}

        {!isLoading && recommendations.length > 0 && (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  appliedFixes.has(index)
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-white text-sm font-medium mb-1">
                      {rec.title || `Recommendation ${index + 1}`}
                    </h5>
                    <p className="text-slate-300 text-sm mb-2">
                      {rec.description || rec.fix}
                    </p>
                    {rec.code && (
                      <pre className="bg-slate-900 rounded p-2 text-xs text-slate-300 overflow-x-auto mb-2">
                        <code>{rec.code}</code>
                      </pre>
                    )}
                    {rec.explanation && (
                      <p className="text-slate-400 text-xs italic">
                        {rec.explanation}
                      </p>
                    )}
                  </div>
                  {appliedFixes.has(index) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyFix(index, rec.fix || rec.code || '')}
                      className="flex-shrink-0"
                    >
                      Apply Fix
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
