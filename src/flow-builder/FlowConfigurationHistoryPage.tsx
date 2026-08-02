import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SubpageNav from '../components/ios26/SubpageNav';
import Button from '../components/ios26/Button';
import GlassCard from '../components/ios26/GlassCard';
import { fetchConfigurationHistory, fetchFlowConfiguration } from './api/flowBuilder';
import RunHistoryDetailModal from './components/RunHistoryDetailModal';
import type { FlowRunHistoryEntry } from './types/flow';

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function summarizeInput(input: Record<string, unknown>): string {
  const text = JSON.stringify(input);
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

export default function FlowConfigurationHistoryPage() {
  const { configId = '' } = useParams<{ configId: string }>();
  const [configName, setConfigName] = useState('');
  const [entries, setEntries] = useState<FlowRunHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<FlowRunHistoryEntry | null>(null);

  useEffect(() => {
    if (!configId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([fetchFlowConfiguration(configId), fetchConfigurationHistory(configId)])
      .then(([config, history]) => {
        if (cancelled) return;
        setConfigName(config.name);
        setEntries(history);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load run history');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [configId]);

  return (
    <div className="fb-page">
      <div className="fb-background" aria-hidden />

      <div className="fb-page__inner">
        <SubpageNav to="/flow-builder" label="Configurations" />

        <header className="fb-hero ios26-liquid-glass-la glass-surface">
          <p className="fb-eyebrow ios26-caption2">Public API runs</p>
          <h1 className="ios26-large-title ios26-large-title--emphasized">
            {configName || 'Run history'}
          </h1>
          <p className="ios26-body fb-lead">
            Calls made to the public run endpoint for this configuration.
          </p>
        </header>

        <GlassCard size="la" className="fb-list-panel ios26-liquid-glass-me glass-surface">
          {error && <p className="fb-error ios26-footnote">{error}</p>}

          {loading ? (
            <p className="ios26-footnote fb-muted">Loading run history…</p>
          ) : entries.length === 0 ? (
            <p className="ios26-footnote fb-muted">No public API calls yet for this configuration.</p>
          ) : (
            <div className="fb-table-wrap">
              <table className="fb-table ios26-footnote">
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Source</th>
                    <th scope="col">Called</th>
                    <th scope="col">Completed</th>
                    <th scope="col">Input</th>
                    <th scope="col" className="fb-table__actions-col">
                      <span className="fb-sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="fb-table__row fb-table__row--static">
                      <td>
                        <strong>{entry.status}</strong>
                      </td>
                      <td className="fb-muted">{entry.source}</td>
                      <td className="fb-muted">{formatWhen(entry.created_at)}</td>
                      <td className="fb-muted">{formatWhen(entry.completed_at)}</td>
                      <td>
                        <code className="fb-code-inline">{summarizeInput(entry.input_data)}</code>
                      </td>
                      <td className="fb-table__actions">
                        <Button
                          variant="tinted"
                          type="button"
                          className="fb-table__action"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {selectedEntry && (
        <RunHistoryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
