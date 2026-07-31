import React, { useEffect, useState } from 'react';
import SubpageNav from '../../components/ios26/SubpageNav';
import Button from '../../components/ios26/Button';
import {
  clearBfsiSession,
  fetchBfsiProfile,
  getBfsiApiDocsUrl,
  getBfsiToken,
} from '../../api/bfsi';
import type { BfsiTab, BfsiUserProfile } from '../../types/bfsi';
import BfsiDashboardTab from './BfsiDashboardTab';
import BfsiEmailGate from './BfsiEmailGate';
import BfsiTemplatesTab from './BfsiTemplatesTab';

const TABS: { id: BfsiTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'templates', label: 'Templates' },
];

export default function BfsiSmsPage() {
  const [user, setUser] = useState<BfsiUserProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<BfsiTab>('dashboard');

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!getBfsiToken()) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const profile = await fetchBfsiProfile();
        if (!cancelled) setUser(profile);
      } catch {
        clearBfsiSession();
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    loadSession();
  }, []);

  const handleSignOut = () => {
    clearBfsiSession();
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div className="bfsi-page">
        <div className="bfsi-page__inner">
          <SubpageNav to="/" label="Portfolio" />
          <p className="ios26-footnote bfsi-muted bfsi-loading">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bfsi-page">
        <div className="bfsi-page__inner bfsi-page__inner--gate">
          <SubpageNav to="/" label="Portfolio" />
          <BfsiEmailGate onStarted={setUser} />
        </div>
      </div>
    );
  }

  return (
    <div className="bfsi-page">
      <div className="bfsi-background" aria-hidden />

      <div className="bfsi-page__inner">
        <SubpageNav to="/" label="Portfolio" />

        <header className="bfsi-header ios26-liquid-glass-la glass-surface">
          <div>
            <p className="bfsi-eyebrow ios26-caption2">POC · BFSI SMS</p>
            <h1 className="ios26-large-title ios26-large-title--emphasized">
              Intelligent Notification Router
            </h1>
            <p className="ios26-footnote bfsi-muted">
              Route customer notifications by transaction amount — SMS, email, or push — using
              template rules you define.
            </p>
          </div>
          <div className="bfsi-header__actions">
            <a
              className="bfsi-docs-link ios26-caption2"
              href={getBfsiApiDocsUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              API docs (Swagger)
            </a>
            <span className="ios26-caption2 bfsi-muted">{user.email}</span>
            <Button variant="tinted" type="button" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>

        <nav className="bfsi-tabs ios26-liquid-glass-me glass-surface" aria-label="BFSI sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`bfsi-tab ios26-footnote${activeTab === tab.id ? ' bfsi-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="bfsi-main">
          {activeTab === 'dashboard' && <BfsiDashboardTab />}
          {activeTab === 'templates' && <BfsiTemplatesTab />}
        </main>
      </div>
    </div>
  );
}
