import React from 'react';
import GlassCard from '../../components/ios26/GlassCard';

interface HomeScreenProps {
  balance: number;
  userName: string;
  onPayAnyone: () => void;
  onScan: () => void;
}

function formatBalance(amount: number): string {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HomeScreen({ balance, userName, onPayAnyone, onScan }: HomeScreenProps) {
  return (
    <div className="pay-screen">
      <GlassCard size="la" className="pay-balance-card">
        <p className="ios26-caption2 pay-muted">Available balance</p>
        <p className="ios26-large-title ios26-large-title--emphasized pay-balance">
          ₹{formatBalance(balance)}
        </p>
        <p className="ios26-footnote pay-muted">Hi, {userName.split(' ')[0]}</p>
      </GlassCard>

      <button
        type="button"
        className="pay-search ios26-liquid-glass-me glass-surface"
        onClick={onPayAnyone}
      >
        <span className="pay-search__icon" aria-hidden>🔍</span>
        <span className="ios26-footnote pay-muted">Pay anyone on UPI</span>
      </button>

      <div className="pay-actions">
        <button type="button" className="pay-action ios26-liquid-glass-me glass-surface" onClick={onPayAnyone}>
          <span className="pay-action__icon" aria-hidden>↗</span>
          <span className="ios26-caption2">Pay</span>
        </button>
        <button type="button" className="pay-action ios26-liquid-glass-me glass-surface" onClick={onScan}>
          <span className="pay-action__icon" aria-hidden>▦</span>
          <span className="ios26-caption2">Scan</span>
        </button>
      </div>
    </div>
  );
}
