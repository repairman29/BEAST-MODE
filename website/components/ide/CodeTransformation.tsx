'use client';

/**
 * Code Transformation Component
 * 
 * Transforms code: language conversion, modernization, optimization
 */

import { useState } from 'react';
import { showToast } from './Toast';

interface CodeTransformationProps {
  code: string;
  sourceLanguage?: string;
  onTransformed?: (code: string, language: string) => void;
}

type TransformationType = 
  | 'convert-language'
  | 'modernize'
  | 'optimize'
  | 'add-error-handling'
  | 'add-type-safety';

export default function CodeTransformation({
  code,
  sourceLanguage = 'typescript',
  onTransformed,
}: CodeTransformationProps) {
  const [transformationType, setTransformationType] = useState<TransformationType>('convert-language');
  const [targetLanguage, setTargetLanguage] = useState('python');
  const [isLoading, setIsLoading] = useState(false);
  const [transformedCode, setTransformedCode] = useState<string | null>(null);

  const handleTransform = async () => {
    setIsLoading(true);
    setTransformedCode(null);

    try {
      const response = await fetch('/api/beast-mode/transform-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          sourceLanguage,
          transformationType,
          targetLanguage: transformationType === 'convert-language' ? targetLanguage : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Transformation failed');
      }

      const data = await response.json();
      setTransformedCode(data.code || data.transformedCode);
      showToast('Code transformed!', 'success');
    } catch (error: any) {
      console.error('Transformation error:', error);
      showToast(`Failed to transform: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (transformedCode && onTransformed) {
      const newLanguage = transformationType === 'convert-language' ? targetLanguage : sourceLanguage;
      onTransformed(transformedCode, newLanguage);
      showToast('Code transformation applied!', 'success');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Code Transformation</h3>
      </div>

      {/* Transformation Type */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">Transformation Type:</label>
        <select
          value={transformationType}
          onChange={(e) => setTransformationType(e.target.value as TransformationType)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
        >
          <option value="convert-language">Convert Language</option>
          <option value="modernize">Modernize Code</option>
          <option value="optimize">Optimize Performance</option>
          <option value="add-error-handling">Add Error Handling</option>
          <option value="add-type-safety">Add Type Safety</option>
        </select>
      </div>

      {/* Target Language (if converting) */}
      {transformationType === 'convert-language' && (
        <div>
          <label className="block text-sm text-slate-300 mb-2">Target Language:</label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
          >
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        </div>
      )}

      {/* Original Code */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">Original Code:</label>
        <div className="bg-slate-950 rounded border border-slate-700 p-3">
          <pre className="text-xs text-slate-300 overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Transform Button */}
      <button
        onClick={handleTransform}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded font-medium"
      >
        {isLoading ? 'Transforming...' : 'Transform Code'}
      </button>

      {/* Transformed Code */}
      {transformedCode && (
        <div>
          <label className="block text-sm text-slate-300 mb-2">Transformed Code:</label>
          <div className="bg-slate-950 rounded border border-slate-700 p-3">
            <pre className="text-xs text-slate-300 overflow-x-auto">
              <code>{transformedCode}</code>
            </pre>
          </div>
          <button
            onClick={handleAccept}
            className="mt-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
          >
            Accept Transformation
          </button>
        </div>
      )}
    </div>
  );
}
