import React from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import { getPaymentApiDocsUrl } from '../../api/payment';
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

      <GlassCard size="la" className="pay-docs-card">
        <p className="pay-docs-card__eyebrow ios26-caption2">Network API</p>
        <h2 className="ios26-headline">Carrier intelligence</h2>
        <p className="ios26-footnote pay-muted">
          Network APIs require the <code className="pay-docs-code">X-BFSI-Owner-Email</code> header
          (same as BFSI v1/v2). SIM swap checks cost 5 paise and appear in BFSI logs under the
          network channel.
        </p>
        <ul className="pay-docs-list ios26-caption2 pay-muted">
          <li>
            <strong>sim_swap</strong> — status, days since swap, risk level
          </li>
          <li>
            <strong>location</strong> — country, region, city, carrier
          </li>
        </ul>
        <a
          className="pay-docs-link ios26-footnote"
          href={getPaymentApiDocsUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open API docs (Swagger) →
        </a>
      </GlassCard>

      <Button variant="tinted" type="button" onClick={onReset}>
        Reset demo data
      </Button>

      <p className="ios26-caption2 pay-muted pay-disclaimer">POC only — no real payments are processed.</p>
    </div>
  );
}
