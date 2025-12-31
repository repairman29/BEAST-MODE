"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface Prediction {
  type: string;
  current?: number;
  predicted?: number | string;
  confidence: number;
  timeframe: string;
  factors: string[];
  description?: string;
  impact?: string;
}

interface RiskAssessment {
  overallRisk: string;
  risks: Array<{
    type: string;
    severity: string;
    description: string;
    impact: string;
  }>;
  trends: {
    direction: string;
    rate: number;
    volatility: number;
    currentScore: number;
    projectedScore: number;
  };
  predictions: Prediction[];
  recommendations: Array<{
    priority: string;
    action: string;
    steps: string[];
  }>;
}

interface PredictiveAnalyticsProps {
  userId?: string;
}

export default function PredictiveAnalytics({ userId }: PredictiveAnalyticsProps) {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [predictionHorizon, setPredictionHorizon] = useState(30);

  useEffect(() => {
    fetchPredictions();
  }, [userId, predictionHorizon]);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      // Get current state (would come from quality engine)
      const currentState = {
        score: 85,
        issues: [],
        testCoverage: 75
      };

      // Get historical data (would come from database)
      const historicalData = [
        { score: 80, timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { score: 82, timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { score: 84, timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { score: 85, timestamp: new Date().toISOString() }
      ];

      const response = await fetch('/api/beast-mode/intelligence/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentState,
          historicalData,
          predictionHorizon
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAssessment(data.riskAssessment);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Analyzing predictions...</span>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">🔮</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">No predictions available</div>
          <div className="text-sm text-slate-400">
            Start tracking quality metrics to enable predictive analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskColor = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400'
  }[assessment.overallRisk] || 'text-slate-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">🔮 Predictive Analytics</CardTitle>
              <CardDescription className="text-slate-400">
                Forecast future quality issues and risks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={predictionHorizon}
                onChange={(e) => setPredictionHorizon(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Risk Overview */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">⚠️ Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-3xl font-bold ${riskColor}`}>
              {assessment.overallRisk.toUpperCase()}
            </div>
            <div className="text-slate-400">
              Overall Risk Level
            </div>
          </div>

          {assessment.risks.length > 0 && (
            <div className="space-y-2">
              {assessment.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    risk.severity === 'critical' ? 'bg-red-950/50 border-red-800' :
                    risk.severity === 'high' ? 'bg-orange-950/50 border-orange-800' :
                    risk.severity === 'medium' ? 'bg-yellow-950/50 border-yellow-800' :
                    'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{risk.type.replace(/_/g, ' ')}</div>
                      <div className="text-slate-400 text-sm mt-1">{risk.description}</div>
                      <div className="text-slate-500 text-xs mt-1">Impact: {risk.impact}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      risk.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      risk.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      risk.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {risk.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictions */}
      {assessment.predictions && assessment.predictions.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📊 Quality Predictions</CardTitle>
            <CardDescription className="text-slate-400">
              Forecasted quality metrics for the next {predictionHorizon} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessment.predictions.map((prediction, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-4 rounded-lg border border-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold">{prediction.type.replace(/_/g, ' ')}</div>
                      {prediction.description && (
                        <div className="text-slate-400 text-sm mt-1">{prediction.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-400 font-semibold">
                        {typeof prediction.predicted === 'number' 
                          ? `${prediction.predicted.toFixed(1)}`
                          : prediction.predicted}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {Math.round(prediction.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>
                  {prediction.current !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>Current: {prediction.current}</span>
                      <span>→</span>
                      <span>Predicted: {prediction.predicted}</span>
                    </div>
                  )}
                  <div className="text-slate-500 text-xs mt-2">
                    Timeframe: {prediction.timeframe} • Factors: {prediction.factors.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {assessment.trends && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📈 Quality Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-slate-400 text-sm mb-1">Direction</div>
                <div className={`text-lg font-semibold ${
                  assessment.trends.direction === 'improving' ? 'text-green-400' :
                  assessment.trends.direction === 'declining' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {assessment.trends.direction}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Current Score</div>
                <div className="text-lg font-semibold text-white">
                  {assessment.trends.currentScore.toFixed(1)}/100
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Projected Score</div>
                <div className="text-lg font-semibold text-cyan-400">
                  {assessment.trends.projectedScore.toFixed(1)}/100
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Volatility</div>
                <div className="text-lg font-semibold text-slate-400">
                  {assessment.trends.volatility.toFixed(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">💡 Risk Mitigation Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessment.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-red-950/50 border-red-800' :
                    'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="text-white font-semibold mb-2">{rec.action}</div>
                  {rec.description && (
                    <div className="text-slate-400 text-sm mb-3">{rec.description}</div>
                  )}
                  {rec.steps && rec.steps.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-slate-400 text-sm mb-2">Steps:</div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm">
                        {rec.steps.map((step, stepIdx) => (
                          <li key={stepIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

