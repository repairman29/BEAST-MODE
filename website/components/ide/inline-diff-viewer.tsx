'use client';

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
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
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
                className={`flex ${line.type === 'equal' ? 'bg-slate-900' : line.type === 'added' ? 'bg-green-900/20' : line.type === 'deleted' ? 'bg-red-900/20' : 'bg-yellow-900/20'}`}
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
