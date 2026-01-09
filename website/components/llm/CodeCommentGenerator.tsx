"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Sparkles, Loader2, Copy, CheckCircle2 } from 'lucide-react';

interface CodeCommentGeneratorProps {
  initialCode?: string;
  language?: string;
  onCodeGenerated?: (commentedCode: string) => void;
}

export default function CodeCommentGenerator({
  initialCode = '',
  language = 'javascript',
  onCodeGenerated
}: CodeCommentGeneratorProps) {
  const [code, setCode] = useState(initialCode);
  const [commentedCode, setCommentedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState<'minimal' | 'detailed' | 'verbose'>('detailed');
  const [copied, setCopied] = useState(false);

  const generateComments = async () => {
    if (!code.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/llm/code-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          style,
          options: {
            includeFunctionDocs: true,
            includeInlineComments: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.commentedCode || data.result?.commentedCode || '';
        setCommentedCode(result);
        if (onCodeGenerated) {
          onCodeGenerated(result);
        }
      }
    } catch (error) {
      console.error('Failed to generate comments:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (commentedCode) {
      await navigator.clipboard.writeText(commentedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">Code Comment Generator</CardTitle>
          </div>
          <div className="flex gap-2">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white"
            >
              <option value="minimal">Minimal</option>
              <option value="detailed">Detailed</option>
              <option value="verbose">Verbose</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Code to Comment</label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm min-h-[200px]"
          />
        </div>

        <Button
          onClick={generateComments}
          disabled={!code.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Comments...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Comments
            </>
          )}
        </Button>

        {commentedCode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Commented Code</label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="h-8"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-slate-800 border border-slate-700 rounded p-4 text-sm text-slate-300 font-mono overflow-x-auto max-h-[400px] overflow-y-auto">
              <code>{commentedCode}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
