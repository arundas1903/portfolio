import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubpageNav from '../components/ios26/SubpageNav';
import Button from '../components/ios26/Button';
import GlassCard from '../components/ios26/GlassCard';
import { fetchFlowConfigurations, getFlowBuilderApiDocsUrl } from './api/flowBuilder';
import { getFlowBuilderEmail } from './api/flowBuilderAuth';
import type { FlowConfigurationSummary } from './types/flow';

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function FlowConfigurationsPage() {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState<FlowConfigurationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFlowConfigurations()
      .then(setConfigurations)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load configurations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fb-page">
      <div className="fb-background" aria-hidden />

      <div className="fb-page__inner">
        <SubpageNav to="/" label="Portfolio" />

        <header className="fb-hero ios26-liquid-glass-la glass-surface">
          <div className="fb-hero__top">
            <p className="fb-eyebrow ios26-caption2">Visual workflow editor</p>
            <a
              className="fb-docs-link ios26-caption2"
              href={getFlowBuilderApiDocsUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              API docs (Swagger)
            </a>
          </div>
          <h1 className="ios26-large-title ios26-large-title--emphasized">Flow Builder</h1>
          <p className="ios26-body fb-lead">
            Manage saved workflow configurations. Each configuration gets a UUID and can be triggered
            via API.
          </p>
          {getFlowBuilderEmail() && (
            <p className="ios26-caption2 fb-muted" style={{ marginTop: 8 }}>
              Signed in as <code className="fb-code-inline">{getFlowBuilderEmail()}</code>
            </p>
          )}
        </header>

        <GlassCard size="la" className="fb-list-panel ios26-liquid-glass-me glass-surface">
          <div className="fb-list-panel__header">
            <h2 className="ios26-headline">Configurations</h2>
            <Button variant="filled" to="/flow-builder/new">
              Create configuration
            </Button>
          </div>

          {error && <p className="fb-error ios26-footnote">{error}</p>}

          {loading ? (
            <p className="ios26-footnote fb-muted">Loading configurations…</p>
          ) : configurations.length === 0 ? (
            <p className="ios26-footnote fb-muted">No configurations yet. Create your first flow.</p>
          ) : (
            <div className="fb-table-wrap">
              <table className="fb-table ios26-footnote">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Description</th>
                    <th scope="col">UUID</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {configurations.map((config) => (
                    <tr
                      key={config.id}
                      className="fb-table__row"
                      tabIndex={0}
                      role="button"
                      onClick={() => navigate(`/flow-builder/${config.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/flow-builder/${config.id}`);
                        }
                      }}
                    >
                      <td>{config.name}</td>
                      <td className="fb-muted">{config.description || '—'}</td>
                      <td>
                        <code className="fb-code-inline">{config.id}</code>
                      </td>
                      <td className="fb-muted">{formatWhen(config.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
