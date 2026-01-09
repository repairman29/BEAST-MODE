'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Save, FolderOpen, FileText, X, Copy, Check, Download, Upload, MessageSquare, Plus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  files?: Array<{ fileName: string; code: string; language: string }>;
  suggestions?: string[];
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  repo: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface CodebaseChatEnhancedProps {
  repo: string;
  currentFile?: string;
  files?: Array<{ path: string; content: string }>;
  onFileCreate?: (filePath: string, content: string) => void;
}

export default function CodebaseChatEnhanced({ 
  repo, 
  currentFile, 
  files = [],
  onFileCreate 
}: CodebaseChatEnhancedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage
  useEffect(() => {
    loadConversations();
  }, [repo]);

  // Load conversation history when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save conversation after messages change
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      saveConversation();
    }
  }, [messages, currentConversationId]);

  const loadConversations = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(`beast-mode-chat-conversations-${repo}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const conversations = parsed.map((c: any) => ({
          ...c,
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })),
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }));
        setConversations(conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    // Try API first
    try {
      const response = await fetch(`/api/codebase/chat?sessionId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          const loadedMessages = data.history.map((h: any) => ({
            role: h.role || 'user',
            content: h.message || h.content,
            code: h.code,
            files: h.files,
            suggestions: h.suggestions,
            timestamp: new Date(h.timestamp || Date.now())
          }));
          setMessages(loadedMessages);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load from API, trying localStorage:', error);
    }

    // Fallback to localStorage
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
    }
  };

  const saveConversation = () => {
    if (!currentConversationId || messages.length === 0) return;

    const conversation: Conversation = {
      id: currentConversationId,
      title: messages[0]?.content.substring(0, 50) || 'New Conversation',
      repo,
      messages,
      createdAt: conversations.find(c => c.id === currentConversationId)?.createdAt || new Date(),
      updatedAt: new Date()
    };

    const updated = conversations.filter(c => c.id !== currentConversationId);
    updated.unshift(conversation);
    setConversations(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`beast-mode-chat-conversations-${repo}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    }
  };

  const createNewConversation = () => {
    const newId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentConversationId(newId);
    setMessages([]);
    setShowConversations(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Create new conversation if none exists
    if (!currentConversationId) {
      createNewConversation();
      // Wait a tick for state to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Track analytics
    if (typeof window !== 'undefined') {
      const { getAnalytics } = require('@/lib/analytics');
      const analytics = getAnalytics();
      analytics.trackFeatureUse('codebase-chat', 'message-sent');
    }

    try {
      const { fetchWithRetry } = require('@/lib/api-retry');
      const response = await fetchWithRetry('/api/codebase/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentConversationId,
          message: userMessage.content,
          repo,
          files: files.map(f => ({ path: f.path, content: f.content })),
          currentFile,
          useLLM,
        }),
      }, {
        maxRetries: 2,
        initialDelay: 500
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'I encountered an error.',
        code: data.code,
        files: data.files,
        suggestions: data.suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track file generation
      if (data.files && data.files.length > 0) {
        if (typeof window !== 'undefined') {
          const { getAnalytics } = require('@/lib/analytics');
          const analytics = getAnalytics();
          analytics.trackFeatureUse('codebase-chat', `files-generated-${data.files.length}`);
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createFile = async (fileName: string, code: string) => {
    if (onFileCreate) {
      onFileCreate(fileName, code);
      
      // Track analytics
      if (typeof window !== 'undefined') {
        const { getAnalytics } = require('@/lib/analytics');
        const analytics = getAnalytics();
        analytics.trackFeatureUse('codebase-chat', 'file-created');
      }
    } else {
      // Fallback to download
      downloadFile(fileName, code);
    }
  };

  const downloadFile = (fileName: string, code: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const exportConversation = () => {
    if (!currentConversationId || messages.length === 0) return;

    const exportData = {
      repo,
      conversationId: currentConversationId,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        code: m.code,
        files: m.files,
        timestamp: m.timestamp.toISOString()
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${currentConversationId}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const clearHistory = async () => {
    if (!currentConversationId) return;

    try {
      await fetch('/api/codebase/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentConversationId }),
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }

    setMessages([]);
    setCurrentConversationId(null);
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Codebase Chat
            </CardTitle>
            <CardDescription className="text-slate-400">
              Ask questions, generate code, get help with your codebase
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowConversations(!showConversations)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Conversations
            </Button>
            <Button
              onClick={createNewConversation}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded"
              />
              AI
            </label>
            {messages.length > 0 && (
              <>
                <Button
                  onClick={exportConversation}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 h-[600px]">
          {/* Conversations Sidebar */}
          {showConversations && (
            <div className="w-64 bg-slate-950/50 border border-slate-800 rounded-lg p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Conversations</h3>
                <Button
                  onClick={createNewConversation}
                  size="sm"
                  className="h-6 w-6 p-0 bg-cyan-600 hover:bg-cyan-700"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-4">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setCurrentConversationId(conv.id);
                        setShowConversations(false);
                      }}
                      className={`w-full text-left p-2 rounded text-sm ${
                        currentConversationId === conv.id
                          ? 'bg-cyan-600/20 border border-cyan-600/50 text-white'
                          : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {conv.messages.length} messages • {conv.updatedAt.toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="mb-4">Start a conversation about your codebase</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600">Try asking:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-500">
                      <li>"How do I add authentication?"</li>
                      <li>"Generate tests for this file"</li>
                      <li>"Refactor this code"</li>
                      <li>"What are the security issues?"</li>
                      <li>"Create a new component"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-cyan-600/20 border border-cyan-600/50 text-white'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-300'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {/* Code blocks */}
                      {message.code && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">Generated Code</span>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => copyToClipboard(message.code!, index)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                              >
                                {copiedIndex === index ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              {onFileCreate && (
                                <Button
                                  onClick={() => createFile('generated-code.js', message.code!)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                                  title="Create file in repo"
                                >
                                  <FileText className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                onClick={() => downloadFile('generated-code.js', message.code!)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <pre className="bg-slate-900/50 p-3 rounded text-xs overflow-x-auto">
                            <code>{message.code}</code>
                          </pre>
                        </div>
                      )}

                      {/* Generated files */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-slate-400 mb-2">Generated files:</p>
                          {message.files.map((file, i) => (
                            <div
                              key={i}
                              className="bg-slate-900/50 p-3 rounded border border-slate-700/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-cyan-400" />
                                  <span className="text-sm font-medium text-slate-300">{file.fileName}</span>
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">{file.language}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => copyToClipboard(file.code, index * 1000 + i)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                                  >
                                    {copiedIndex === index * 1000 + i ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                  {onFileCreate && (
                                    <Button
                                      onClick={() => createFile(file.fileName, file.code)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                                      title="Create file in repo"
                                    >
                                      <Save className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => downloadFile(file.fileName, file.code)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <pre className="text-xs text-slate-500 overflow-x-auto max-h-32">
                                {file.code.substring(0, 200)}...
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-400 mb-2">Suggestions:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, i) => (
                              <Badge
                                key={i}
                                className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs cursor-pointer hover:bg-purple-500/30"
                                onClick={() => setInput(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                      <span className="text-slate-400 text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your codebase, generate code, get help..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={3}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 self-end"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
