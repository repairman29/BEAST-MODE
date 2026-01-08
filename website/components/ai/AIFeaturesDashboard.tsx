"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

export default function AIFeaturesDashboard() {
  const [activeTab, setActiveTab] = useState<'test-gen' | 'code-review' | 'learning' | 'predictions' | 'documentation'>('test-gen');
  const [code, setCode] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleTestGeneration() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/test-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionInfo: { name: 'testFunction', params: [] },
          code,
          options: { language: 'javascript' }
        })
      });
      const data = await res.json();
      setResults(data.result);
    } catch (error) {
      console.error('Failed to generate tests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeReview() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filePath: 'test.js',
          options: {}
        })
      });
      const data = await res.json();
      setResults(data.result);
    } catch (error) {
      console.error('Failed to review code:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDocumentation() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filePath: 'test.js',
          options: { format: 'markdown' }
        })
      });
      const data = await res.json();
      setResults(data.result);
    } catch (error) {
      console.error('Failed to generate documentation:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePredictions() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bugs',
          code,
          filePath: 'test.js'
        })
      });
      const data = await res.json();
      setResults(data.result);
    } catch (error) {
      console.error('Failed to get predictions:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Features</h1>
        <p className="text-slate-400">Intelligent code generation, review, and analysis</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="test-gen">Test Generation</TabsTrigger>
          <TabsTrigger value="code-review">Code Review</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Input Code</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                className="bg-slate-800 border-slate-700 text-white font-mono min-h-[300px]"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Results</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Processing...</div>
              ) : results ? (
                <pre className="bg-slate-800 p-4 rounded text-white text-sm overflow-auto max-h-[300px]">
                  {JSON.stringify(results, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-400">Results will appear here</div>
              )}
            </CardContent>
          </Card>
        </div>

        <TabsContent value="test-gen" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Intelligent Test Generation</CardTitle>
              <CardDescription>Generate comprehensive test suites</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTestGeneration} disabled={!code || loading}>
                Generate Tests
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code-review" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Automated Code Review</CardTitle>
              <CardDescription>Review code for bugs, security, and best practices</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCodeReview} disabled={!code || loading}>
                Review Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Learning System</CardTitle>
              <CardDescription>User preferences and pattern recognition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-slate-400">
                Learning system tracks your preferences and adapts to your coding style.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Predictive Capabilities</CardTitle>
              <CardDescription>Bug prediction and quality forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handlePredictions} disabled={!code || loading}>
                Predict Bugs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Documentation Generation</CardTitle>
              <CardDescription>Generate comprehensive code documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDocumentation} disabled={!code || loading}>
                Generate Documentation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
