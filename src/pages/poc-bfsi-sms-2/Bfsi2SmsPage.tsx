import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KaleButton,
  KaleCard,
  KalePageHeader,
  KaleTabs,
} from '../../design/kaleyra';
import {
  clearBfsiSession,
  fetchBfsiProfile,
  getBfsiApiDocsUrl,
  getBfsiToken,
} from '../../api/bfsi';
import type { BfsiTab, BfsiUserProfile } from '../../types/bfsi';
import Bfsi2DashboardTab from './Bfsi2DashboardTab';
import Bfsi2EmailGate from './Bfsi2EmailGate';
import Bfsi2TemplatesTab from './Bfsi2TemplatesTab';

const TABS: { id: BfsiTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'templates', label: 'Templates' },
];

export default function Bfsi2SmsPage() {
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
      <div className="kale-root bfsi2-page">
        <div className="bfsi2-page__inner">
          <Link className="bfsi2-back" to="/">
            ← Portfolio
          </Link>
          <p className="kale-text-300">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="kale-root bfsi2-page">
        <div className="bfsi2-page__inner bfsi2-page__inner--gate">
          <Link className="bfsi2-back" to="/">
            ← Portfolio
          </Link>
          <KaleCard>
            <Bfsi2EmailGate onStarted={setUser} />
          </KaleCard>
        </div>
      </div>
    );
  }

  return (
    <div className="kale-root bfsi2-page">
      <div className="bfsi2-page__inner">
        <Link className="bfsi2-back" to="/">
          ← Portfolio
        </Link>

        <KalePageHeader
          eyebrow="POC · BFSI SMS v2"
          title="Intelligent Notification Router"
          description="Route customer notifications by transaction amount — SMS, email, or push — using template rules you define. Kaleyra design system."
          actions={
            <>
              <a
                className="bfsi2-docs-link"
                href={getBfsiApiDocsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                API docs (Swagger)
              </a>
              <span className="bfsi2-user">{user.email}</span>
              <KaleButton variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </KaleButton>
            </>
          }
        />

        <KaleTabs
          tabs={TABS}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as BfsiTab)}
          ariaLabel="BFSI sections"
        />

        <main className="bfsi2-main">
          {activeTab === 'dashboard' && <Bfsi2DashboardTab />}
          {activeTab === 'templates' && <Bfsi2TemplatesTab />}
        </main>
      </div>
    </div>
  );
}
