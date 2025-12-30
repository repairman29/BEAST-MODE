"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export default function SelfImprovement() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/beast-mode/self-improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card className="bg-slate-950/50 border-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Self-Improvement Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-400">
            Analyze this BEAST MODE website and get AI-powered recommendations for improvements.
          </p>
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-white text-black hover:bg-slate-100"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>
                Analyzing...
              </span>
            ) : (
              'Analyze This Site'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="text-red-400">{error}</div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="bg-slate-950/50 border-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-400">Current Score</div>
                <div className="text-2xl font-bold text-white">{results.currentScore || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Issues Found</div>
                <div className="text-2xl font-bold text-white">{results.issues?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Recommendations</div>
                <div className="text-2xl font-bold text-white">{results.recommendations?.length || 0}</div>
              </div>
            </div>

            {results.recommendations && results.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div>
                        <div className="text-white font-medium">{rec.title}</div>
                        <div className="text-slate-400 text-sm">{rec.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

