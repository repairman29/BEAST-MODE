#!/usr/bin/env node
/**
 * Build Remaining IDE Features - Direct Implementation
 * 
 * Since BEAST MODE API might need auth, let's build these directly
 * using the same patterns as existing features
 */

const fs = require('fs');
const path = require('path');

const features = [
  {
    id: 'inline-diff-viewer',
    title: 'Inline Diff Viewer',
    component: `'use client';

import { useState, useEffect } from 'react';
import { codeNavigation } from '@/lib/ide/codeNavigation';

interface DiffViewerProps {
  file: string;
  oldContent: string;
  newContent: string;
  onClose?: () => void;
}

export default function DiffViewer({ file, oldContent, newContent, onClose }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('inline');

  // Simple diff algorithm
  const oldLines = oldContent.split('\\n');
  const newLines = newContent.split('\\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  const diff = [];
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';
    const isEqual = oldLine === newLine;
    
    diff.push({
      line: i + 1,
      old: oldLine,
      new: newLine,
      type: isEqual ? 'equal' : oldLine && newLine ? 'modified' : oldLine ? 'deleted' : 'added',
    });
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <span className="text-lg font-semibold">Diff: {file}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'inline' ? 'side-by-side' : 'inline')}
            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded"
          >
            {viewMode === 'inline' ? 'Side-by-Side' : 'Inline'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {viewMode === 'inline' ? (
          <div className="space-y-0">
            {diff.map((line) => (
              <div
                key={line.line}
                className={\`flex \${line.type === 'equal' ? 'bg-slate-900' : line.type === 'added' ? 'bg-green-900/20' : line.type === 'deleted' ? 'bg-red-900/20' : 'bg-yellow-900/20'}\`}
              >
                <div className="w-16 text-slate-500 text-right pr-4 border-r border-slate-700">
                  {line.line}
                </div>
                <div className="flex-1 pl-4">
                  {line.type === 'deleted' && (
                    <div className="text-red-400">- {line.old}</div>
                  )}
                  {line.type === 'added' && (
                    <div className="text-green-400">+ {line.new}</div>
                  )}
                  {line.type === 'modified' && (
                    <>
                      <div className="text-red-400">- {line.old}</div>
                      <div className="text-green-400">+ {line.new}</div>
                    </>
                  )}
                  {line.type === 'equal' && (
                    <div className="text-slate-300">{line.new}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-0">
            <div className="border-r border-slate-700">
              <div className="bg-slate-800 p-2 font-semibold">Old</div>
              {oldLines.map((line, i) => (
                <div key={i} className="p-1 text-slate-300">
                  {line}
                </div>
              ))}
            </div>
            <div>
              <div className="bg-slate-800 p-2 font-semibold">New</div>
              {newLines.map((line, i) => (
                <div key={i} className="p-1 text-slate-300">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`,
  },
  {
    id: 'symbol-search',
    title: 'Symbol Search (Cmd+T)',
    component: `'use client';

import { useState, useEffect, useRef } from 'react';
import { codeNavigation } from '@/lib/ide/codeNavigation';
import { showToast } from './Toast';

interface SymbolSearchProps {
  onFileSelect?: (file: string, line?: number, column?: number) => void;
  onClose?: () => void;
}

export default function SymbolSearch({ onFileSelect, onClose }: SymbolSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchSymbols(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchSymbols = async (searchQuery: string) => {
    setLoading(true);
    try {
      const symbols = await codeNavigation.findSymbol(searchQuery);
      setResults(symbols);
    } catch (error) {
      console.error('Symbol search failed:', error);
      showToast('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (symbol: any) => {
    onFileSelect?.(symbol.file, symbol.line, symbol.column);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-2/3 max-w-2xl bg-slate-900 rounded-lg shadow-xl border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symbols... (Cmd+T)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose?.();
              if (e.key === 'Enter' && results.length > 0) {
                handleSelect(results[0]);
              }
            }}
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {results.map((symbol, idx) => (
                <div
                  key={idx}
                  className="p-3 hover:bg-slate-800 cursor-pointer"
                  onClick={() => handleSelect(symbol)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-medium">{symbol.name}</div>
                      <div className="text-sm text-slate-400">{symbol.file}:{symbol.line}</div>
                    </div>
                    <div className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
                      {symbol.kind}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-slate-500">No results</div>
          ) : (
            <div className="p-8 text-center text-slate-500">Start typing to search...</div>
          )}
        </div>
      </div>
    </div>
  );
}
`,
  },
];

function main() {
  console.log('🚀 Building Remaining IDE Features\n');
  console.log('='.repeat(60));

  const componentDir = path.join(__dirname, '../components/ide');
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  let success = 0;
  let failed = 0;

  for (const feature of features) {
    try {
      const filePath = path.join(componentDir, `${feature.id}.tsx`);
      fs.writeFileSync(filePath, feature.component);
      console.log(`✅ Created: ${feature.id}.tsx`);
      success++;
    } catch (error) {
      console.error(`❌ Failed to create ${feature.id}:`, error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));
  console.log('\n🎉 Features created! Next: Integrate into IDE');
}

main();
