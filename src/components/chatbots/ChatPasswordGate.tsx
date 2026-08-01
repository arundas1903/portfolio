import React, { useState } from 'react';
import Button from '../ios26/Button';
import { unlockChat } from '../../api/chat';

interface ChatPasswordGateProps {
  onUnlocked: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
  loadingLabel?: string;
}

export default function ChatPasswordGate({
  onUnlocked,
  title = 'Password required',
  description = 'Enter the access password to use Chat assistants.',
  buttonLabel = 'Unlock chat',
  loadingLabel = 'Checking…',
}: ChatPasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim() || loading) return;

    setError('');
    setLoading(true);

    try {
      await unlockChat(password.trim());
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-password-gate">
      <div className="chat-password-gate__icon" aria-hidden>🔒</div>
      <h3 className="ios26-headline" style={{ margin: '0 0 6px' }}>{title}</h3>
      <p className="ios26-footnote" style={{ margin: '0 0 16px', color: 'var(--color-label-secondary)' }}>
        {description}
      </p>

      <form className="chat-password-gate__form" onSubmit={handleSubmit}>
        <input
          className="chat-input ios26-footnote"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access password"
          autoComplete="current-password"
          disabled={loading}
        />
        {error && <p className="chat-error ios26-caption2">{error}</p>}
        <Button variant="filled" type="submit" disabled={loading || !password.trim()}>
          {loading ? loadingLabel : buttonLabel}
        </Button>
      </form>
    </div>
  );
}
