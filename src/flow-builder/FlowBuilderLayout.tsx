import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SubpageNav from '../components/ios26/SubpageNav';
import FlowBuilderAccessGate from './components/FlowBuilderAccessGate';
import {
  clearFlowBuilderSession,
  fetchFlowBuilderAccess,
  getFlowBuilderEmail,
} from './api/flowBuilderAuth';

function FlowBuilderShell({
  children,
  gate = false,
}: {
  children: React.ReactNode;
  gate?: boolean;
}) {
  return (
    <div className="fb-page">
      <div className="fb-background" aria-hidden />
      <div className={`fb-page__inner${gate ? ' fb-page__inner--gate' : ''}`}>
        <SubpageNav to="/" label="Portfolio" />
        {children}
      </div>
    </div>
  );
}

export default function FlowBuilderLayout() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!getFlowBuilderEmail()) {
        if (!cancelled) {
          setUnlocked(false);
          setChecking(false);
        }
        return;
      }

      try {
        const status = await fetchFlowBuilderAccess();
        if (!cancelled) {
          setUnlocked(status.unlocked);
        }
      } catch {
        clearFlowBuilderSession();
        if (!cancelled) {
          setUnlocked(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <FlowBuilderShell gate>
        <p className="ios26-footnote fb-muted fb-gate-status">Checking access…</p>
      </FlowBuilderShell>
    );
  }

  if (!unlocked) {
    return (
      <FlowBuilderShell gate>
        <div className="fb-gate-wrap">
          <FlowBuilderAccessGate onUnlocked={() => setUnlocked(true)} />
        </div>
      </FlowBuilderShell>
    );
  }

  return <Outlet />;
}
