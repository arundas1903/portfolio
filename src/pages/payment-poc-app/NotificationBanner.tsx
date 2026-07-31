import React, { useEffect } from 'react';
import type { NotificationChannel } from '../../types/bfsi';

interface NotificationBannerProps {
  message: string;
  channel: NotificationChannel;
  recipientEmail?: string | null;
  onDismiss: () => void;
}

const SMS_META = { app: 'Messages', sender: 'VM-HDFCBK' };
const EMAIL_META = { app: 'Mail', sender: 'HDFC Bank', subject: 'Transaction alert' };
const PUSH_META = { app: 'Notifications', sender: 'UPI Pay' };

export default function NotificationBanner({
  message,
  channel,
  recipientEmail,
  onDismiss,
}: NotificationBannerProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  if (channel === 'email') {
    return (
      <div className="pay-notif-banner pay-notif-banner--email" role="status" aria-live="polite">
        <button
          type="button"
          className="pay-notif-banner__card pay-notif-banner__card--email ios26-liquid-glass-me glass-surface"
          onClick={onDismiss}
        >
          <div className="pay-notif-banner__header">
            <span className="pay-notif-banner__app ios26-caption2">{EMAIL_META.app}</span>
            <span className="pay-notif-banner__time ios26-caption2">now</span>
          </div>
          <p className="pay-notif-banner__subject ios26-subheadline">{EMAIL_META.subject}</p>
          <p className="pay-notif-banner__sender ios26-caption2 pay-muted">
            {EMAIL_META.sender}
            {recipientEmail ? ` · ${recipientEmail}` : ''}
          </p>
          <p className="pay-notif-banner__message ios26-footnote">{message}</p>
        </button>
      </div>
    );
  }

  if (channel === 'push') {
    return (
      <div className="pay-notif-banner pay-notif-banner--push" role="status" aria-live="polite">
        <button
          type="button"
          className="pay-notif-banner__card pay-notif-banner__card--push ios26-liquid-glass-me glass-surface"
          onClick={onDismiss}
        >
          <div className="pay-notif-banner__header">
            <span className="pay-notif-banner__app ios26-caption2">{PUSH_META.app}</span>
            <span className="pay-notif-banner__time ios26-caption2">now</span>
          </div>
          <p className="pay-notif-banner__sender ios26-subheadline">{PUSH_META.sender}</p>
          <p className="pay-notif-banner__message ios26-footnote">{message}</p>
        </button>
      </div>
    );
  }

  return (
    <div className="pay-notif-banner pay-notif-banner--sms" role="status" aria-live="polite">
      <button
        type="button"
        className="pay-notif-banner__card pay-notif-banner__card--sms ios26-liquid-glass-me glass-surface"
        onClick={onDismiss}
      >
        <div className="pay-notif-banner__header">
          <span className="pay-notif-banner__app ios26-caption2">{SMS_META.app}</span>
          <span className="pay-notif-banner__time ios26-caption2">now</span>
        </div>
        <p className="pay-notif-banner__sender ios26-subheadline">{SMS_META.sender}</p>
        <p className="pay-notif-banner__message ios26-footnote">{message}</p>
      </button>
    </div>
  );
}
