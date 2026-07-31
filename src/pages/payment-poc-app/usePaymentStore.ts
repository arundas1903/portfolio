import { useCallback, useEffect, useState } from 'react';
import type { Contact, PaymentState, Transaction } from './types';
import { INITIAL_PAYMENT_STATE } from './types';

const STORAGE_KEY = 'payment-poc-app-state';
export const BROWSER_EMAIL_KEY = 'payment-poc-browser-email';

export function getStoredBrowserEmail(): string | null {
  return localStorage.getItem(BROWSER_EMAIL_KEY);
}

export function setStoredBrowserEmail(email: string): void {
  localStorage.setItem(BROWSER_EMAIL_KEY, email);
}

export function clearStoredBrowserEmail(): void {
  localStorage.removeItem(BROWSER_EMAIL_KEY);
}

function loadState(): PaymentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PAYMENT_STATE;
    const parsed = JSON.parse(raw) as Partial<PaymentState>;
    const profile = { ...INITIAL_PAYMENT_STATE.profile, ...parsed.profile };
    return {
      ...INITIAL_PAYMENT_STATE,
      ...parsed,
      profile,
      onboarded:
        parsed.onboarded ?? Boolean(profile.email.trim() && profile.phone.trim()),
    };
  } catch {
    return INITIAL_PAYMENT_STATE;
  }
}

function saveState(state: PaymentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePaymentStore() {
  const [state, setState] = useState<PaymentState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const completeSetup = useCallback((email: string, phone: string) => {
    setStoredBrowserEmail(email);
    setState((prev) => ({
      ...prev,
      onboarded: true,
      profile: {
        ...prev.profile,
        email,
        phone,
      },
    }));
  }, []);

  const sendPayment = useCallback(
    (params: { name: string; upi: string; amount: number; note: string }) => {
      const { amount } = params;
      if (amount <= 0 || amount > state.profile.balance) {
        return { ok: false as const, error: 'Insufficient balance or invalid amount' };
      }

      const tx: Transaction = {
        id: makeId(),
        type: 'sent',
        name: params.name,
        upi: params.upi,
        amount,
        note: params.note,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, balance: prev.profile.balance - amount },
        transactions: [tx, ...prev.transactions],
      }));

      return { ok: true as const, transaction: tx };
    },
    [state.profile.balance],
  );

  const resetDemo = useCallback(() => {
    setState(INITIAL_PAYMENT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const findContact = useCallback(
    (query: string): Contact | null => {
      const q = query.trim().toLowerCase();
      if (!q) return null;
      return (
        state.contacts.find(
          (c) => c.upi.toLowerCase() === q || c.name.toLowerCase() === q,
        ) ?? null
      );
    },
    [state.contacts],
  );

  return { state, completeSetup, sendPayment, resetDemo, findContact };
}
