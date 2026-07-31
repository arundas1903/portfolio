import React, { useEffect, useState } from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import {
  clearStoredBrowserEmail,
  getStoredBrowserEmail,
} from './usePaymentStore';

interface SetupGateProps {
  onComplete: (email: string, phone: string) => void;
}

export default function SetupGate({ onComplete }: SetupGateProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [browserEmail, setBrowserEmail] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = getStoredBrowserEmail();
    if (stored) {
      setBrowserEmail(stored);
      setEmail(stored);
    }
  }, []);

  const handleResetEmail = () => {
    clearStoredBrowserEmail();
    setBrowserEmail(null);
    setEmail('');
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !trimmedPhone) {
      setError('Enter both email and phone number.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    onComplete(trimmedEmail, trimmedPhone);
  };

  const emailLocked = Boolean(browserEmail);

  return (
    <div className="pay-screen pay-screen--setup">
      <GlassCard size="la" className="pay-setup-card">
        <h1 className="ios26-title2">Welcome to UPI Pay</h1>
        <p className="ios26-footnote pay-muted">
          Enter your contact details to receive transaction alerts. One email per browser for this
          demo.
        </p>

        <form className="pay-setup-form" onSubmit={handleSubmit}>
          <label className="pay-field">
            <span className="ios26-caption2 pay-field-label">Email</span>
            <input
              className="pay-input ios26-footnote"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={emailLocked}
              required
            />
          </label>

          {emailLocked && (
            <p className="ios26-caption2 pay-muted">
              This browser is linked to {browserEmail}.
            </p>
          )}

          <label className="pay-field">
            <span className="ios26-caption2 pay-field-label">Phone number</span>
            <input
              className="pay-input ios26-footnote"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              autoComplete="tel"
              required
            />
          </label>

          {error && <p className="pay-error ios26-caption2">{error}</p>}

          <div className="pay-setup-actions">
            {emailLocked && (
              <Button variant="tinted" type="button" onClick={handleResetEmail}>
                Reset email
              </Button>
            )}
            <Button variant="filled" type="submit" disabled={!email.trim() || !phone.trim()}>
              Enter application
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
