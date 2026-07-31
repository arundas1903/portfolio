import React, { useCallback, useEffect, useState } from 'react';
import { fetchBfsiUsage } from '../../api/bfsi';
import type { BfsiDashboardView, BfsiUsage } from '../../types/bfsi';
import BfsiLogsTab from './BfsiLogsTab';
import BfsiOverviewTab from './BfsiOverviewTab';

const DASHBOARD_VIEWS: { id: BfsiDashboardView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'logs', label: 'Logs' },
];

function formatUsageTotal(paise: number): string {
  if (paise >= 100) {
    return `₹${(paise / 100).toFixed(2)}`;
  }
  return `${paise} paise`;
}

export default function BfsiDashboardTab() {
  const [view, setView] = useState<BfsiDashboardView>('overview');
  const [usage, setUsage] = useState<BfsiUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const result = await fetchBfsiUsage();
      setUsage(result);
    } catch {
      // Usage banner is supplementary; tabs still load independently.
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const handleUsageUpdate = useCallback(() => {
    loadUsage();
  }, [loadUsage]);

  return (
    <section className="bfsi-panel ios26-liquid-glass-la glass-surface">
      <p className="bfsi-eyebrow ios26-caption2">Dashboard</p>
      <h2 className="ios26-title2">Analytics & delivery</h2>

      {usage && (
        <div className="bfsi-usage">
          <div className="bfsi-usage__summary">
            <span className="bfsi-usage__label ios26-caption2">Overall usage</span>
            <span className="bfsi-usage__amount ios26-headline">
              {formatUsageTotal(usage.total_usage_paise)}
            </span>
            <span className="ios26-caption2 bfsi-muted">{usage.send_count} sends</span>
            <span className="ios26-caption2 bfsi-muted">
              · {usage.total_ai_tokens.toLocaleString()} AI tokens
            </span>
          </div>
          <p className="bfsi-usage__rates ios26-caption2 bfsi-muted">
            SMS {usage.channel_prices.sms} paise · Email {usage.channel_prices.email} paise · Push{' '}
            {usage.channel_prices.push} paise
          </p>
        </div>
      )}

      <nav className="bfsi-subtabs" aria-label="Dashboard views">
        {DASHBOARD_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bfsi-subtab ios26-caption2${view === item.id ? ' bfsi-subtab--active' : ''}`}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="bfsi-dashboard-body">
        {view === 'overview' && <BfsiOverviewTab usage={usage} loading={usageLoading} />}

        {view === 'logs' && <BfsiLogsTab onUsageUpdate={handleUsageUpdate} />}
      </div>
    </section>
  );
}
