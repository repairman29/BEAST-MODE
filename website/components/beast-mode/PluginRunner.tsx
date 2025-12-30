"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface PluginRunnerProps {
  pluginId: string;
  pluginName: string;
  config?: any;
}

export default function PluginRunner({ pluginId, pluginName, config = {} }: PluginRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState({
    files: [],
    write: false,
    watch: false
  });

  const executePlugin = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('beastModeUserId') || 'demo-user' 
        : 'demo-user';

      const response = await fetch('/api/beast-mode/marketplace/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          config,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Execution failed');
      }

      const data = await response.json();
      setResult(data.result);

      // Show success notification
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'success',
            message: `${pluginName} executed successfully!`
          }
        });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      setError(err.message);
      
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'error',
            message: `Failed to execute ${pluginName}: ${err.message}`
          }
        });
        window.dispatchEvent(event);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white text-lg">🚀 Run {pluginName}</CardTitle>
        <CardDescription className="text-slate-400">
          Execute this plugin with your current configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Options */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Files to process (comma-separated):</label>
          <input
            type="text"
            value={Array.isArray(context.files) ? context.files.join(', ') : ''}
            onChange={(e) => setContext({
              ...context,
              files: e.target.value.split(',').map(f => f.trim()).filter(f => f)
            })}
            placeholder="src/**/*.ts, src/**/*.tsx"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={context.write}
              onChange={(e) => setContext({ ...context, write: e.target.checked })}
              className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded focus:ring-cyan-500"
            />
            <span className="text-sm text-slate-300">Write changes to files</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={context.watch}
              onChange={(e) => setContext({ ...context, watch: e.target.checked })}
              className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded focus:ring-cyan-500"
            />
            <span className="text-sm text-slate-300">Watch mode</span>
          </label>
        </div>

        {/* Execute Button */}
        <Button
          onClick={executePlugin}
          disabled={isRunning}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white smooth-transition hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <span className="animate-spin mr-2">⚡</span>
              <span className="animate-pulse">Running...</span>
            </>
          ) : (
            <>
              <span className="mr-2">▶️</span>
              Execute Plugin
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <div className="text-red-400 font-semibold mb-1">❌ Error</div>
            <div className="text-red-300 text-sm">{error}</div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="text-green-400 font-semibold mb-2">✅ Execution Results</div>
            
            {result.summary && (
              <div className="space-y-2">
                <div className="text-white font-semibold">Summary:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(result.summary).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-slate-300 font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.results && result.results.length > 0 && (
              <div className="space-y-2">
                <div className="text-white font-semibold">Details:</div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {result.results.slice(0, 10).map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded text-xs text-slate-300 mb-1">
                      <div className="font-semibold">{item.file || `Item ${idx + 1}`}</div>
                      {item.errors !== undefined && (
                        <div className="text-red-400">Errors: {item.errors}</div>
                      )}
                      {item.warnings !== undefined && (
                        <div className="text-yellow-400">Warnings: {item.warnings}</div>
                      )}
                      {item.coverage !== undefined && (
                        <div className="text-cyan-400">Coverage: {item.coverage}%</div>
                      )}
                      {item.vulnerabilities && (
                        <div className="text-red-400">Vulnerabilities: {item.vulnerabilities.length}</div>
                      )}
                    </div>
                  ))}
                  {result.results.length > 10 && (
                    <div className="text-slate-500 text-xs mt-2">
                      ... and {result.results.length - 10} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
              Executed at: {new Date(result.timestamp || Date.now()).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

