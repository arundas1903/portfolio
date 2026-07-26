import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import countriesData from './data/countries.json';
import WorldMap from './components/WorldMap';
import CountryDetail from './components/CountryDetail';
import SegmentedControl from '../components/ios26/SegmentedControl';
import SubpageNav from '../components/ios26/SubpageNav';
import type { ChannelKey, CountryRecord } from './types';
import { CHANNEL_LABELS, CHANNEL_SHORT_LABELS } from './types';
import { supportColor, supportLabel } from './utils/support';
import '../styles/a2p-atlas.css';

const CHANNELS: ChannelKey[] = ['alphanumeric', 'shortCode', 'longCode', 'tollFree'];
const CHANNEL_SEGMENTS = CHANNELS.map((key) => ({
  value: key,
  label: CHANNEL_SHORT_LABELS[key],
  ariaLabel: CHANNEL_LABELS[key],
}));
const LEGEND_LEVELS = ['yes', 'registration', 'partial', 'no'] as const;

export default function A2PAtlasPage() {
  const [channel, setChannel] = useState<ChannelKey>('alphanumeric');
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const countries = countriesData as CountryRecord[];

  const countriesByIso = useMemo(
    () => new Map(countries.map((c) => [c.iso2, c])),
    [countries]
  );

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries.slice(0, 8);
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    ).slice(0, 12);
  }, [countries, query]);

  const selectedCountry = selectedIso ? countriesByIso.get(selectedIso) ?? null : null;

  return (
    <div className="a2p-atlas-page">
      <div className="a2p-atlas-background" aria-hidden />

      <SubpageNav to="/" label="Portfolio" />

      <header className="a2p-atlas-header">
        <div>
          <h1 className="ios26-large-title ios26-large-title--emphasized">A2P Atlas</h1>
          <p className="ios26-subheadline" style={{ color: 'var(--color-label-secondary)' }}>
            Global A2P SMS origination support by country
          </p>
          <p className="ios26-footnote" style={{ marginTop: 8 }}>
            <Link to="/a2p-regulatory-mcp" className="a2p-atlas-mcp-link ios26-footnote">
              MCP server for AI-assisted regulatory intelligence →
            </Link>
          </p>
        </div>
      </header>

      <SegmentedControl
        className="a2p-channel-segments"
        segments={CHANNEL_SEGMENTS}
        value={channel}
        onChange={setChannel}
        aria-label="A2P SMS channel"
      />

      <div className="a2p-atlas-layout">
        <section className="a2p-map-section ios26-liquid-glass-la glass-surface">
          <WorldMap
            countriesByIso={countriesByIso}
            channel={channel}
            selectedIso={selectedIso}
            onSelect={setSelectedIso}
          />
          <div className="a2p-legend">
            {LEGEND_LEVELS.map((level) => (
              <span key={level} className="a2p-legend__item ios26-caption2">
                <span className="a2p-legend__swatch" style={{ background: supportColor(level) }} />
                {supportLabel(level)}
              </span>
            ))}
          </div>
        </section>

        <aside className="a2p-sidebar">
          <div className="a2p-search ios26-liquid-glass-me glass-surface">
            <input
              className="a2p-search__input ios26-body"
              placeholder="Search country or dial code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <ul className="a2p-search__results">
                {filteredList.map((c) => (
                  <li key={c.iso2}>
                    <button type="button" onClick={() => { setSelectedIso(c.iso2); setQuery(''); }}>
                      {c.name} (+{c.dialCode})
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="a2p-detail-card ios26-liquid-glass-me glass-surface">
            <CountryDetail country={selectedCountry} selectedIso={selectedIso} />
          </div>
        </aside>
      </div>
    </div>
  );
}
