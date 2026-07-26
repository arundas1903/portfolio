import React from 'react';
import type { CountryRecord } from '../types';
import { CHANNEL_LABELS, ChannelKey } from '../types';
import { supportLabel } from '../utils/support';

interface CountryDetailProps {
  country: CountryRecord | null;
}

const CHANNEL_KEYS: ChannelKey[] = ['alphanumeric', 'shortCode', 'longCode', 'tollFree'];

export default function CountryDetail({ country }: CountryDetailProps) {
  if (!country) {
    return (
      <div className="a2p-detail a2p-detail--empty">
        <p className="ios26-body" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
          Select a country on the map to view A2P SMS channel support.
        </p>
      </div>
    );
  }

  return (
    <div className="a2p-detail">
      <h3 className="ios26-title2" style={{ margin: '0 0 4px' }}>{country.name}</h3>
      <p className="ios26-footnote" style={{ margin: '0 0 16px', color: 'var(--color-label-secondary)' }}>
        {country.iso2} · +{country.dialCode}
      </p>

      <div className="a2p-detail__channels">
        {CHANNEL_KEYS.map((key) => (
          <div key={key} className="a2p-channel-row">
            <span className="ios26-subheadline">{CHANNEL_LABELS[key]}</span>
            <span className={`a2p-badge a2p-badge--${country.channels[key]}`}>
              {supportLabel(country.channels[key])}
            </span>
          </div>
        ))}
      </div>

      <div className="a2p-detail__meta">
        <p className="ios26-caption1">
          Two-way SMS: <strong>{supportLabel(country.twoWaySms)}</strong>
        </p>
        <p className="ios26-caption1">
          International sending: <strong>{supportLabel(country.internationalSending)}</strong>
        </p>
        {country.twilioAlpha && (
          <p className="ios26-caption1">
            Twilio alpha reference: <strong>{supportLabel(country.twilioAlpha)}</strong>
          </p>
        )}
      </div>

      <p className="ios26-caption2" style={{ margin: '16px 0 0', color: 'var(--color-label-tertiary)' }}>
        Sources: {country.sources.join(' · ')}
      </p>
    </div>
  );
}
