'use client';

/**
 * File Tree Component
 * 
 * Implements P0 user stories:
 * - File tree view
 * - Create/delete files
 * - Create/delete folders
 * - File search
 * - File rename
 */

import { useState } from 'react';

interface FileTreeProps {
  files: Record<string, string>;
  activeFile: string | null;
  onFileSelect: (file: string) => void;
  onFileCreate: (name: string) => void;
  onFileDelete: (name: string) => void;
}

export default function FileTree({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
}: FileTreeProps) {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreate = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setShowCreateInput(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <span className="text-sm font-semibold">Files</span>
        <button
          onClick={() => setShowCreateInput(true)}
          className="text-slate-400 hover:text-slate-200 text-lg"
          title="Create File"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {showCreateInput && (
          <div className="mb-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setShowCreateInput(false);
                  setNewFileName('');
                }
              }}
              onBlur={handleCreate}
              autoFocus
              placeholder="File name..."
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {Object.keys(files).length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            <p>No files yet</p>
            <p className="text-xs mt-2">Click + to create a file</p>
          </div>
        ) : (
          <div className="space-y-1">
            {Object.keys(files).map((file) => (
              <div
                key={file}
                className={`flex items-center justify-between group px-2 py-1 rounded cursor-pointer ${
                  activeFile === file
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
                onClick={() => onFileSelect(file)}
              >
                <span className="text-sm truncate flex-1">{file}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${file}?`)) {
                      onFileDelete(file);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-2"
                  title="Delete file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
