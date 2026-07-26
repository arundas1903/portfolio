import React, { useEffect, useState } from 'react';
import Button from '../ios26/Button';
import { getStoredMovieEmail, startMovieSession } from '../../api/movies';
import type { MovieUserProfile } from '../../types/movies';

interface MovieEmailGateProps {
  onStarted: (user: MovieUserProfile) => void;
}

export default function MovieEmailGate({ onStarted }: MovieEmailGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedEmail = getStoredMovieEmail();
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await startMovieSession(trimmed);
      onStarted(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-password-gate">
      <div className="chat-password-gate__icon" aria-hidden>🎬</div>
      <p className="ios26-headline" style={{ margin: '0 0 6px' }}>
        Start with your email
      </p>
      <p className="ios26-footnote" style={{ margin: '0 0 16px', color: 'var(--color-label-secondary)' }}>
        One email per browser and network. Your taste profile and movie notes stay tied to this address.
      </p>

      <form className="chat-password-gate__form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="chat-input ios26-footnote"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading || Boolean(getStoredMovieEmail())}
          autoComplete="email"
          required
        />
        {getStoredMovieEmail() && (
          <p className="ios26-caption2" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
            This browser is linked to {getStoredMovieEmail()}.
          </p>
        )}
        {error && <p className="chat-error ios26-caption2">{error}</p>}
        <Button variant="filled" type="submit" disabled={loading || !email.trim()}>
          {loading ? 'Starting…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
