import React, { useCallback, useEffect, useState } from 'react';
import { KaleCard } from '../../design/kaleyra';
import { fetchBfsiUsage } from '../../api/bfsi';
import type { BfsiDashboardView, BfsiUsage } from '../../types/bfsi';
import Bfsi2LogsTab from './Bfsi2LogsTab';
import Bfsi2OverviewTab from './Bfsi2OverviewTab';

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

export default function Bfsi2DashboardTab() {
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
    <KaleCard className="bfsi2-panel">
      <div>
        <p className="kale-eyebrow">Dashboard</p>
        <h2 className="kale-title-500">Analytics & delivery</h2>
      </div>

      {usage && (
        <div className="bfsi2-usage">
          <div className="bfsi2-usage__row">
            <span className="kale-text-300">Overall usage</span>
            <span className="bfsi2-usage__amount">{formatUsageTotal(usage.total_usage_paise)}</span>
            <span className="kale-text-300">{usage.send_count} sends</span>
            <span className="kale-text-300">
              · {usage.total_ai_tokens.toLocaleString()} AI tokens
            </span>
          </div>
          <p className="kale-text-300">
            SMS {usage.channel_prices.sms} paise · Email {usage.channel_prices.email} paise · Push{' '}
            {usage.channel_prices.push} paise
          </p>
        </div>
      )}

      <nav className="bfsi2-subtabs" aria-label="Dashboard views">
        {DASHBOARD_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bfsi2-subtab${view === item.id ? ' bfsi2-subtab--active' : ''}`}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {view === 'overview' && <Bfsi2OverviewTab usage={usage} loading={usageLoading} />}
      {view === 'logs' && <Bfsi2LogsTab onUsageUpdate={handleUsageUpdate} />}
    </KaleCard>
  );
}
