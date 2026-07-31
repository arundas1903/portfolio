import React from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import type { PaymentProfile } from './types';

interface ProfileScreenProps {
  profile: PaymentProfile;
  onReset: () => void;
}

export default function ProfileScreen({ profile, onReset }: ProfileScreenProps) {
  return (
    <div className="pay-screen">
      <h1 className="ios26-title2">Profile</h1>

      <GlassCard size="la" className="pay-profile-card">
        <h2 className="ios26-title2">{profile.name}</h2>
        <p className="ios26-footnote">{profile.upi}</p>
        <p className="ios26-caption2 pay-muted">{profile.email}</p>
        <p className="ios26-caption2 pay-muted">{profile.phone}</p>
      </GlassCard>

      <GlassCard size="la" className="pay-menu-card">
        <div className="pay-menu-item">
          <span className="ios26-footnote">Bank account</span>
          <span className="ios26-caption2 pay-muted">HDFC ··· 4521</span>
        </div>
        <div className="pay-menu-item">
          <span className="ios26-footnote">UPI PIN</span>
          <span className="ios26-caption2 pay-muted">••••</span>
        </div>
      </GlassCard>

      <Button variant="tinted" type="button" onClick={onReset}>
        Reset demo data
      </Button>

      <p className="ios26-caption2 pay-muted pay-disclaimer">POC only — no real payments are processed.</p>
    </div>
  );
}
