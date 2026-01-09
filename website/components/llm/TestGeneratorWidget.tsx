"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Sparkles, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TestGeneratorWidgetProps {
  initialCode?: string;
  framework?: 'jest' | 'mocha' | 'vitest' | 'pytest';
  onTestsGenerated?: (tests: string) => void;
}

export default function TestGeneratorWidget({
  initialCode = '',
  framework = 'jest',
  onTestsGenerated
}: TestGeneratorWidgetProps) {
  const [code, setCode] = useState(initialCode);
  const [tests, setTests] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testFramework, setTestFramework] = useState<'jest' | 'mocha' | 'vitest' | 'pytest'>(framework);

  const generateTests = async () => {
    if (!code.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/llm/test-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          framework: testFramework,
          options: {
            includeEdgeCases: true,
            includeErrorHandling: true,
            coverage: 'high'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const generatedTests = data.tests || data.result?.tests || '';
        setTests(generatedTests);
        if (onTestsGenerated) {
          onTestsGenerated(generatedTests);
        }
      }
    } catch (error) {
      console.error('Failed to generate tests:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const runTests = async () => {
    if (!tests) return;

    setIsRunning(true);
    try {
      // In a real implementation, this would execute the tests
      // For now, we'll simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResults({
        passed: Math.floor(Math.random() * 5) + 3,
        failed: Math.floor(Math.random() * 2),
        total: 5,
        coverage: Math.floor(Math.random() * 20) + 80
      });
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">Test Generator</CardTitle>
          </div>
          <div className="flex gap-2">
            <select
              value={testFramework}
              onChange={(e) => setTestFramework(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white"
            >
              <option value="jest">Jest</option>
              <option value="mocha">Mocha</option>
              <option value="vitest">Vitest</option>
              <option value="pytest">Pytest</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Code to Test</label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm min-h-[150px]"
          />
        </div>

        <Button
          onClick={generateTests}
          disabled={!code.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Tests...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Tests
            </>
          )}
        </Button>

        {tests && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Generated Tests</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runTests}
                  disabled={isRunning}
                  className="h-8"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>
              </div>
            </div>

            {testResults && (
              <div className="flex gap-4 p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">
                    {testResults.passed}/{testResults.total} passed
                  </span>
                </div>
                {testResults.failed > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {testResults.failed} failed
                  </Badge>
                )}
                <div className="ml-auto text-sm text-slate-400">
                  Coverage: {testResults.coverage}%
                </div>
              </div>
            )}

            <pre className="bg-slate-800 border border-slate-700 rounded p-4 text-sm text-slate-300 font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
              <code>{tests}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
