'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, Product } from '@/lib/api';
import { formatPrice, getSessionId } from '@/lib/utils';
import styles from './ChatWidget.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm TechHaven's AI Assistant. Ask me anything about our products — like \"best earbuds under $50\" or \"do you have 4K TVs?\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage(
        userMessage,
        getSessionId(),
        history
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
          products: response.products,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
        id="chat-toggle"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.headerDot}/>
              <div>
                <h3 className={styles.headerTitle}>TechHaven AI</h3>
                <span className={styles.headerStatus}>Online • Powered by AI</span>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.message} ${
                  msg.role === 'user' ? styles.messageUser : styles.messageAssistant
                }`}
              >
                <div className={styles.messageBubble}>
                  {msg.content}
                </div>
                {/* Product suggestions */}
                {msg.products && msg.products.length > 0 && (
                  <div className={styles.productSuggestions}>
                    {msg.products.slice(0, 3).map(p => (
                      <a
                        key={p.id}
                        href={`/products/${p.id}`}
                        className={styles.suggestedProduct}
                      >
                        <div className={styles.suggestedProductImg}>
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className={styles.suggestedProductInfo}>
                          <span className={styles.suggestedProductName}>{p.name}</span>
                          <span className={styles.suggestedProductPrice}>
                            {formatPrice(p.sale_price || p.price)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.messageAssistant}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.typingIndicator}>
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products..."
              className={styles.input}
              disabled={isLoading}
              id="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={styles.sendBtn}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
