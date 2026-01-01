"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  category: string;
  examples: string[];
}

export default function ArchitectureRulesView() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/beast-mode/janitor/architecture/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      } else {
        // Mock data
        setRules([
          {
            id: 'block-secrets',
            name: 'Block Secrets in Code',
            description: 'Prevents hardcoded API keys, passwords, and other secrets',
            enabled: true,
            severity: 'error',
            category: 'security',
            examples: [
              'const apiKey = "sk-1234567890";',
              'const password = "mypassword123";'
            ]
          },
          {
            id: 'prevent-db-in-frontend',
            name: 'Prevent Database Logic in Frontend',
            description: 'Blocks database queries and logic in frontend code',
            enabled: true,
            severity: 'error',
            category: 'architecture',
            examples: [
              'db.query("SELECT * FROM users");',
              'database.connect();'
            ]
          },
          {
            id: 'enforce-separation',
            name: 'Enforce Separation of Concerns',
            description: 'Ensures proper separation between UI, business logic, and data layers',
            enabled: true,
            severity: 'warning',
            category: 'architecture',
            examples: [
              'Business logic in component files',
              'UI rendering in utility functions'
            ]
          },
                    {
                      id: 'block-eval',
                      name: 'Block // SECURITY: eval() disabled
// eval() Usage',
                      description: 'Prevents use of // SECURITY: eval() disabled
// eval() which is a security risk',
                      enabled: true,
                      severity: 'error',
                      category: 'security',
                      examples: [
                        '// SECURITY: eval() disabled
// eval(userInput);',
                        'Function(userInput)();'
                      ]
                    },
          {
            id: 'auto-fix-patterns',
            name: 'Auto-Fix Common Patterns',
            description: 'Automatically fixes common code patterns',
            enabled: true,
            severity: 'info',
            category: 'quality',
            examples: [
              'console.log() → logger.debug()',
              'var → const/let'
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/beast-mode/janitor/architecture/rules/${ruleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (response.ok) {
        setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const categories = ['all', ...Array.from(new Set(rules.map(r => r.category)))];
  const filteredRules = selectedCategory === 'all'
    ? rules
    : rules.filter(r => r.category === selectedCategory);

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading rules...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Architecture Rules</CardTitle>
        <CardDescription className="text-slate-400">
          Configure rules that prevent bad patterns and enforce best practices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-sm font-semibold text-white mb-2">Categories</div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={
                  selectedCategory === cat
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-white font-semibold">{rule.name}</div>
                    <Badge
                      variant="outline"
                      className={
                        rule.severity === 'error'
                          ? 'border-red-500/30 text-red-400'
                          : rule.severity === 'warning'
                          ? 'border-yellow-500/30 text-yellow-400'
                          : 'border-blue-500/30 text-blue-400'
                      }
                    >
                      {rule.severity}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-400"
                    >
                      {rule.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-400">{rule.description}</div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => toggleRule(rule.id, e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-xs text-slate-400">
                    {rule.enabled ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>
              {rule.examples.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-500 mb-2">Examples:</div>
                  <div className="space-y-1">
                    {rule.examples.map((example, idx) => (
                      <code
                        key={idx}
                        className="block text-xs bg-slate-950 px-2 py-1 rounded text-red-400"
                      >
                        {example}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

