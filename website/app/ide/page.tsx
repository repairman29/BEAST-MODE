'use client';

/**
 * BEAST MODE IDE - Web-First Implementation
 * 
 * Full-featured IDE built from 1,093 user stories
 * Primary platform: beast-mode.dev
 * 
 * Features: 269 P0 features integrated
 */

import '../globals.css';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { featureRegistry } from '@/lib/ide/featureRegistry';
import { keyboardShortcuts } from '@/lib/ide/keyboardShortcuts';
import { ToastContainer, showToast } from '@/components/ide/Toast';
import StatusBar from '@/components/ide/StatusBar';
import { codebaseContext } from '@/lib/ide/codebaseContext';

// Dynamic imports for better performance
const Editor = dynamic(() => import('@/components/ide/Editor'), { ssr: false });
const Terminal = dynamic(() => import('@/components/ide/Terminal'), { ssr: false });
const FileTree = dynamic(() => import('@/components/ide/FileTree'), { ssr: false });
const FeaturePanel = dynamic(() => import('@/components/ide/FeaturePanel'), { ssr: false });
const AIChat = dynamic(() => import('@/components/ide/AIChat'), { ssr: false });
const GitPanel = dynamic(() => import('@/components/ide/GitPanel'), { ssr: false });
const CodebaseExplorer = dynamic(() => import('@/components/ide/CodebaseExplorer'), { ssr: false });
const ReferencesPanel = dynamic(() => import('@/components/ide/ReferencesPanel'), { ssr: false });
const SymbolSearch = dynamic(() => import('@/components/ide/symbol-search'), { ssr: false });
const DiffViewer = dynamic(() => import('@/components/ide/inline-diff-viewer'), { ssr: false });
const CodePreview = dynamic(() => import('@/components/ide/CodePreview'), { ssr: false });

