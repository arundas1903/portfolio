import React, { useEffect, useState } from 'react';
import {
  KaleAlert,
  KaleButton,
  KaleField,
  KaleInput,
} from '../../design/kaleyra';
import {
  getStoredBfsiEmail,
  resetBfsiEmailForBrowser,
  startBfsiSession,
} from '../../api/bfsi';
import type { BfsiUserProfile } from '../../types/bfsi';

interface Bfsi2EmailGateProps {
  onStarted: (user: BfsiUserProfile) => void;
}

export default function Bfsi2EmailGate({ onStarted }: Bfsi2EmailGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [browserEmail, setBrowserEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = getStoredBfsiEmail();
    if (storedEmail) {
      setBrowserEmail(storedEmail);
      setEmail(storedEmail);
    }
  }, []);

  const handleResetEmail = async () => {
    setResetting(true);
    setError('');

    try {
      await resetBfsiEmailForBrowser();
      setBrowserEmail(null);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset email');
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || loading || resetting) return;

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

  const emailLocked = Boolean(browserEmail);
  const busy = loading || resetting;

  return (
    <div className="bfsi2-gate">
      <div className="bfsi2-gate__icon" aria-hidden>
        🏦
      </div>
      <h1 className="kale-title-500">BFSI Smart Notifications</h1>
      <p className="kale-text-300">
        Sign in with your email to manage intelligent notification templates. One email per browser
        and network.
      </p>

      <form className="bfsi2-gate__form" onSubmit={handleSubmit}>
        <KaleField label="Work email" htmlFor="bfsi2-email">
          <KaleInput
            id="bfsi2-email"
            type="email"
            placeholder="you@bank.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy || emailLocked}
            autoComplete="email"
            required
          />
        </KaleField>

        {emailLocked && (
          <KaleAlert variant="info">
            This browser is linked to {browserEmail}.
          </KaleAlert>
        )}

        {error && <KaleAlert variant="error">{error}</KaleAlert>}

        <div className="bfsi2-gate__actions">
          {emailLocked && (
            <KaleButton variant="ghost" fullWidth disabled={busy} onClick={handleResetEmail}>
              {resetting ? 'Resetting…' : 'Reset email'}
            </KaleButton>
          )}
          <KaleButton variant="primary" fullWidth disabled={busy || !email.trim()} type="submit">
            {loading ? 'Signing in…' : 'Enter application'}
          </KaleButton>
        </div>
      </form>
    </div>
  );
}
