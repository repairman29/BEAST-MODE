'use client';

/**
 * BEAST MODE IDE - Web-First Implementation
 * 
 * Full-featured IDE built from 1,093 user stories
 * Primary platform: beast-mode.dev
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for better performance
const Editor = dynamic(() => import('@/components/ide/Editor'), { ssr: false });
const Terminal = dynamic(() => import('@/components/ide/Terminal'), { ssr: false });
const FileTree = dynamic(() => import('@/components/ide/FileTree'), { ssr: false });
const Sidebar = dynamic(() => import('@/components/ide/Sidebar'), { ssr: false });

export default function IDEPage() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4 p-2 hover:bg-slate-800 rounded"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold">BEAST MODE IDE</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
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
                <p>Create a file to get started</p>
              </div>
            </div>
          )}
        </main>

        {/* Terminal */}
        <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
          <Terminal />
        </aside>
      </div>
    </div>
  );
}
