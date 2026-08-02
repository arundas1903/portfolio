import React, { useEffect, useState } from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import { API_BASE } from '../../api/chatAuth';
import {
  getFlowBuilderEmail,
  unlockFlowBuilder,
} from '../api/flowBuilderAuth';

interface FlowBuilderAccessGateProps {
  onUnlocked: () => void;
}

export default function FlowBuilderAccessGate({ onUnlocked }: FlowBuilderAccessGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const storedEmail = getFlowBuilderEmail();
        if (storedEmail) {
          setEmail(storedEmail);
        }

        const status = await fetch(`${API_BASE}/api/flow-builder/access`);
        if (status.ok) {
          const access = await status.json();
          if (!cancelled) {
            setPasswordRequired(access.required);
          }
        }
      } catch {
        // Gate still works with defaults.
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || loading || (passwordRequired && !password.trim())) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await unlockFlowBuilder(email, password);
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock Flow Builder');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <GlassCard size="la" className="fb-gate ios26-liquid-glass-la glass-surface">
        <p className="ios26-footnote fb-muted">Checking access…</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard size="la" className="fb-gate ios26-liquid-glass-la glass-surface">
      <p className="fb-eyebrow ios26-caption2">Flow Builder</p>
      <h2 className="ios26-title2">Sign in</h2>
      <p className="ios26-footnote fb-muted">
        Your email links saved configurations and the public run API.
      </p>

      <form className="fb-gate__form" onSubmit={handleSubmit}>
        <label className="fb-field">
          <span className="ios26-caption2 fb-muted">Email</span>
          <input
            className="fb-input ios26-footnote"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />
        </label>
        {passwordRequired && (
          <label className="fb-field">
            <span className="ios26-caption2 fb-muted">Access password</span>
            <input
              className="fb-input ios26-footnote"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Portfolio access password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </label>
        )}
        {error && <p className="fb-error ios26-caption2">{error}</p>}
        <div className="fb-gate__actions">
          <Button
            variant="filled"
            type="submit"
            disabled={loading || !email.trim() || (passwordRequired && !password.trim())}
          >
            {loading ? 'Unlocking…' : 'Continue'}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
