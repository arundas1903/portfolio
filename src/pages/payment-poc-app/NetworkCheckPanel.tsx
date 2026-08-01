import React from 'react';
import type { NetworkCheckResult } from '../../types/payment-network';
import { formatSimSwapStatus } from '../../types/payment-network';

interface NetworkCheckPanelProps {
  loading: boolean;
  error?: string;
  result: NetworkCheckResult | null;
}

function riskClass(level: string | undefined): string {
  if (level === 'high') return 'pay-network__risk pay-network__risk--high';
  if (level === 'medium') return 'pay-network__risk pay-network__risk--medium';
  return 'pay-network__risk pay-network__risk--low';
}

export default function NetworkCheckPanel({ loading, error, result }: NetworkCheckPanelProps) {
  return (
    <section className="pay-network ios26-liquid-glass-me glass-surface" aria-live="polite">
      <div className="pay-network__header">
        <p className="pay-network__eyebrow ios26-caption2">Network intelligence</p>
        <span className="pay-network__badge ios26-caption2">SIM swap · Location</span>
      </div>

      {loading && <p className="ios26-footnote pay-muted">Checking number on carrier network…</p>}

      {error && !loading && <p className="pay-error ios26-caption2">{error}</p>}

      {result && !loading && (
        <div className="pay-network__grid">
          {result.sim_swap && (
            <div className="pay-network__item">
              <p className="ios26-caption2 pay-muted">SIM swap</p>
              <p className="ios26-footnote">{formatSimSwapStatus(result.sim_swap.status)}</p>
              {result.sim_swap.swapped_within_days != null && (
                <p className="ios26-caption2 pay-muted">
                  Swapped within {result.sim_swap.swapped_within_days} days
                </p>
              )}
              <span className={riskClass(result.sim_swap.risk_level)}>
                {result.sim_swap.risk_level} risk
              </span>
            </div>
          )}

          {result.location && (
            <div className="pay-network__item">
              <p className="ios26-caption2 pay-muted">Location</p>
              <p className="ios26-footnote">
                {result.location.city}, {result.location.region}
              </p>
              <p className="ios26-caption2 pay-muted">
                {result.location.country} · {result.location.carrier}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
