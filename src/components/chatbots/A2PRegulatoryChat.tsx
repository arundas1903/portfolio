import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ios26/Button';
import { fetchChatLimits, sendA2PMessage } from '../../api/a2p';
import type { ChatLimits } from '../../api/chat';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  countries?: string[];
}

const STARTER_PROMPTS = [
  'Which countries require alphanumeric sender registration?',
  'Can I send marketing SMS from a short code in Brazil?',
  'Compare A2P support in US, UK, and India',
];

interface A2PRegulatoryChatProps {
  onAuthExpired?: () => void;
}

export default function A2PRegulatoryChat({ onAuthExpired }: A2PRegulatoryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask about A2P SMS regulations — country support, sender channels, registration, and onboarding steps across 190+ markets.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limits, setLimits] = useState<ChatLimits | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshLimits = useCallback(async () => {
    try {
      const nextLimits = await fetchChatLimits();
      setLimits(nextLimits);
    } catch {
      setLimits(null);
    }
  }, []);

  useEffect(() => {
    refreshLimits();
  }, [refreshLimits]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const isRateLimited = limits !== null && limits.remaining <= 0;
  const retryMinutes = limits?.retry_after_seconds
    ? Math.max(1, Math.ceil(limits.retry_after_seconds / 60))
    : null;

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading || isRateLimited) return;

    setError('');
    setInput('');
    setLoading(true);

    const userMessageId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMessageId, role: 'user', content: message }]);

    try {
      const response = await sendA2PMessage(message);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.reply,
          countries: response.countries,
        },
      ]);
      await refreshLimits();
    } catch (err) {
      setMessages((prev) => prev.filter((entry) => entry.id !== userMessageId));
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      if (errorMessage.toLowerCase().includes('password')) {
        onAuthExpired?.();
      }
      if (errorMessage.toLowerCase().includes('limit')) {
        await refreshLimits();
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {limits && (
        <p className="chat-limit-banner ios26-caption2">
          {isRateLimited
            ? `Free limit reached (${limits.limit} messages per ${limits.window_minutes} min). Try again in ~${retryMinutes} min.`
            : `${limits.remaining} of ${limits.limit} free messages left · resets every ${limits.window_minutes} min`}
        </p>
      )}

      <div className="chat-widget__messages">
        {messages.map((message) => (
          <article key={message.id} className={`chat-message chat-message--${message.role}`}>
            <div className="chat-bubble">
              <p className="ios26-footnote" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {message.content}
              </p>
              {message.countries && message.countries.length > 0 && (
                <div className="chat-sources">
                  <p className="ios26-caption2 ios26-caption2--emphasized">Markets referenced</p>
                  <blockquote>
                    <span className="ios26-caption2">{message.countries.join(', ')}</span>
                  </blockquote>
                </div>
              )}
            </div>
          </article>
        ))}
        {loading && (
          <article className="chat-message chat-message--assistant">
            <div className="chat-bubble chat-bubble--loading ios26-caption2">
              Checking regulatory data…
            </div>
          </article>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && !isRateLimited && (
        <div className="chat-prompts">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="chat-prompt-chip ios26-caption2"
              onClick={() => handleSend(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {error && <p className="chat-error ios26-caption2">{error}</p>}

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <input
          className="chat-input ios26-footnote"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isRateLimited ? 'Message limit reached for now…' : 'Ask about a country or channel…'}
          disabled={loading || isRateLimited}
          aria-label="A2P regulatory question"
        />
        <Button variant="filled" type="submit" disabled={loading || isRateLimited || !input.trim()}>
          Send
        </Button>
      </form>
    </>
  );
}
