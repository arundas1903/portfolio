import React from 'react';
import Button from '../../components/ios26/Button';
import type { FlowRunHistoryEntry } from '../types/flow';

interface RunHistoryDetailModalProps {
  entry: FlowRunHistoryEntry;
  onClose: () => void;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function RunHistoryDetailModal({ entry, onClose }: RunHistoryDetailModalProps) {
  return (
    <div className="fb-history-overlay" role="presentation" onClick={onClose}>
      <div
        className="fb-history-panel ios26-liquid-glass-la glass-surface"
        role="dialog"
        aria-labelledby="fb-history-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fb-history-panel__header">
          <div>
            <p className="fb-eyebrow ios26-caption2">Run details</p>
            <h2 id="fb-history-detail-title" className="ios26-title2">
              {entry.status}
            </h2>
            <p className="ios26-caption2 fb-muted">
              Called {formatWhen(entry.created_at)}
              {entry.completed_at ? ` · Completed ${formatWhen(entry.completed_at)}` : ''}
            </p>
          </div>
          <Button variant="tinted" type="button" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="fb-history-item__details fb-history-item__details--modal">
          <div className="fb-run__block">
            <h3 className="ios26-caption2 fb-muted">Input</h3>
            <pre className="fb-code ios26-caption2">{JSON.stringify(entry.input_data, null, 2)}</pre>
          </div>

          {entry.webhook_payload && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Webhook callback</h3>
              <pre className="fb-code ios26-caption2">
                {JSON.stringify(entry.webhook_payload, null, 2)}
              </pre>
            </div>
          )}

          {entry.result.trace.length > 0 && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Execution trace</h3>
              <ol className="fb-trace ios26-caption2">
                {entry.result.trace.map((step, index) => (
                  <li key={`${step.node_id}-${index}`}>
                    {step.type} → <code>{step.output_handle}</code>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {entry.result.logs.length > 0 && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Logs</h3>
              <ul className="fb-trace ios26-caption2">
                {entry.result.logs.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="fb-run__block">
            <h3 className="ios26-caption2 fb-muted">Output data</h3>
            <pre className="fb-code ios26-caption2">{JSON.stringify(entry.result.data, null, 2)}</pre>
          </div>

          {entry.result.error && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Error</h3>
              <p className="fb-error ios26-footnote">{entry.result.error}</p>
            </div>
          )}

          <div className="fb-run__block">
            <h3 className="ios26-caption2 fb-muted">Flow snapshot</h3>
            <pre className="fb-code ios26-caption2">{JSON.stringify(entry.flow, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
