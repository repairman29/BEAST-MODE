"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Sparkles, Loader2, Download, FileText } from 'lucide-react';

interface DocumentationPanelProps {
  initialCode?: string;
  type?: 'api' | 'readme' | 'guide';
  onDocumentationGenerated?: (docs: string) => void;
}

export default function DocumentationPanel({
  initialCode = '',
  type = 'api',
  onDocumentationGenerated
}: DocumentationPanelProps) {
  const [code, setCode] = useState(initialCode);
  const [documentation, setDocumentation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [docType, setDocType] = useState<'api' | 'readme' | 'guide'>(type);

  const generateDocumentation = async () => {
    if (!code.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/llm/documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type: docType,
          options: {
            includeExamples: true,
            includeUsage: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const docs = data.documentation || data.result?.documentation || '';
        setDocumentation(docs);
        if (onDocumentationGenerated) {
          onDocumentationGenerated(docs);
        }
      }
    } catch (error) {
      console.error('Failed to generate documentation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocumentation = () => {
    if (!documentation) return;

    const blob = new Blob([documentation], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentation-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">Documentation Generator</CardTitle>
          </div>
          <div className="flex gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white"
            >
              <option value="api">API Docs</option>
              <option value="readme">README</option>
              <option value="guide">Guide</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Code to Document</label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm min-h-[200px]"
          />
        </div>

        <Button
          onClick={generateDocumentation}
          disabled={!code.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Documentation...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Documentation
            </>
          )}
        </Button>

        {documentation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Generated Documentation</label>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocumentation}
                className="h-8"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded p-4 text-sm text-slate-300 max-h-[400px] overflow-y-auto prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{documentation}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
