import React from 'react';
import GlassCard from '../../components/ios26/GlassCard';
import type { Transaction } from './types';

interface HistoryScreenProps {
  transactions: Transaction[];
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-IN', { weekday: 'long' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HistoryScreen({ transactions }: HistoryScreenProps) {
  return (
    <div className="pay-screen">
      <h1 className="ios26-title2">Activity</h1>

      {transactions.length === 0 ? (
        <GlassCard size="la" className="pay-empty">
          <span className="pay-empty__icon" aria-hidden>📋</span>
          <p className="ios26-footnote pay-muted">No transactions yet</p>
        </GlassCard>
      ) : (
        <GlassCard size="la" className="pay-tx-card">
          <ul className="pay-tx-list">
            {transactions.map((tx) => (
              <li key={tx.id} className="pay-tx">
                <div className="pay-tx__body">
                  <p className="ios26-headline">
                    {tx.type === 'sent' ? `Paid ${tx.name}` : `Received from ${tx.name}`}
                  </p>
                  <p className="ios26-caption2 pay-muted">
                    {formatDate(tx.createdAt)}
                    {tx.note ? ` · ${tx.note}` : ''}
                  </p>
                </div>
                <span className={`ios26-headline pay-tx__amount pay-tx__amount--${tx.type}`}>
                  {tx.type === 'sent' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
