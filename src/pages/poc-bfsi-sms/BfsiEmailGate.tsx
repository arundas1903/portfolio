import React, { useEffect, useState } from 'react';
import Button from '../../components/ios26/Button';
import { getStoredBfsiEmail, startBfsiSession } from '../../api/bfsi';
import type { BfsiUserProfile } from '../../types/bfsi';

interface BfsiEmailGateProps {
  onStarted: (user: BfsiUserProfile) => void;
}

export default function BfsiEmailGate({ onStarted }: BfsiEmailGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedEmail = getStoredBfsiEmail();
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
      const result = await startBfsiSession(trimmed);
      onStarted(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bfsi-gate ios26-liquid-glass-la glass-surface">
      <div className="bfsi-gate__icon" aria-hidden>🏦</div>
      <h1 className="ios26-title2">BFSI Smart Notifications</h1>
      <p className="ios26-footnote bfsi-gate__lead">
        Sign in with your email to manage intelligent notification templates. One email per browser
        and network.
      </p>

      <form className="bfsi-gate__form" onSubmit={handleSubmit}>
        <label className="ios26-caption2 bfsi-field-label" htmlFor="bfsi-email">
          Work email
        </label>
        <input
          id="bfsi-email"
          type="email"
          className="bfsi-input ios26-footnote"
          placeholder="you@bank.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading || Boolean(getStoredBfsiEmail())}
          autoComplete="email"
          required
        />
        {getStoredBfsiEmail() && (
          <p className="ios26-caption2 bfsi-muted">
            This browser is linked to {getStoredBfsiEmail()}.
          </p>
        )}
        {error && <p className="bfsi-error ios26-caption2">{error}</p>}
        <Button variant="filled" type="submit" disabled={loading || !email.trim()}>
          {loading ? 'Signing in…' : 'Enter application'}
        </Button>
      </form>
    </div>
  );
}
