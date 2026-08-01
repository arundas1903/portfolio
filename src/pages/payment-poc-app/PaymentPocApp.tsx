import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import TabBar from '../../components/ios26/TabBar';
import ThemeToggle from '../../components/ios26/ThemeToggle';
import { sendBfsiV2Notification } from '../../api/bfsi';
import type { NotificationChannel } from '../../types/bfsi';
import type { PaymentFlow, PaymentTab, Transaction } from './types';
import { buildTransactionMessage, getBfsiOwnerEmail } from './types';
import { usePaymentStore } from './usePaymentStore';
import HomeScreen from './HomeScreen';
import PayScreen from './PayScreen';
import HistoryScreen from './HistoryScreen';
import ProfileScreen from './ProfileScreen';
import SuccessScreen from './SuccessScreen';
import SetupGate from './SetupGate';
import NotificationBanner from './NotificationBanner';

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Activity',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
];

interface AppNotification {
  message: string;
  channel: NotificationChannel;
}

export default function PaymentPocApp() {
  const { state, completeSetup, sendPayment, resetDemo } = usePaymentStore();
  const [tab, setTab] = useState<PaymentTab>('home');
  const [flow, setFlow] = useState<PaymentFlow>('idle');
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [scanToast, setScanToast] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [notification, setNotification] = useState<AppNotification | null>(null);

  const dismissNotification = useCallback(() => setNotification(null), []);

  const handleReset = () => {
    resetDemo();
    setFlow('idle');
    setTab('home');
    setLastTx(null);
    setPayError('');
    dismissNotification();
  };

  const handlePay = async (params: { name: string; upi: string; amount: number; note: string }) => {
    setPaying(true);
    setPayError('');

    try {
      const messageBody = buildTransactionMessage(params.amount);
      const apiResult = await sendBfsiV2Notification(getBfsiOwnerEmail(), {
        message_body: messageBody,
        audience: {
          phone: state.profile.phone,
          email: state.profile.email,
        },
      });

      const result = sendPayment(params);
      if (!result.ok) {
        setPayError(result.error ?? 'Could not complete payment');
        return;
      }

      setNotification({ message: apiResult.message, channel: apiResult.channel });
      setLastTx(result.transaction);
      setFlow('success');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not send notification');
    } finally {
      setPaying(false);
    }
  };

  const handleScan = () => {
    setScanToast(true);
    window.setTimeout(() => setScanToast(false), 2500);
  };

  const showNav = state.onboarded && flow === 'idle';

  return (
    <div className="pay-app">
      <div className="pay-app__backdrop" aria-hidden />

      <div className="pay-app__device ios26-liquid-glass-la glass-surface">
        <header className="pay-app__chrome">
          <Link to="/" className="pay-app__exit ios26-caption2" aria-label="Exit demo">
            <svg viewBox="0 0 24 24" aria-hidden className="pay-app__exit-icon">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
            </svg>
            Exit
          </Link>
          <span className="pay-app__title ios26-subheadline">UPI Pay</span>
          <ThemeToggle />
        </header>

        {notification && state.onboarded && (
          <NotificationBanner
            message={notification.message}
            channel={notification.channel}
            recipientEmail={state.profile.email}
            onDismiss={dismissNotification}
          />
        )}

        <main className="pay-app__main">
          {!state.onboarded && <SetupGate onComplete={completeSetup} />}

          {state.onboarded && scanToast && (
            <div className="pay-toast ios26-caption2" role="status">
              Scan & Pay is a demo — use Pay to send money
            </div>
          )}

          {state.onboarded && flow === 'pay' && (
            <PayScreen
              balance={state.profile.balance}
              phone={state.profile.phone}
              paying={paying}
              error={payError}
              onBack={() => {
                setFlow('idle');
                setPayError('');
              }}
              onPay={handlePay}
            />
          )}

          {state.onboarded && flow === 'success' && lastTx && (
            <SuccessScreen
              transaction={lastTx}
              onDone={() => {
                setFlow('idle');
                setTab('history');
                dismissNotification();
              }}
            />
          )}

          {state.onboarded && flow === 'idle' && tab === 'home' && (
            <HomeScreen
              balance={state.profile.balance}
              userName={state.profile.name}
              onPayAnyone={() => {
                setPayError('');
                setFlow('pay');
              }}
              onScan={handleScan}
            />
          )}

          {state.onboarded && flow === 'idle' && tab === 'history' && (
            <HistoryScreen transactions={state.transactions} />
          )}

          {state.onboarded && flow === 'idle' && tab === 'profile' && (
            <ProfileScreen profile={state.profile} onReset={handleReset} />
          )}
        </main>

        <TabBar
          tabs={TABS}
          activeTab={tab}
          onTabChange={(id) => setTab(id as PaymentTab)}
          hidden={!showNav}
          embedded
        />
      </div>
    </div>
  );
}