export default function IDEPage() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]); // Multi-file editing
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<'terminal' | 'features' | 'ai' | 'git' | 'references' | 'preview'>('ai');
  const [featureCount, setFeatureCount] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isDirty, setIsDirty] = useState(false);
  const [references, setReferences] = useState<any[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [diffData, setDiffData] = useState<{ file: string; old: string; new: string } | null>(null);
  const [codePreview, setCodePreview] = useState<{ code: string; originalCode?: string; file?: string } | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [recentChanges, setRecentChanges] = useState<Array<{ file: string; change: 'created' | 'modified' | 'deleted'; timestamp: Date }>>([]);

  useEffect(() => {
    // Load feature count
    const loadFeatureCount = async () => {
      try {
        const featuresModule = await import('@/components/ide/features');
        const featuresList = featuresModule.features || [];
        setFeatureCount(featuresList.length);
      } catch (error) {
        console.error('Failed to load feature count:', error);
      }
    };
    
    loadFeatureCount();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const createFile = () => {
      const name = prompt('Enter file name:');
      if (name) {
        setFiles(prev => ({ ...prev, [name]: '' }));
        setActiveFile(name);
        showToast(`Created file: ${name}`, 'success');
      }
    };

    const saveFile = () => {
      if (activeFile) {
        // In a real app, this would save to backend
        setIsDirty(false);
        showToast(`Saved: ${activeFile}`, 'success');
      } else {
        showToast('No file to save', 'warning');
      }
    };

    const toggleSidebar = () => setSidebarOpen(prev => !prev);
    const toggleRightPanel = () => setRightPanelOpen(prev => !prev);
    const toggleTerminal = () => {
      setRightPanelOpen(true);
      setActivePanel('terminal');
    };
    const toggleFeatures = () => {
      setRightPanelOpen(true);
      setActivePanel('features');
    };
    const toggleAI = () => {
      setRightPanelOpen(true);
      setActivePanel('ai');
    };
    const toggleGit = () => {
      setRightPanelOpen(true);
      setActivePanel('git');
    };

    keyboardShortcuts.register({ key: 'n', meta: true, action: createFile, description: 'New File' });
    keyboardShortcuts.register({ key: 's', meta: true, action: saveFile, description: 'Save File' });
    keyboardShortcuts.register({ key: 'b', meta: true, action: toggleSidebar, description: 'Toggle Sidebar' });
    keyboardShortcuts.register({ key: 'j', meta: true, action: toggleRightPanel, description: 'Toggle Right Panel' });
    keyboardShortcuts.register({ key: '`', meta: true, action: toggleTerminal, description: 'Toggle Terminal' });
    keyboardShortcuts.register({ key: 'p', meta: true, shift: true, action: toggleAI, description: 'Show AI Chat' });
    keyboardShortcuts.register({ key: 'f', meta: true, shift: true, action: toggleFeatures, description: 'Show Features' });
    keyboardShortcuts.register({ key: 'g', meta: true, shift: true, action: toggleGit, description: 'Show Git Panel' });
    
    // Symbol Search (Cmd+T)
    keyboardShortcuts.register({ 
      key: 't', 
      meta: true, 
      action: () => setShowSymbolSearch(true), 
      description: 'Symbol Search' 
    });

    return () => {
      // Cleanup would happen here if needed
    };
  }, [activeFile]);

  // Hide navigation on IDE page
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) {
      nav.style.display = 'none';
    }
    document.body.style.overflow = 'hidden';
    
    return () => {
      if (nav) {
        nav.style.display = '';
      }
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 h-screen w-screen flex flex-col bg-slate-950 text-slate-100 z-50">
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
              onFileSelect={(file) => {
                setActiveFile(file);
                if (!openFiles.includes(file)) {
                  setOpenFiles(prev => [...prev, file]);
                }
              }}
              onFileCreate={(name) => {
                setFiles(prev => ({ ...prev, [name]: '' }));
                setActiveFile(name);
                if (!openFiles.includes(name)) {
                  setOpenFiles(prev => [...prev, name]);
                }
                showToast(`Created file: ${name}`, 'success');
              }}
              onFileDelete={(name) => {
                if (confirm(`Delete ${name}?`)) {
                  setFiles(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                  });
                  if (activeFile === name) {
                    const remaining = openFiles.filter(f => f !== name);
                    setActiveFile(remaining[0] || null);
                  }
                  setOpenFiles(prev => prev.filter(f => f !== name));
                  showToast(`Deleted file: ${name}`, 'info');
                }
              }}
            />
          </aside>
        )}

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col">
          {openFiles.length > 0 ? (
            <div className="flex-1 flex flex-col">
              {/* Tab Bar */}
              <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center overflow-x-auto">
                {openFiles.map((file) => (
                  <div
                    key={file}
                    className={`flex items-center px-4 py-2 border-r border-slate-700 cursor-pointer ${
                      activeFile === file
                        ? 'bg-slate-900 text-slate-100'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                    onClick={() => setActiveFile(file)}
                  >
                    <span className="text-sm truncate max-w-[200px]">{file}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFiles(prev => prev.filter(f => f !== file));
                        if (activeFile === file) {
                          setActiveFile(openFiles.find(f => f !== file) || null);
                        }
                      }}
                      className="ml-2 text-slate-500 hover:text-slate-200"
                      title="Close"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Editor */}
              {activeFile && (
                <Editor
                  file={activeFile}
                  content={files[activeFile] || ''}
                  onChange={(content) => {
                    const oldContent = files[activeFile] || '';
                    setFiles(prev => ({ ...prev, [activeFile]: content }));
                    setIsDirty(true);
                    
                    // Track recent changes
                    if (oldContent !== content) {
                      setRecentChanges(prev => [
                        { file: activeFile, change: 'modified', timestamp: new Date() },
                        ...prev.slice(0, 9), // Keep last 10 changes
                      ]);
                    }
                  }}
                  onCursorChange={setCursorPosition}
                  onFileOpen={async (file, line, column) => {
                    // Open file and navigate to location
                    if (files[file] !== undefined) {
                      setActiveFile(file);
                      if (!openFiles.includes(file)) {
                        setOpenFiles(prev => [...prev, file]);
                      }
                      showToast(`Opened: ${file}${line ? `:${line}` : ''}`, 'info');
                    } else {
                      // File doesn't exist in our files, try to load it
                      try {
                        const content = await codebaseContext.getFileContent(file);
                        if (content) {
                          setFiles(prev => ({ ...prev, [file]: content }));
                          setActiveFile(file);
                          if (!openFiles.includes(file)) {
                            setOpenFiles(prev => [...prev, file]);
                          }
                          showToast(`Opened: ${file}${line ? `:${line}` : ''}`, 'info');
                        } else {
                          showToast(`File not found: ${file}`, 'error');
                        }
                      } catch (error) {
                        showToast(`Failed to load: ${file}`, 'error');
                      }
                    }
                  }}
                  onReferencesFound={async (refs) => {
                    setReferences(refs);
                    setShowReferences(true);
                    setRightPanelOpen(true);
                    setActivePanel('references');
                  }}
                />
              )}
            </div>
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
                onClick={() => setActivePanel('ai')}
                className={`flex-1 px-4 text-sm font-medium ${
                  activePanel === 'ai'
                    ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="AI Chat (Cmd/Ctrl+Shift+P)"
              >
                🤖 AI
              </button>
              <button
                onClick={() => setActivePanel('terminal')}
                className={`flex-1 px-4 text-sm font-medium ${
                  activePanel === 'terminal'
                    ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Terminal (Cmd/Ctrl+`)"
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
              <button
                onClick={() => setActivePanel('git')}
                className={`flex-1 px-4 text-sm font-medium ${
                  activePanel === 'git'
                    ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Git (Cmd/Ctrl+Shift+G)"
              >
                Git
              </button>
              {showReferences && references.length > 0 && (
                <button
                  onClick={() => setActivePanel('references')}
                  className={`px-4 text-sm font-medium ${
                    activePanel === 'references'
                      ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="References"
                >
                  Refs ({references.length})
                </button>
              )}
              {codePreview && (
                <button
                  onClick={() => setActivePanel('preview')}
                  className={`px-4 text-sm font-medium ${
                    activePanel === 'preview'
                      ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Code Preview"
                >
                  Preview
                </button>
              )}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'ai' ? (
                <AIChat
                  activeFile={activeFile}
                  fileContent={activeFile ? files[activeFile] : undefined}
                  selectedText={selectedText}
                  openFiles={openFiles.map(file => ({
                    path: file,
                    content: files[file] || '',
                    language: file.split('.').pop() || 'text',
                    isDirty: isDirty,
                  }))}
                  onCodeGenerated={(code, file) => {
                    if (file && files[file]) {
                      // Insert code into existing file
                      setFiles(prev => ({
                        ...prev,
                        [file]: prev[file] + '\n\n' + code,
                      }));
                    } else if (activeFile) {
                      // Insert into active file
                      setFiles(prev => ({
                        ...prev,
                        [activeFile]: (prev[activeFile] || '') + '\n\n' + code,
                      }));
                    } else {
                      // Create new file
                      const fileName = 'generated.tsx';
                      setFiles(prev => ({ ...prev, [fileName]: code }));
                      setActiveFile(fileName);
                    }
                  }}
                  onCodePreview={(code, originalCode, file) => {
                    setCodePreview({ code, originalCode, file: file || activeFile || undefined });
                    setRightPanelOpen(true);
                    setActivePanel('preview');
                  }}
                />
              ) : activePanel === 'terminal' ? (
                <Terminal />
              ) : activePanel === 'git' ? (
                <GitPanel
                  onFileSelect={(file) => {
                    // Open file in editor if it exists
                    if (files[file]) {
                      setActiveFile(file);
                    }
                  }}
                />
              ) : activePanel === 'references' ? (
                <ReferencesPanel
                  references={references}
                  onFileSelect={(file, line, column) => {
                    // Open file in editor
                    if (files[file] !== undefined) {
                      setActiveFile(file);
                      if (!openFiles.includes(file)) {
                        setOpenFiles(prev => [...prev, file]);
                      }
                    } else {
                      // Load file from codebase
                      codebaseContext.getFileContent(file).then(content => {
                        if (content) {
                          setFiles(prev => ({ ...prev, [file]: content }));
                          setActiveFile(file);
                          if (!openFiles.includes(file)) {
                            setOpenFiles(prev => [...prev, file]);
                          }
                        }
                      });
                    }
                  }}
                  onClose={() => {
                    setShowReferences(false);
                    setReferences([]);
                    if (activePanel === 'references') {
                      setActivePanel('ai');
                    }
                  }}
                />
              ) : activePanel === 'preview' && codePreview ? (
                <CodePreview
                  originalCode={codePreview.originalCode}
                  newCode={codePreview.code}
                  file={codePreview.file}
                  onAccept={(code) => {
                    const targetFile = codePreview.file || activeFile;
                    if (targetFile && files[targetFile]) {
                      // Replace or insert code
                      if (codePreview.originalCode) {
                        // Replace original with new
                        setFiles(prev => ({
                          ...prev,
                          [targetFile]: code,
                        }));
                      } else {
                        // Append to existing
                        setFiles(prev => ({
                          ...prev,
                          [targetFile]: (prev[targetFile] || '') + '\n\n' + code,
                        }));
                      }
                    } else if (targetFile) {
                      // Create new file
                      setFiles(prev => ({ ...prev, [targetFile]: code }));
                      setActiveFile(targetFile);
                      if (!openFiles.includes(targetFile)) {
                        setOpenFiles(prev => [...prev, targetFile]);
                      }
                    }
                    setCodePreview(null);
                    setActivePanel('ai');
                    showToast('Code inserted!', 'success');
                  }}
                  onReject={() => {
                    setCodePreview(null);
                    setActivePanel('ai');
                    showToast('Code preview rejected', 'info');
                  }}
                />
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

      {/* Status Bar */}
      <StatusBar
        file={activeFile}
        line={cursorPosition.line}
        column={cursorPosition.column}
        language={activeFile ? activeFile.split('.').pop()?.toUpperCase() : undefined}
        isDirty={isDirty}
        fileCount={Object.keys(files).length}
      />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Symbol Search Modal */}
      {showSymbolSearch && (
        <SymbolSearch
          onFileSelect={(file, line, column) => {
            // Open file in editor
            if (files[file] !== undefined) {
              setActiveFile(file);
              if (!openFiles.includes(file)) {
                setOpenFiles(prev => [...prev, file]);
              }
            } else {
              codebaseContext.getFileContent(file).then(content => {
                if (content) {
                  setFiles(prev => ({ ...prev, [file]: content }));
                  setActiveFile(file);
                  if (!openFiles.includes(file)) {
                    setOpenFiles(prev => [...prev, file]);
                  }
                }
              });
            }
          }}
          onClose={() => setShowSymbolSearch(false)}
        />
      )}

      {/* Diff Viewer */}
      {showDiffViewer && diffData && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <DiffViewer
            file={diffData.file}
            oldContent={diffData.old}
            newContent={diffData.new}
            onClose={() => {
              setShowDiffViewer(false);
              setDiffData(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
