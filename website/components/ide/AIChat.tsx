'use client';

/**
 * AI Chat Component
 * 
 * Conversational AI interface for vibe coding
 * Uses BEAST MODE APIs for code generation
 */

import { useState, useRef, useEffect } from 'react';
import { showToast } from './Toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  code?: string;
  timestamp: Date;
}

interface AIChatProps {
  activeFile?: string | null;
  fileContent?: string;
  onCodeGenerated?: (code: string, file?: string) => void;
}

export default function AIChat({ activeFile, fileContent, onCodeGenerated }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '👋 Hi! I\'m BEAST MODE AI. Describe what you want to build, and I\'ll generate the code for you.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build enhanced context for BEAST MODE
      const { codebaseContext } = await import('@/lib/ide/codebaseContext');
      
      let codebaseInfo = null;
      try {
        const context = await codebaseContext.getContext(activeFile || '', undefined);
        codebaseInfo = {
          relatedFiles: context.relatedFiles.slice(0, 5),
          dependencies: context.dependencies.slice(0, 5),
          architecture: context.structure.architecture,
        };
      } catch (error) {
        console.warn('Failed to load codebase context:', error);
      }

      const context = {
        activeFile: activeFile || null,
        fileContent: fileContent || null,
        conversationHistory: messages.slice(-5).map(m => ({
          role: m.role,
          content: m.content,
        })),
        codebase: codebaseInfo,
      };

      // Call BEAST MODE conversation API
      const response = await fetch('/api/beast-mode/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context,
          task: 'generate_code',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract code if present
      let code = '';
      let content = data.response || data.message || 'I generated the code for you!';
      
      if (data.code) {
        code = data.code;
      } else if (data.response?.includes('```')) {
        // Extract code from markdown code blocks
        const codeMatch = data.response.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          code = codeMatch[1];
          content = data.response.replace(/```[\w]*\n[\s\S]*?```/g, '').trim() || 'Generated code:';
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        code: code || undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If code was generated, notify parent
      if (code && onCodeGenerated) {
        onCodeGenerated(code, activeFile || undefined);
        showToast('Code generated! Click to insert.', 'success');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      showToast('Failed to generate code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertCode = (code: string) => {
    if (onCodeGenerated) {
      onCodeGenerated(code, activeFile || undefined);
      showToast('Code inserted!', 'success');
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center">
          <span className="text-lg font-semibold">BEAST MODE AI</span>
          {activeFile && (
            <span className="ml-3 text-xs text-slate-400">
              Context: {activeFile}
            </span>
          )}
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-slate-400 hover:text-slate-200"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-800 text-slate-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
              {message.code && (
                <div className="mt-3">
                  <div className="bg-slate-950 rounded p-3 border border-slate-700">
                    <pre className="text-xs text-slate-300 overflow-x-auto">
                      <code>{message.code}</code>
                    </pre>
                  </div>
                  <button
                    onClick={() => insertCode(message.code!)}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  >
                    Insert Code
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-slate-400">Generating code...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
