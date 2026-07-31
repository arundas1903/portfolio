import React from 'react';
import type { BfsiUsage } from '../../types/bfsi';

interface BfsiOverviewTabProps {
  usage: BfsiUsage | null;
  loading: boolean;
}

function formatMoney(paise: number): string {
  if (paise >= 100) {
    return `₹${(paise / 100).toFixed(2)}`;
  }
  return `${paise} paise`;
}

const CHANNEL_STATS = [
  { key: 'sms' as const, label: 'SMS', unit: 'messages' },
  { key: 'email' as const, label: 'Email', unit: 'messages' },
  { key: 'push' as const, label: 'Push notifications', unit: 'sent' },
];

export default function BfsiOverviewTab({ usage, loading }: BfsiOverviewTabProps) {
  if (loading) {
    return <p className="ios26-footnote bfsi-muted">Loading analytics…</p>;
  }

  if (!usage || usage.send_count === 0) {
    return (
      <>
        <p className="ios26-footnote bfsi-muted">
          ROI analytics appear once notifications are sent through the v1 API.
        </p>
        <div className="bfsi-placeholder">
          <span className="ios26-headline">No sends yet</span>
          <span className="ios26-caption2 bfsi-muted">
            Smart routing savings are calculated against an SMS-only baseline at{' '}
            {usage?.channel_prices.sms ?? 10} paise per message.
          </span>
        </div>
      </>
    );
  }

  const smsPrice = usage.channel_prices.sms;

  return (
    <>
      <p className="ios26-footnote bfsi-muted">
        Compares actual routed delivery against a baseline where every notification went via SMS (
        {smsPrice} paise each).
      </p>

      <div className="bfsi-roi-grid">
        {CHANNEL_STATS.map(({ key, label, unit }) => (
          <article key={key} className="bfsi-roi-card">
            <span className="bfsi-roi-card__label ios26-caption2">{label}</span>
            <span className="bfsi-roi-card__value ios26-title2">{usage.channel_counts[key]}</span>
            <span className="bfsi-roi-card__meta ios26-caption2 bfsi-muted">{unit}</span>
          </article>
        ))}
      </div>

      <article className="bfsi-roi-summary">
        <div className="bfsi-roi-summary__header">
          <p className="bfsi-eyebrow ios26-caption2">ROI dashboard</p>
          <h3 className="ios26-headline">Savings vs SMS-only routing</h3>
        </div>

        <div className="bfsi-roi-compare">
          <div className="bfsi-roi-compare__row">
            <span className="ios26-footnote">If SMS were the default channel</span>
            <span className="ios26-headline">{formatMoney(usage.baseline_cost_paise)}</span>
            <span className="ios26-caption2 bfsi-muted">
              {usage.send_count} × {smsPrice} paise
            </span>
          </div>
          <div className="bfsi-roi-compare__row">
            <span className="ios26-footnote">Actual cost with smart routing</span>
            <span className="ios26-headline">{formatMoney(usage.total_usage_paise)}</span>
            <span className="ios26-caption2 bfsi-muted">SMS, email & push mix</span>
          </div>
        </div>

        <div className="bfsi-roi-savings">
          <div>
            <span className="bfsi-roi-savings__label ios26-caption2">Total saved</span>
            <span className="bfsi-roi-savings__amount ios26-title2">
              {formatMoney(usage.savings_paise)}
            </span>
          </div>
          {usage.savings_paise > 0 && (
            <span className="bfsi-roi-savings__badge ios26-caption2">
              {usage.savings_percent}% lower spend
            </span>
          )}
        </div>

        {usage.savings_paise > 0 && (
          <div className="bfsi-roi-bar" aria-hidden>
            <div
              className="bfsi-roi-bar__actual"
              style={{ width: `${100 - usage.savings_percent}%` }}
            />
          </div>
        )}
      </article>
    </>
  );
}
