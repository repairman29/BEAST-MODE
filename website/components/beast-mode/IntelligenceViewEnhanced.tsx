"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CardEnhanced, CardHeaderEnhanced, CardTitleEnhanced, CardContentEnhanced } from '../ui/CardEnhanced';
import { ButtonEnhanced } from '../ui/ButtonEnhanced';
import { EmptyState } from '../ui/EmptyState';
import { Send, Sparkles, MessageSquare, History, Lightbulb } from 'lucide-react';

/**
 * Enhanced Intelligence View
 * 
 * UX Principles Applied:
 * 1. Visual Hierarchy - Large, prominent chat interface
 * 2. Progressive Disclosure - Suggested prompts, history on demand
 * 3. Feedback - Typing indicators, message states
 * 4. Cognitive Load - Clear examples, helpful prompts
 */

interface IntelligenceViewEnhancedProps {
  data?: any;
  messages?: Array<{ role: 'user' | 'ai'; content: string }>;
  onCommand?: (command: string) => void;
}

const SUGGESTED_PROMPTS = [
  "How can I improve my code quality?",
  "What are the best practices for React components?",
  "Explain this codebase architecture",
  "Generate tests for this function",
  "Review this code for security issues"
];

export default function IntelligenceViewEnhanced({ 
  data, 
  messages = [], 
  onCommand 
}: IntelligenceViewEnhancedProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    if (onCommand) {
      onCommand(userMessage);
    }

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">AI Intelligence</h1>
        <p className="text-slate-400">Ask questions, get recommendations, and explore your codebase</p>
      </div>

      {/* Chat Interface - Large and Prominent */}
      <CardEnhanced className="flex-1 flex flex-col border-cyan-500/30">
        <CardHeaderEnhanced className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitleEnhanced className="text-xl">Codebase Assistant</CardTitleEnhanced>
                <p className="text-sm text-slate-400">Powered by BEAST MODE AI</p>
              </div>
            </div>
            <ButtonEnhanced
              variant="ghost"
              size="sm"
              icon={<History className="w-4 h-4" />}
              onClick={() => setShowHistory(!showHistory)}
            >
              History
            </ButtonEnhanced>
          </div>
        </CardHeaderEnhanced>

        {/* Messages Area - Large and Scrollable */}
        <CardContentEnhanced className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <EmptyState
              icon={<MessageSquare className="w-16 h-16 text-slate-600" />}
              title="Start a conversation"
              description="Ask questions about your codebase, get recommendations, or explore patterns. Try one of the suggested prompts below."
            />
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/20 text-white border border-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-200 border border-slate-700'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContentEnhanced>

        {/* Suggested Prompts - Progressive Disclosure */}
        {messages.length === 0 && (
          <div className="px-6 pb-4 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-400">Suggested prompts:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="px-3 py-2 text-sm bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area - Large and Prominent */}
        <div className="p-6 border-t border-slate-800">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question about your codebase..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
              />
            </div>
            <ButtonEnhanced
              size="lg"
              variant="gradient"
              icon={<Send className="w-5 h-5" />}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="self-end"
            >
              Send
            </ButtonEnhanced>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Shift+Enter</kbd> for new line
          </p>
        </div>
      </CardEnhanced>
    </div>
  );
}
