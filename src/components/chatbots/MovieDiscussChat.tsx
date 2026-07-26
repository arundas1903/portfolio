import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ios26/Button';
import MovieEmailGate from './MovieEmailGate';
import {
  clearMovieSession,
  fetchMovieProfile,
  getMovieToken,
  sendMovieMessage,
} from '../../api/movies';
import type { MovieChatMessage, MovieUserProfile } from '../../types/movies';

const ONBOARDING_STARTERS = [
  'I love smart sci-fi and character-driven dramas',
  'Give me feel-good comedies with heart',
  'I enjoy thrillers but avoid horror',
];

const CHAT_STARTERS = [
  'Recommend something for tonight based on my taste',
  'I just watched Dune — what did critics think?',
  'Suggest a hidden gem I might have missed',
];

interface MovieDiscussChatProps {
  onSignOut?: () => void;
}

export default function MovieDiscussChat({ onSignOut }: MovieDiscussChatProps) {
  const [user, setUser] = useState<MovieUserProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [messages, setMessages] = useState<MovieChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bootstrapWelcome = useCallback((profile: MovieUserProfile) => {
    if (!profile.onboarding_complete) {
      return 'Welcome to Movie Discuss! Before I recommend anything, tell me what kinds of films you enjoy — genres, moods, recent favorites, or things you avoid.';
    }
    return `Welcome back! I remember your taste${profile.interests?.genres ? ` (${String(profile.interests.genres)})` : ''}. Ask for a recommendation or tell me about a movie you watched.`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!getMovieToken()) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const profile = await fetchMovieProfile();
        if (cancelled) return;
        setUser(profile);
        setMessages([{ role: 'assistant', content: bootstrapWelcome(profile) }]);
      } catch {
        clearMovieSession();
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    loadSession();
  }, [bootstrapWelcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleVerified = (profile: MovieUserProfile) => {
    setUser(profile);
    setMessages([{ role: 'assistant', content: bootstrapWelcome(profile) }]);
    setError('');
  };

  const handleSignOut = () => {
    clearMovieSession();
    setUser(null);
    setMessages([]);
    onSignOut?.();
  };

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading || !user) return;

    setError('');
    setInput('');
    setLoading(true);

    const history = messages.map(({ role, content }) => ({ role, content }));
    const userMessage: MovieChatMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendMovieMessage(message, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              onboarding_complete: response.onboarding_complete,
              interests: response.interests,
            }
          : prev,
      );
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      if (errorMessage.toLowerCase().includes('session')) {
        handleSignOut();
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="chat-password-gate chat-password-gate--loading">
        <p className="ios26-footnote" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
          Loading your session…
        </p>
      </div>
    );
  }

  if (!user) {
    return <MovieEmailGate onStarted={handleVerified} />;
  }

  const starters = user.onboarding_complete ? CHAT_STARTERS : ONBOARDING_STARTERS;
  const showStarters = messages.length <= 1;

  return (
    <>
      <p className="chat-limit-banner ios26-caption2">
        Signed in as {user.email}
        {' · '}
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            border: 'none',
            background: 'none',
            padding: 0,
            color: 'var(--color-accent-blue)',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Sign out
        </button>
      </p>

      <div className="chat-widget__messages">
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`chat-message chat-message--${message.role}`}>
            <div className="chat-bubble">
              <p className="ios26-footnote" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {message.content}
              </p>
            </div>
          </article>
        ))}
        {loading && (
          <article className="chat-message chat-message--assistant">
            <div className="chat-bubble chat-bubble--loading ios26-caption2">
              Thinking about your next watch…
            </div>
          </article>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showStarters && (
        <div className="chat-prompts">
          {starters.map((prompt) => (
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
          placeholder={
            user.onboarding_complete
              ? 'Ask for a recommendation or review a film…'
              : 'Tell me about your movie taste…'
          }
          disabled={loading}
        />
        <Button variant="filled" type="submit" disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </>
  );
}
