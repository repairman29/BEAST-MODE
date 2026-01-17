'use client';

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
