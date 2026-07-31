import React from 'react';
import { KaleEmpty } from '../../design/kaleyra';
import type { BfsiUsage } from '../../types/bfsi';

interface Bfsi2OverviewTabProps {
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

export default function Bfsi2OverviewTab({ usage, loading }: Bfsi2OverviewTabProps) {
  if (loading) {
    return <p className="kale-text-300">Loading analytics…</p>;
  }

  if (!usage || usage.send_count === 0) {
    return (
      <>
        <p className="kale-text-300">
          ROI analytics appear once notifications are sent through the v1 API.
        </p>
        <KaleEmpty>
          <p className="kale-title-500">No sends yet</p>
          <p className="kale-text-300">
            Smart routing savings are calculated against an SMS-only baseline at{' '}
            {usage?.channel_prices.sms ?? 10} paise per message.
          </p>
        </KaleEmpty>
      </>
    );
  }

  const smsPrice = usage.channel_prices.sms;

  return (
    <>
      <p className="kale-text-300">
        Compares actual routed delivery against a baseline where every notification went via SMS (
        {smsPrice} paise each).
      </p>

      <div className="kale-stat-grid">
        {CHANNEL_STATS.map(({ key, label, unit }) => (
          <article key={key} className="kale-stat">
            <span className="kale-stat__label">{label}</span>
            <span className="kale-stat__value">{usage.channel_counts[key]}</span>
            <span className="kale-text-300">{unit}</span>
          </article>
        ))}
      </div>

      <article className="bfsi2-roi-summary">
        <div>
          <p className="kale-eyebrow">ROI dashboard</p>
          <h3 className="kale-title-500">Savings vs SMS-only routing</h3>
        </div>

        <div className="bfsi2-roi-compare">
          <div className="bfsi2-roi-compare__row">
            <span className="kale-text-500">If SMS were the default channel</span>
            <span className="kale-title-500">{formatMoney(usage.baseline_cost_paise)}</span>
            <span className="kale-text-300">
              {usage.send_count} × {smsPrice} paise
            </span>
          </div>
          <div className="bfsi2-roi-compare__row">
            <span className="kale-text-500">Actual cost with smart routing</span>
            <span className="kale-title-500">{formatMoney(usage.total_usage_paise)}</span>
            <span className="kale-text-300">SMS, email & push mix</span>
          </div>
        </div>

        <div className="bfsi2-roi-savings">
          <div>
            <span className="kale-text-300">Total saved</span>
            <span className="bfsi2-roi-savings__amount">{formatMoney(usage.savings_paise)}</span>
          </div>
          {usage.savings_paise > 0 && (
            <span className="kale-badge kale-badge--primary">
              {usage.savings_percent}% lower spend
            </span>
          )}
        </div>

        {usage.savings_paise > 0 && (
          <div className="bfsi2-roi-bar" aria-hidden>
            <div
              className="bfsi2-roi-bar__actual"
              style={{ width: `${100 - usage.savings_percent}%` }}
            />
          </div>
        )}
      </article>
    </>
  );
}
