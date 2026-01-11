'use client';

import { useState, useEffect } from 'react';
// Use dynamic imports to avoid build issues if components don't exist
let Card: any, CardContent: any, CardDescription: any, CardHeader: any, CardTitle: any;
let Button: any;
let Badge: any;
let Alert: any, AlertDescription: any, AlertTitle: any;
let AlertCircle: any, CheckCircle: any, Lightbulb: any;

try {
  const cardModule = require('@/components/ui/card');
  Card = cardModule.Card || cardModule.default?.Card || cardModule;
  CardContent = cardModule.CardContent || cardModule.default?.CardContent || cardModule;
  CardDescription = cardModule.CardDescription || cardModule.default?.CardDescription || cardModule;
  CardHeader = cardModule.CardHeader || cardModule.default?.CardHeader || cardModule;
  CardTitle = cardModule.CardTitle || cardModule.default?.CardTitle || cardModule;
} catch (e) {
  // Fallback components
  Card = ({ children, className }: any) => <div className={className}>{children}</div>;
  CardContent = ({ children, className }: any) => <div className={className}>{children}</div>;
  CardDescription = ({ children, className }: any) => <div className={className}>{children}</div>;
  CardHeader = ({ children, className }: any) => <div className={className}>{children}</div>;
  CardTitle = ({ children, className }: any) => <h3 className={className}>{children}</h3>;
}

try {
  const buttonModule = require('@/components/ui/button');
  Button = buttonModule.Button || buttonModule.default || buttonModule;
} catch (e) {
  Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
}

try {
  const badgeModule = require('@/components/ui/badge');
  Badge = badgeModule.Badge || badgeModule.default || badgeModule;
} catch (e) {
  Badge = ({ children, ...props }: any) => <span {...props}>{children}</span>;
}

try {
  const alertModule = require('@/components/ui/alert');
  Alert = alertModule.Alert || alertModule.default?.Alert || alertModule;
  AlertDescription = alertModule.AlertDescription || alertModule.default?.AlertDescription || alertModule;
  AlertTitle = alertModule.AlertTitle || alertModule.default?.AlertTitle || alertModule;
} catch (e) {
  Alert = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  AlertDescription = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  AlertTitle = ({ children, ...props }: any) => <div {...props}>{children}</div>;
}

try {
  const lucide = require('lucide-react');
  AlertCircle = lucide.AlertCircle;
  CheckCircle = lucide.CheckCircle;
  Lightbulb = lucide.Lightbulb;
} catch (e) {
  AlertCircle = () => <span>⚠️</span>;
  CheckCircle = () => <span>✅</span>;
  Lightbulb = () => <span>💡</span>;
}

interface ErrorAnalysis {
  totalErrors: number;
  patterns: Array<{
    errorMessage: string;
    count: number;
    percentage: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  insights: Array<{
    type: string;
    severity: string;
    message: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    priority: string;
    action: string;
    details: string;
    estimatedImpact: string;
  }>;
  topErrors: Array<{
    message: string;
    count: number;
  }>;
}

export default function ErrorAnalysisDashboard() {
  const [analysis, setAnalysis] = useState<ErrorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadAnalysis();
  }, [days]);

  async function loadAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/beast-mode/error-analysis?days=${days}&limit=1000`);
      if (!response.ok) {
        throw new Error(`Failed to load analysis: ${response.statusText}`);
      }
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No error data available yet. Errors will appear here as they occur.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Analysis & Learning</h1>
          <p className="text-muted-foreground mt-1">
            How BEAST MODE learns from failures to improve code generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={days === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(7)}
          >
            7 Days
          </Button>
          <Button
            variant={days === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(30)}
          >
            30 Days
          </Button>
          <Button variant="outline" size="sm" onClick={loadAnalysis}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.totalErrors}</div>
            <p className="text-xs text-muted-foreground mt-1">Last {days} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Error Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.patterns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique patterns identified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.recommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Actionable improvements</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Errors */}
      {analysis.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Errors</CardTitle>
            <CardDescription>Most frequent errors in code generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.topErrors.slice(0, 10).map((error, i) => (
                <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive">{error.count}x</Badge>
                      <span className="text-sm font-medium">#{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {error.message.substring(0, 150)}
                      {error.message.length > 150 ? '...' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Insights
            </CardTitle>
            <CardDescription>Key findings from error analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.insights.map((insight, i) => (
                <Alert key={i} variant={insight.severity === 'high' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="capitalize">{insight.type.replace(/_/g, ' ')}</AlertTitle>
                  <AlertDescription>
                    <div className="mt-1">{insight.message}</div>
                    {insight.recommendation && (
                      <div className="mt-2 text-sm font-medium">{insight.recommendation}</div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actionable improvements based on error patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">{rec.estimatedImpact}</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">{rec.action}</h4>
                  <p className="text-sm text-muted-foreground">{rec.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Loop Info */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Loop</CardTitle>
          <CardDescription>How BEAST MODE improves from failures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold mb-1">Error Occurs</h4>
              <p className="text-xs text-muted-foreground">Logged to database</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold mb-1">Analysis</h4>
              <p className="text-xs text-muted-foreground">Patterns identified</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold mb-1">Improved Prompt</h4>
              <p className="text-xs text-muted-foreground">Generated from patterns</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">4️⃣</div>
              <h4 className="font-semibold mb-1">Better Results</h4>
              <p className="text-xs text-muted-foreground">Tracked & refined</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
