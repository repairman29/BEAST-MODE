"use client";

import React, { useState, useEffect, useRef } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';

/**
 * BEAST MODE Conversational AI Interface
 *
 * Natural language command system for quality analysis and recommendations
 */
function ConversationalAI() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    intent?: string;
    sentiment?: string;
  }>>([]);

  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    const greeting = {
      id: 'greeting',
      text: "🤖 BEAST MODE AI ready to assist. How can I help you today?\n\nTry commands like:\n• \"What's the quality of my code?\"\n• \"Suggest improvements\"\n• \"Run quality analysis\"",
      isUser: false,
      timestamp: new Date(),
      intent: 'greeting'
    };
    setMessages([greeting]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Send message to BEAST MODE API
      const response = await fetch('/api/beast-mode/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            conversationHistory: messages.slice(-5), // Last 5 messages for context
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const result = await response.json();

      const aiMessage = {
        id: `ai-${Date.now()}`,
        text: result.response,
        isUser: false,
        timestamp: new Date(),
        intent: result.intent,
        sentiment: result.sentiment
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Conversation error:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "❌ Sorry, I encountered an error processing your message. Please try again.",
        isUser: false,
        timestamp: new Date(),
        intent: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'cleared',
      text: "🧹 Conversation cleared. How can I help you?",
      isUser: false,
      timestamp: new Date(),
      intent: 'system'
    }]);
  };

  const suggestedCommands = [
    "What's the quality of my code?",
    "Suggest improvements",
    "Run quality analysis",
    "Show status",
    "Help"
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-12 cursor-pointer" onClick={() => setIsMinimized(false)}>
        <HudPanel>
          <div className="flex items-center justify-between">
            <span className="text-holo-cyan font-bold">🤖 BEAST MODE AI</span>
            <span className="text-holo-amber text-sm">Click to expand</span>
          </div>
        </HudPanel>
      </div>
    );
  }

  return (
    <HudPanel className="fixed bottom-4 right-4 w-96 h-128 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-holo-cyan/30">
        <h3 className="text-holo-cyan font-bold text-lg">🤖 BEAST MODE AI</h3>
        <div className="flex gap-2">
          <HudButton onClick={clearConversation} size="sm">
            🧹 Clear
          </HudButton>
          <HudButton onClick={() => setIsMinimized(true)} size="sm">
            −
          </HudButton>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.isUser
                ? 'bg-holo-cyan/20 ml-8 border-l-4 border-holo-cyan'
                : 'bg-holo-amber/10 mr-8 border-r-4 border-holo-amber'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">{message.text}</div>
            <div className="text-xs text-holo-cyan/60 mt-1">
              {message.timestamp.toLocaleTimeString()}
              {message.intent && message.intent !== 'unknown' && (
                <span className="ml-2 text-holo-purple">
                  [{message.intent}]
                </span>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="bg-holo-amber/10 mr-8 border-r-4 border-holo-amber p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-holo-cyan border-t-transparent rounded-full"></div>
              <span className="text-holo-cyan">Processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Commands */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <div className="text-holo-amber text-sm mb-2">💡 Try these commands:</div>
          <div className="flex flex-wrap gap-1">
            {suggestedCommands.map((cmd, index) => (
              <HudButton
                key={index}
                onClick={() => setInputMessage(cmd)}
                size="sm"
                className="text-xs"
              >
                {cmd}
              </HudButton>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your command..."
          className="flex-1 bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan"
          disabled={isProcessing}
        />
        <HudButton
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isProcessing}
        >
          {isProcessing ? '⏳' : '📤'}
        </HudButton>
      </div>

      {/* Status */}
      <div className="mt-2">
        <span className="text-xs text-holo-cyan/70">
          💬 {messages.length} messages | 🤖 BEAST MODE AI Active
        </span>
      </div>
    </HudPanel>
  );
}

export default ConversationalAI;
