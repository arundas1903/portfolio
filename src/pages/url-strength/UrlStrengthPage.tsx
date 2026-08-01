import React, { useEffect, useState } from 'react';
import SubpageNav from '../../components/ios26/SubpageNav';
import GlassCard from '../../components/ios26/GlassCard';
import Button from '../../components/ios26/Button';
import ChatPasswordGate from '../../components/chatbots/ChatPasswordGate';
import { analyzeUrlStrength, fetchUrlStrengthLimits } from '../../api/urlStrength';
import type { UrlStrengthLimits } from '../../api/urlStrength';
import {
  getChatPassword,
  unlockChat,
  clearChatPassword,
} from '../../api/chatAuth';
import type { UrlRiskLevel, UrlStrengthResult } from '../../types/urlStrength';
import { trackEvent } from '../../analytics/mixpanel';

const RISK_LABELS: Record<UrlRiskLevel, string> = {
  low: 'Lower risk',
  medium: 'Moderate risk',
  high: 'Higher risk',
};

function formatDomainAge(days: number | null): string {
  if (days === null) {
    return 'Unknown';
  }
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${days} day${days === 1 ? '' : 's'}`;
}

export default function UrlStrengthPage() {
  const [aiUnlocked, setAiUnlocked] = useState(false);
  const [checkingAiAccess, setCheckingAiAccess] = useState(true);
  const [useAi, setUseAi] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UrlStrengthResult | null>(null);
  const [limits, setLimits] = useState<UrlStrengthLimits | null>(null);

  const loadLimits = React.useCallback(async () => {
    try {
      const next = await fetchUrlStrengthLimits();
      setLimits(next);
      setAiUnlocked(next.ai_unlocked);
    } catch {
      // Limits banner is supplementary.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const verifyAiAccess = async () => {
      setCheckingAiAccess(true);
      try {
        const storedPassword = getChatPassword();
        if (!storedPassword) {
          return;
        }

        await unlockChat(storedPassword);
        if (!cancelled) {
          setAiUnlocked(true);
        }
      } catch {
        clearChatPassword();
        if (!cancelled) {
          setAiUnlocked(false);
          setUseAi(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingAiAccess(false);
        }
      }
    };

    verifyAiAccess();
    loadLimits();

    return () => {
      cancelled = true;
    };
  }, [loadLimits]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter a URL to analyze.');
      return;
    }

    if (useAi && !aiUnlocked) {
      setError('Enter the access password to enable AI analysis.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const analysis = await analyzeUrlStrength(trimmed, { useAi: useAi && aiUnlocked });
      setResult(analysis);
      trackEvent('URL Strength Analyze', {
        risk_level: analysis.risk_level,
        ai_tokens: analysis.ai_tokens,
        source: analysis.source,
        use_ai: useAi && aiUnlocked,
      });
      await loadLimits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not analyze URL';
      if (message.includes('access password required')) {
        setAiUnlocked(false);
        setUseAi(false);
        clearChatPassword();
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAiUnlocked = () => {
    setAiUnlocked(true);
    setUseAi(true);
    loadLimits();
  };

  return (
    <div className="us-page">
      <div className="us-background" aria-hidden />

      <div className="us-page__inner">
        <SubpageNav to="/" label="Portfolio" />

        <header className="us-hero ios26-liquid-glass-la glass-surface">
          <p className="us-eyebrow ios26-caption2">URL trust checker</p>
          <h1 className="ios26-large-title ios26-large-title--emphasized">URL Strength</h1>
          <p className="ios26-body us-lead">
            Paste a link for a free technical scan—domain age, stack fingerprints, and spam-like
            signals. Unlock AI analysis for a written risk summary. This is guidance, not a
            guarantee a site is safe.
          </p>
        </header>

        <GlassCard size="la" className="us-panel us-panel--form">
          {limits && (
            <p className="ios26-footnote us-quota">
              {limits.remaining > 0 ? (
                <>
                  <strong>{limits.remaining}</strong> of {limits.limit} analyses remaining today
                </>
              ) : (
                <>Daily limit reached ({limits.limit} per day). Try again tomorrow.</>
              )}
            </p>
          )}

          <form className="us-form" onSubmit={handleSubmit}>
            <label className="us-field">
              <span className="ios26-footnote us-muted">Website URL</span>
              <input
                className="us-input ios26-body"
                type="text"
                inputMode="url"
                placeholder="arundas.me or https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                autoComplete="url"
                spellCheck={false}
              />
            </label>

            <label className="us-ai-toggle ios26-footnote">
              <input
                type="checkbox"
                checked={useAi}
                disabled={!aiUnlocked || checkingAiAccess}
                onChange={(event) => setUseAi(event.target.checked)}
              />
              <span>Include AI-written risk summary</span>
            </label>

            <Button
              variant="filled"
              type="submit"
              disabled={loading || limits?.remaining === 0}
            >
              {loading ? 'Analyzing…' : useAi && aiUnlocked ? 'Analyze with AI' : 'Analyze URL'}
            </Button>
          </form>

          {error && <p className="us-error ios26-footnote">{error}</p>}

          {!checkingAiAccess && !aiUnlocked && (
            <div className="us-ai-unlock">
              <p className="ios26-footnote us-muted">
                AI summaries use OpenAI and require the portfolio access password.
              </p>
              <ChatPasswordGate
                title="Unlock AI analysis"
                description="Enter the access password to enable AI-written risk summaries."
                buttonLabel="Unlock AI analysis"
                onUnlocked={handleAiUnlocked}
              />
            </div>
          )}
        </GlassCard>

        {result && (
          <div className="us-results">
            <GlassCard size="la" className={`us-risk-card us-risk-card--${result.risk_level}`}>
              <div className="us-risk-card__header">
                <div>
                  <p className="us-eyebrow ios26-caption2">Assessment</p>
                  <h2 className="ios26-title2">{RISK_LABELS[result.risk_level]}</h2>
                </div>
                <span className={`us-risk-badge us-risk-badge--${result.risk_level} ios26-caption2`}>
                  {result.risk_level}
                </span>
              </div>
              <p className="ios26-body us-risk-card__summary">{result.summary}</p>
              <p className="ios26-footnote us-muted us-risk-card__recommendation">
                {result.recommendation}
              </p>
              {result.source === 'heuristic' && (
                <p className="ios26-caption2 us-muted us-heuristic-note">
                  Heuristic scan — unlock AI analysis above for an OpenAI-written summary.
                </p>
              )}
            </GlassCard>

            <div className="us-grid">
              <GlassCard size="la" className="us-panel">
                <h3 className="ios26-headline">Why this score</h3>
                <ul className="us-list ios26-footnote">
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </GlassCard>

              <GlassCard size="la" className="us-panel">
                <h3 className="ios26-headline">Content read</h3>
                <p className="ios26-footnote">{result.content_assessment}</p>
                {result.spam_flags.length > 0 && (
                  <>
                    <p className="ios26-caption2 us-muted us-section-label">Heuristic flags</p>
                    <ul className="us-list ios26-caption2">
                      {result.spam_flags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </>
                )}
              </GlassCard>
            </div>

            <GlassCard size="la" className="us-panel">
              <h3 className="ios26-headline">Technical signals</h3>
              <div className="us-signals">
                {result.technical_signals.map((signal) => (
                  <div key={signal.name} className="us-signal">
                    <span className="ios26-caption2 us-muted">{signal.name}</span>
                    <span className="ios26-footnote">{signal.value}</span>
                    <span className="ios26-caption2 us-muted">{signal.detail}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="us-grid">
              <GlassCard size="la" className="us-panel">
                <h3 className="ios26-headline">Technologies</h3>
                {result.technologies.length > 0 ? (
                  <div className="us-tags">
                    {result.technologies.map((tech) => (
                      <span key={tech} className="us-tag ios26-caption2">
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="ios26-footnote us-muted">No obvious stack fingerprints detected.</p>
                )}
              </GlassCard>

              <GlassCard size="la" className="us-panel">
                <h3 className="ios26-headline">Usage</h3>
                <dl className="us-meta ios26-footnote">
                  <div>
                    <dt>Final URL</dt>
                    <dd>{result.final_url}</dd>
                  </div>
                  <div>
                    <dt>Domain age</dt>
                    <dd>{formatDomainAge(result.domain_age_days)}</dd>
                  </div>
                  <div>
                    <dt>Analysis source</dt>
                    <dd>{result.source}</dd>
                  </div>
                  <div>
                    <dt>AI tokens</dt>
                    <dd>
                      {result.ai_tokens.toLocaleString()} total
                      {result.ai_tokens > 0 && (
                        <span className="us-muted">
                          {' '}
                          ({result.prompt_tokens.toLocaleString()} prompt ·{' '}
                          {result.completion_tokens.toLocaleString()} completion)
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
