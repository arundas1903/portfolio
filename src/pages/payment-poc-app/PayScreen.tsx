import React, { useEffect, useState } from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import { checkPaymentNetwork } from '../../api/payment';
import type { NetworkCheckResult } from '../../types/payment-network';
import { isHighRiskNetworkCheck } from '../../types/payment-network';
import { DEMO_RECIPIENT, getBfsiOwnerEmail } from './types';
import NetworkCheckPanel from './NetworkCheckPanel';

interface PayScreenProps {
  balance: number;
  phone: string;
  paying?: boolean;
  error?: string;
  onBack: () => void;
  onPay: (params: { name: string; upi: string; amount: number; note: string }) => void | Promise<void>;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PayScreen({
  balance,
  phone,
  paying = false,
  error: externalError,
  onBack,
  onPay,
}: PayScreenProps) {
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState('');
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [networkResult, setNetworkResult] = useState<NetworkCheckResult | null>(null);

  const parsedAmount = Number(amount);
  const networkBlocked = isHighRiskNetworkCheck(networkResult);
  const canPay = parsedAmount > 0 && parsedAmount <= balance && !paying && !networkLoading && !networkBlocked;
  const error = externalError || localError;

  useEffect(() => {
    let cancelled = false;

    const runNetworkCheck = async () => {
      if (!phone.trim()) {
        setNetworkError('Add a phone number in setup to run network checks.');
        setNetworkResult(null);
        return;
      }

      setNetworkLoading(true);
      setNetworkError('');

      try {
        const result = await checkPaymentNetwork({
          phone_number: phone,
          sim_swap: true,
          location: true,
          ownerEmail: getBfsiOwnerEmail(),
        });
        if (!cancelled) setNetworkResult(result);
      } catch (err) {
        if (!cancelled) {
          setNetworkError(err instanceof Error ? err.message : 'Network check failed');
          setNetworkResult(null);
        }
      } finally {
        if (!cancelled) setNetworkLoading(false);
      }
    };

    runNetworkCheck();

    return () => {
      cancelled = true;
    };
  }, [phone]);

  const handlePay = async () => {
    if (networkBlocked) {
      setLocalError('Payment blocked — recent SIM swap detected on this number.');
      return;
    }
    if (!canPay) {
      setLocalError(parsedAmount > balance ? 'Insufficient balance' : 'Enter an amount');
      return;
    }
    setLocalError('');
    await onPay({
      name: DEMO_RECIPIENT.name,
      upi: DEMO_RECIPIENT.upi,
      amount: parsedAmount,
      note: '',
    });
  };

  const appendDigit = (digit: string) => {
    if (digit === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    setAmount((prev) => prev + digit);
  };

  const backspace = () => setAmount((prev) => prev.slice(0, -1));

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;

    const whole = parts[0] ?? '';
    const fraction = parts[1]?.slice(0, 2) ?? '';
    setAmount(fraction ? `${whole}.${fraction}` : whole);
    setLocalError('');
  };

  return (
    <div className="pay-screen pay-screen--flow">
      <header className="pay-flow-header">
        <button type="button" className="pay-back ios26-footnote" onClick={onBack} aria-label="Go back">
          ← Back
        </button>
        <h1 className="ios26-headline">Pay</h1>
        <span className="ios26-caption2 pay-muted">₹{balance.toLocaleString('en-IN')}</span>
      </header>

      <GlassCard size="la" className="pay-recipient-card">
        <span className="pay-recipient-avatar">{initials(DEMO_RECIPIENT.name)}</span>
        <div>
          <p className="ios26-headline">{DEMO_RECIPIENT.name}</p>
          <p className="ios26-caption2 pay-muted">{DEMO_RECIPIENT.upi}</p>
        </div>
      </GlassCard>

      <NetworkCheckPanel loading={networkLoading} error={networkError} result={networkResult} />

      <label className="pay-amount-display">
        <span className="ios26-title2 pay-muted">₹</span>
        <input
          type="text"
          inputMode="decimal"
          className={`pay-amount-input ios26-large-title${amount ? '' : ' pay-amount-value--empty'}`}
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          aria-label="Amount"
        />
      </label>

      {error && <p className="pay-error ios26-caption2">{error}</p>}

      <div className="pay-keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
          <button
            key={key}
            type="button"
            className={`pay-key ios26-liquid-glass-sm glass-surface ios26-headline${key === '⌫' ? ' pay-key--action' : ''}`}
            onClick={() => (key === '⌫' ? backspace() : appendDigit(key))}
          >
            {key}
          </button>
        ))}
      </div>

      <Button variant="filled" type="button" disabled={!canPay} onClick={handlePay}>
        {paying ? 'Processing…' : networkBlocked ? 'Blocked — SIM swap risk' : `Pay ₹${amount || '0'}`}
      </Button>
    </div>
  );
}
