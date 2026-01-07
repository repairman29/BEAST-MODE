'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import QualityValidationReport from './QualityValidationReport';

interface FeatureGeneratorProps {
  repo: string;
  onFeatureGenerated?: (result: any) => void;
}

export default function FeatureGenerator({ repo, onFeatureGenerated }: FeatureGeneratorProps) {
  const [featureRequest, setFeatureRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [useLLM, setUseLLM] = useState(false);

  const generateFeature = async () => {
    if (!featureRequest.trim()) {
      setError('Please enter a feature request');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/repos/quality/generate-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          featureRequest: featureRequest.trim(),
          useLLM,
          llmOptions: {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 4000,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate feature');
      }

      const data = await response.json();
      setResult(data);
      
      if (onFeatureGenerated) {
        onFeatureGenerated(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (fileName: string, code: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Generate Feature / Application</CardTitle>
        <CardDescription className="text-slate-400">
          Describe what you want to build, and BEAST MODE will generate code that matches your codebase style
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Feature Request Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What would you like to build?
            </label>
            <textarea
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              placeholder="e.g., 'Add user authentication with email/password login and JWT tokens' or 'Create a REST API for managing products with CRUD operations'"
              className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* LLM Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useLLM"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
              className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded focus:ring-cyan-500"
            />
            <label htmlFor="useLLM" className="text-sm text-slate-300">
              Use AI code generation (requires API key)
            </label>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateFeature}
            disabled={loading || !featureRequest.trim()}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            {loading ? 'Generating...' : '🚀 Generate Feature'}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && result.success && (
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-sm text-green-400 font-semibold mb-2">
                  ✅ Feature generated successfully!
                </p>
                <p className="text-xs text-slate-300">
                  {result.generatedFiles.length} file(s) generated
                </p>
              </div>

              {/* Context Summary */}
              {result.context && (
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm font-semibold text-white mb-2">Codebase Context:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Language:</span>
                      <span className="ml-2 text-slate-300">{result.context.primaryLanguage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Quality:</span>
                      <span className="ml-2 text-slate-300">
                        {(result.context.qualityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Files */}
              <div>
                <p className="text-sm font-semibold text-white mb-3">Generated Files:</p>
                <div className="space-y-2">
                  {result.generatedFiles.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                            {file.language}
                          </Badge>
                          <span className="text-sm font-medium text-white">{file.fileName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-slate-400 hover:bg-slate-800"
                          onClick={() => downloadFile(file.fileName, file.fullCode)}
                        >
                          Download
                        </Button>
                      </div>
                      <pre className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded overflow-x-auto max-h-40">
                        {file.codePreview}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Instructions */}
              {result.integrationInstructions && (
                <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-400 mb-2">Integration Steps:</p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {result.integrationInstructions.filesToCreate.length > 0 && (
                      <li>
                        Create files: {result.integrationInstructions.filesToCreate.join(', ')}
                      </li>
                    )}
                    {result.integrationInstructions.dependenciesToAdd.length > 0 && (
                      <li>
                        Install: {result.integrationInstructions.dependenciesToAdd.join(', ')}
                      </li>
                    )}
                    {result.integrationInstructions.testingSteps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {result.nextSteps && (
                <div className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-400 mb-2">Next Steps:</p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {result.nextSteps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quality Validation */}
              {result.generatedFiles && result.generatedFiles.length > 0 && (
                <div className="mt-6">
                  <QualityValidationReport
                    repo={repo}
                    generatedFiles={result.generatedFiles.map((f: any) => ({
                      fileName: f.fileName,
                      code: f.fullCode,
                      language: f.language,
                    }))}
                    originalQuality={result.context?.qualityScore}
                    onValidationComplete={(validation) => {
                      console.log('Validation complete:', validation);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

