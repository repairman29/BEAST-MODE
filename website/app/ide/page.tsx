'use client';

/**
 * BEAST MODE IDE - Web-First Implementation
 * 
 * Full-featured IDE built from 1,093 user stories
 * Primary platform: beast-mode.dev
 * 
 * Features: 269 P0 features integrated
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { featureRegistry } from '@/lib/ide/featureRegistry';

// Dynamic imports for better performance
const Editor = dynamic(() => import('@/components/ide/Editor'), { ssr: false });
const Terminal = dynamic(() => import('@/components/ide/Terminal'), { ssr: false });
const FileTree = dynamic(() => import('@/components/ide/FileTree'), { ssr: false });
const FeaturePanel = dynamic(() => import('@/components/ide/FeaturePanel'), { ssr: false });

export default function IDEPage() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<'terminal' | 'features'>('terminal');
  const [featureCount, setFeatureCount] = useState(0);

  useEffect(() => {
    // Load feature count
    setFeatureCount(featureRegistry.getFeatureCount());
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-4 p-2 hover:bg-slate-800 rounded"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold">BEAST MODE IDE</h1>
          {featureCount > 0 && (
            <span className="ml-4 text-xs text-slate-400">
              {featureCount} features loaded
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRightPanelOpen(!rightPanelOpen);
            }}
            className="p-2 hover:bg-slate-800 rounded"
            aria-label="Toggle right panel"
          >
            {rightPanelOpen ? '◀' : '▶'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        {sidebarOpen && (
          <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <FileTree
              files={files}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
              onFileCreate={(name) => {
                setFiles(prev => ({ ...prev, [name]: '' }));
                setActiveFile(name);
              }}
              onFileDelete={(name) => {
                setFiles(prev => {
                  const next = { ...prev };
                  delete next[name];
                  return next;
                });
                if (activeFile === name) setActiveFile(null);
              }}
            />
          </aside>
        )}

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col">
          {activeFile ? (
            <Editor
              file={activeFile}
              content={files[activeFile] || ''}
              onChange={(content) => {
                setFiles(prev => ({ ...prev, [activeFile]: content }));
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <p className="text-xl mb-4">Welcome to BEAST MODE IDE</p>
                <p className="mb-2">Create a file to get started</p>
                {featureCount > 0 && (
                  <p className="text-sm text-slate-600">
                    {featureCount} features available
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Panel - Terminal or Features */}
        {rightPanelOpen && (
          <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
            {/* Panel Tabs */}
            <div className="h-10 bg-slate-800 border-b border-slate-700 flex">
              <button
                onClick={() => setActivePanel('terminal')}
                className={`flex-1 px-4 text-sm font-medium ${
                  activePanel === 'terminal'
                    ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Terminal
              </button>
              <button
                onClick={() => setActivePanel('features')}
                className={`flex-1 px-4 text-sm font-medium ${
                  activePanel === 'features'
                    ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Features ({featureCount})
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'terminal' ? (
                <Terminal />
              ) : (
                <FeaturePanel
                  onFeatureSelect={(feature) => {
                    console.log('Feature selected:', feature);
                    // Could open feature in editor or show details
                  }}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
