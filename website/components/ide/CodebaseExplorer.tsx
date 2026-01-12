'use client';

/**
 * Codebase Explorer Component
 * 
 * Shows codebase structure, search, and navigation
 */

import { useState, useEffect } from 'react';
import { codebaseContext, CodebaseStructure } from '@/lib/ide/codebaseContext';

interface CodebaseExplorerProps {
  onFileSelect?: (file: string) => void;
}

export default function CodebaseExplorer({ onFileSelect }: CodebaseExplorerProps) {
  const [structure, setStructure] = useState<CodebaseStructure | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'structure' | 'search'>('structure');

  useEffect(() => {
    loadStructure();
  }, []);

  const loadStructure = async () => {
    setLoading(true);
    try {
      const struct = await codebaseContext.indexCodebase();
      setStructure(struct);
    } catch (error) {
      console.error('Failed to load codebase structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await codebaseContext.searchCodebase(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const groupedFiles = structure?.files.reduce((acc, file) => {
    const dir = file.path.substring(0, file.path.lastIndexOf('/') || 0) || '/';
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(file);
    return acc;
  }, {} as Record<string, typeof structure.files>) || {};

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <span className="text-lg font-semibold">Codebase</span>
        <button
          onClick={loadStructure}
          className="text-xs text-slate-400 hover:text-slate-200"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Tabs */}
      <div className="h-10 bg-slate-800 border-b border-slate-700 flex">
        <button
          onClick={() => setSelectedTab('structure')}
          className={`px-4 text-sm font-medium ${
            selectedTab === 'structure'
              ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Structure
        </button>
        <button
          onClick={() => setSelectedTab('search')}
          className={`px-4 text-sm font-medium ${
            selectedTab === 'search'
              ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Search
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'structure' && (
          <div>
            {loading ? (
              <div className="text-center text-slate-500 text-sm py-8">Loading...</div>
            ) : structure ? (
              <div className="space-y-4">
                {/* Architecture Info */}
                <div className="p-3 bg-slate-800 rounded">
                  <h3 className="text-sm font-semibold mb-2">Architecture</h3>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Type: {structure.architecture.structure}</div>
                    {structure.architecture.frameworks.length > 0 && (
                      <div>Frameworks: {structure.architecture.frameworks.join(', ')}</div>
                    )}
                    {structure.architecture.patterns.length > 0 && (
                      <div>Patterns: {structure.architecture.patterns.join(', ')}</div>
                    )}
                  </div>
                </div>

                {/* File Tree */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Files ({structure.files.length})</h3>
                  <div className="space-y-1">
                    {Object.entries(groupedFiles).slice(0, 20).map(([dir, files]) => (
                      <div key={dir} className="mb-2">
                        <div className="text-xs text-slate-500 mb-1">{dir || '/'}</div>
                        {files.slice(0, 10).map((file) => (
                          <div
                            key={file.path}
                            className="px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 rounded cursor-pointer"
                            onClick={() => onFileSelect?.(file.path)}
                          >
                            {file.path.split('/').pop()}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm py-8">
                No codebase indexed
              </div>
            )}
          </div>
        )}

        {selectedTab === 'search' && (
          <div>
            <input
              type="text"
              placeholder="Search codebase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
            />

            {loading ? (
              <div className="text-center text-slate-500 text-sm py-8">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.path}
                    className="p-2 bg-slate-800 rounded hover:bg-slate-750 cursor-pointer"
                    onClick={() => onFileSelect?.(result.path)}
                  >
                    <div className="text-sm text-slate-200 font-medium">{result.path}</div>
                    {result.preview && (
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {result.preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center text-slate-500 text-sm py-8">No results</div>
            ) : (
              <div className="text-center text-slate-500 text-sm py-8">
                Enter a search query
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
