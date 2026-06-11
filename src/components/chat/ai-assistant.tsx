'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-4 w-[350px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col h-[500px] max-h-[calc(100vh-8rem)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium">Shashi's AI Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                  <Bot className="size-8 opacity-50" />
                  <p className="text-sm">
                    Hi! I'm an AI assistant trained on Shashi's portfolio. Ask me anything about his work, skills, or experience!
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${
                      m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        m.role === 'user'
                          ? 'bg-primary/20'
                          : 'bg-muted border border-border/50'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <User className="size-4 text-primary" />
                      ) : (
                        <Bot className="size-4 text-foreground" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[80%] ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted/50 rounded-tl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border/50">
                    <Bot className="size-4 text-foreground" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-muted/50 px-4 py-3 rounded-tl-sm">
                    <div className="size-1.5 animate-bounce rounded-full bg-foreground/50" />
                    <div className="size-1.5 animate-bounce rounded-full bg-foreground/50 delay-75" />
                    <div className="size-1.5 animate-bounce rounded-full bg-foreground/50 delay-150" />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-border/50 bg-muted/10 p-3"
            >
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question..."
                  className="w-full rounded-xl border border-border/50 bg-background pl-4 pr-10 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      </button>
    </div>
  );
}
