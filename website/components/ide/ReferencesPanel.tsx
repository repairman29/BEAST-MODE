'use client';

/**
 * References Panel Component
 * 
 * Shows all references to a symbol
 */

import { Reference } from '@/lib/ide/codeNavigation';

interface ReferencesPanelProps {
  references: Reference[];
  onFileSelect?: (file: string, line: number, column: number) => void;
  onClose?: () => void;
}

export default function ReferencesPanel({ references, onFileSelect, onClose }: ReferencesPanelProps) {
  const groupedByFile = references.reduce((acc, ref) => {
    if (!acc[ref.file]) acc[ref.file] = [];
    acc[ref.file].push(ref);
    return acc;
  }, {} as Record<string, Reference[]>);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <span className="text-lg font-semibold">
          References ({references.length})
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
            title="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* References List */}
      <div className="flex-1 overflow-y-auto p-4">
        {references.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No references found
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByFile).map(([file, refs]) => (
              <div key={file}>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">{file}</h3>
                <div className="space-y-1">
                  {refs.map((ref, idx) => (
                    <div
                      key={`${ref.file}-${ref.line}-${idx}`}
                      className="p-2 bg-slate-800 rounded hover:bg-slate-750 cursor-pointer"
                      onClick={() => onFileSelect?.(ref.file, ref.line, ref.column)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-blue-400">
                          Line {ref.line}, Col {ref.column}
                        </span>
                      </div>
                      <div className="text-sm text-slate-200 font-mono text-xs">
                        {ref.context}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
