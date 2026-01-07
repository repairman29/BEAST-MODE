'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  files?: Array<{ fileName: string; code: string; language: string }>;
  suggestions?: string[];
  timestamp: Date;
}

interface CodebaseChatProps {
  repo: string;
  currentFile?: string;
  files?: Array<{ path: string; content: string }>;
}

export default function CodebaseChat({ repo, currentFile, files = [] }: CodebaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [useLLM, setUseLLM] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/codebase/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          repo,
          files: files.map(f => ({ path: f.path, content: f.content })),
          currentFile,
          useLLM,
        }),
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

  const clearHistory = async () => {
    try {
      await fetch('/api/codebase/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Codebase Chat</CardTitle>
            <CardDescription className="text-slate-400">
              Ask questions, generate code, get help with your codebase
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={useLLM}
                onChange={(e) => setUseLLM(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded"
              />
              Use AI
            </label>
            {messages.length > 0 && (
              <Button
                onClick={clearHistory}
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-400 hover:bg-slate-800"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="mb-4">Start a conversation about your codebase</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600">Try asking:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>"How do I add authentication?"</li>
                    <li>"Generate tests for this file"</li>
                    <li>"Refactor this code"</li>
                    <li>"What are the security issues?"</li>
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
                        <pre className="bg-slate-900/50 p-3 rounded text-xs overflow-x-auto">
                          <code>{message.code}</code>
                        </pre>
                        <Button
                          onClick={() => downloadFile('generated-code.js', message.code!)}
                          size="sm"
                          variant="outline"
                          className="mt-2 border-slate-700 text-slate-400 hover:bg-slate-800"
                        >
                          Download Code
                        </Button>
                      </div>
                    )}

                    {/* Generated files */}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-400 mb-2">Generated files:</p>
                        {message.files.map((file, i) => (
                          <div
                            key={i}
                            className="bg-slate-900/50 p-2 rounded border border-slate-700/50"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-300">{file.fileName}</span>
                              <Button
                                onClick={() => downloadFile(file.fileName, file.code)}
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs border-slate-700 text-slate-400 hover:bg-slate-800"
                              >
                                Download
                              </Button>
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
      </CardContent>
    </Card>
  );
}

