'use client';

/**
 * Code Preview Component
 * 
 * Shows a preview of generated code with diff view before insertion
 */

import { useState } from 'react';
import { showToast } from './Toast';

interface CodePreviewProps {
  originalCode?: string;
  newCode: string;
  file?: string;
  language?: string;
  onAccept: (code: string) => void;
  onReject: () => void;
  onEdit?: (code: string) => void;
}

export default function CodePreview({
  originalCode,
  newCode,
  file,
  language = 'typescript',
  onAccept,
  onReject,
  onEdit,
}: CodePreviewProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedCode, setEditedCode] = useState(newCode);
  const [viewMode, setViewMode] = useState<'diff' | 'new' | 'original'>('diff');

  const handleAccept = () => {
    onAccept(editMode ? editedCode : newCode);
    showToast('Code inserted!', 'success');
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(editedCode);
    } else {
      setEditMode(true);
    }
  };

  const renderDiff = () => {
    if (!originalCode) {
      return (
        <div className="bg-slate-950 rounded p-4 border border-slate-700">
          <pre className="text-xs text-slate-300 overflow-x-auto">
            <code>{newCode}</code>
          </pre>
        </div>
      );
    }

    // Simple line-by-line diff
    const originalLines = originalCode.split('\n');
    const newLines = newCode.split('\n');
    const maxLines = Math.max(originalLines.length, newLines.length);

    return (
      <div className="bg-slate-950 rounded border border-slate-700 overflow-auto max-h-96">
        <div className="grid grid-cols-2 gap-0">
          {/* Original */}
          <div className="border-r border-slate-700">
            <div className="bg-slate-900 px-2 py-1 text-xs text-slate-400 border-b border-slate-700">
              Original
            </div>
            <div className="p-2">
              {originalLines.map((line, i) => (
                <div
                  key={i}
                  className={`text-xs font-mono ${
                    i < newLines.length && line !== newLines[i]
                      ? 'bg-red-900/30 text-red-300'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 mr-2">{i + 1}</span>
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>

          {/* New */}
          <div>
            <div className="bg-slate-900 px-2 py-1 text-xs text-slate-400 border-b border-slate-700">
              New
            </div>
            <div className="p-2">
              {newLines.map((line, i) => (
                <div
                  key={i}
                  className={`text-xs font-mono ${
                    i < originalLines.length && line !== originalLines[i]
                      ? 'bg-green-900/30 text-green-300'
                      : i >= originalLines.length
                      ? 'bg-green-900/30 text-green-300'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 mr-2">{i + 1}</span>
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCode = (code: string, title: string) => {
    return (
      <div className="bg-slate-950 rounded border border-slate-700">
        <div className="bg-slate-900 px-2 py-1 text-xs text-slate-400 border-b border-slate-700">
          {title}
        </div>
        <div className="p-4">
          {editMode ? (
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="w-full h-64 bg-slate-900 text-slate-300 font-mono text-xs p-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <pre className="text-xs text-slate-300 overflow-x-auto">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Code Preview</h3>
          {file && <p className="text-xs text-slate-400 mt-1">File: {file}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('diff')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'diff'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Diff
          </button>
          {originalCode && (
            <>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2 py-1 text-xs rounded ${
                  viewMode === 'original'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Original
              </button>
            </>
          )}
          <button
            onClick={() => setViewMode('new')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            New
          </button>
        </div>
      </div>

      {/* Code View */}
      <div>
        {viewMode === 'diff' && renderDiff()}
        {viewMode === 'original' && originalCode && renderCode(originalCode, 'Original Code')}
        {viewMode === 'new' && renderCode(editMode ? editedCode : newCode, 'New Code')}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded"
          >
            {editMode ? 'Done Editing' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={() => {
                setEditMode(false);
                setEditedCode(newCode);
              }}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onReject}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded font-medium"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
          >
            Accept & Insert
          </button>
        </div>
      </div>
    </div>
  );
}
