import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ios26/Button';
import { fetchChatLimits, sendMessage } from '../../api/chat';
import type { ChatLimits } from '../../api/chat';
import type { ChatMessage } from '../../types/chat';

const STARTER_PROMPTS = [
  'What do faiths teach about forgiveness?',
  'How should we treat the needy?',
  'What is said about life\'s purpose?',
];

interface FaithDiscussChatProps {
  onAuthExpired?: () => void;
}

export default function FaithDiscussChat({ onAuthExpired }: FaithDiscussChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask me about religion or spirituality — I\'ll search the Bible, Quran, and Hindu scriptures and reply with sources.',
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
      const response = await sendMessage(message);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.reply,
          sources: response.sources,
          isReligious: response.is_religious,
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
              <p className="ios26-footnote" style={{ margin: 0 }}>{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="chat-sources">
                  <p className="ios26-caption2 ios26-caption2--emphasized">Sources</p>
                  {message.sources.map((source) => (
                    <blockquote key={`${source.tradition}-${source.reference}`}>
                      <strong className="ios26-caption2 ios26-caption2--emphasized">
                        {source.tradition} — {source.reference}
                      </strong>
                      <span className="ios26-caption2">{source.text}</span>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
        {loading && (
          <article className="chat-message chat-message--assistant">
            <div className="chat-bubble chat-bubble--loading ios26-caption2">
              Searching scriptures…
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
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          className="chat-input ios26-footnote"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRateLimited ? 'Message limit reached for now…' : 'Ask about faith, prayer, purpose…'}
          disabled={loading || isRateLimited}
        />
        <Button variant="filled" type="submit" disabled={loading || isRateLimited || !input.trim()}>
          Send
        </Button>
      </form>
    </>
  );
}
