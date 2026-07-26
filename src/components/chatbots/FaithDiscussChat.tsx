import React, { useEffect, useRef, useState } from 'react';
import Button from '../ios26/Button';
import { sendMessage } from '../../api/chat';
import type { ChatMessage } from '../../types/chat';

const STARTER_PROMPTS = [
  'What do faiths teach about forgiveness?',
  'How should we treat the needy?',
  'What is said about life\'s purpose?',
];

export default function FaithDiscussChat() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setError('');
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: message }]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      {messages.length === 1 && (
        <div className="chat-prompts">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="chat-prompt-chip ios26-caption2"
              onClick={() => handleSend(prompt)}
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
          placeholder="Ask about faith, prayer, purpose…"
          disabled={loading}
        />
        <Button variant="filled" type="submit" disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </>
  );
}
