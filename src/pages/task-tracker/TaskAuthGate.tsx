import React, { useState } from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import { loginTaskUser, registerTaskUser } from '../../api/tasks';
import type { TaskUserProfile } from '../../types/tasks';

type AuthMode = 'login' | 'register';

interface TaskAuthGateProps {
  onAuthenticated: (user: TaskUserProfile) => void;
}

export default function TaskAuthGate({ onAuthenticated }: TaskAuthGateProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || loading) return;

    setLoading(true);
    setError('');
    try {
      const result =
        mode === 'login'
          ? await loginTaskUser(trimmedEmail, password)
          : await registerTaskUser(trimmedEmail, password);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard size="la" className="tt-gate ios26-liquid-glass-la glass-surface">
      <p className="tt-eyebrow ios26-caption2">Task Tracker</p>
      <h2 className="ios26-title2">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
      <p className="ios26-footnote tt-muted">
        {mode === 'login'
          ? 'Sign in with your email and password to access your notes.'
          : 'Register with email and password. Minimum 8 characters.'}
      </p>

      <div className="tt-auth-tabs">
        <button
          type="button"
          className={`tt-filter-chip ios26-caption2${mode === 'login' ? ' tt-filter-chip--active' : ''}`}
          onClick={() => {
            setMode('login');
            setError('');
          }}
        >
          Login
        </button>
        <button
          type="button"
          className={`tt-filter-chip ios26-caption2${mode === 'register' ? ' tt-filter-chip--active' : ''}`}
          onClick={() => {
            setMode('register');
            setError('');
          }}
        >
          Register
        </button>
      </div>

      <form className="tt-gate__form" onSubmit={handleSubmit}>
        <label className="tt-field">
          <span className="tt-field-label ios26-caption2">Email</span>
          <input
            className="tt-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="tt-field">
          <span className="tt-field-label ios26-caption2">Password</span>
          <input
            className="tt-input"
            type="password"
            placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 8 : 1}
            required
          />
        </label>
        {error && <p className="tt-error ios26-caption2">{error}</p>}
        <div className="tt-form-actions">
          <Button variant="filled" type="submit" disabled={loading || !email.trim() || !password}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
