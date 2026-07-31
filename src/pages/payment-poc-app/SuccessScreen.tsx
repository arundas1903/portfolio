import React from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import type { Transaction } from './types';

interface SuccessScreenProps {
  transaction: Transaction;
  onDone: () => void;
}

export default function SuccessScreen({ transaction, onDone }: SuccessScreenProps) {
  return (
    <div className="pay-screen pay-screen--success">
      <GlassCard size="la" className="pay-success-card">
        <div className="pay-success__check" aria-hidden>✓</div>
        <p className="ios26-caption2 pay-muted">Payment successful</p>
        <p className="ios26-large-title ios26-large-title--emphasized">
          ₹{transaction.amount.toLocaleString('en-IN')}
        </p>
        <p className="ios26-footnote">to {transaction.name}</p>
        {transaction.note && <p className="ios26-caption2 pay-muted">{transaction.note}</p>}
        <p className="ios26-caption2 pay-muted">{transaction.upi}</p>
      </GlassCard>

      <Button variant="filled" type="button" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
