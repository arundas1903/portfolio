import React from 'react';
import Button from '../../components/ios26/Button';
import type { FlowExecuteResult } from '../types/flow';

interface RunPanelProps {
  inputJson: string;
  onInputChange: (value: string) => void;
  onRun: () => void;
  running: boolean;
  result: FlowExecuteResult | null;
  error: string;
  configId?: string | null;
}

export default function RunPanel({
  inputJson,
  onInputChange,
  onRun,
  running,
  result,
  error,
  configId,
}: RunPanelProps) {
  return (
    <section className="fb-run ios26-liquid-glass-me glass-surface">
      <div className="fb-run__header">
        <div>
          <h2 className="ios26-headline">Run workflow</h2>
          {configId && (
            <p className="ios26-caption2 fb-muted">
              Uses saved configuration <code className="fb-code-inline">{configId}</code>
            </p>
          )}
        </div>
        <Button variant="filled" onClick={onRun} disabled={running}>
          {running ? 'Running…' : 'Execute'}
        </Button>
      </div>

      <label className="fb-field">
        <span className="ios26-caption2 fb-muted">Input data (JSON)</span>
        <textarea
          className="fb-textarea ios26-footnote"
          rows={4}
          value={inputJson}
          onChange={(event) => onInputChange(event.target.value)}
          spellCheck={false}
        />
      </label>

      {error && <p className="fb-error ios26-footnote">{error}</p>}

      {result && (
        <div className="fb-run__output">
          <p className="ios26-footnote">
            Status: <strong>{result.status}</strong>
            {result.error && <span className="fb-error"> — {result.error}</span>}
          </p>

          {result.status === 'waiting' && result.webhook_url && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Waiting for webhook callback</h3>
              <p className="ios26-footnote fb-muted">
                Send the async provider your callback URL, then POST the result here. If no callback
                arrives before the timeout, the timeout branch runs automatically.
              </p>
              <code className="fb-code ios26-caption2">{result.webhook_url}</code>
            </div>
          )}

          {result.trace.length > 0 && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Trace</h3>
              <ol className="fb-trace ios26-caption2">
                {result.trace.map((step, index) => (
                  <li key={`${step.node_id}-${index}`}>
                    {step.type} → <code>{step.output_handle}</code>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.logs.length > 0 && (
            <div className="fb-run__block">
              <h3 className="ios26-caption2 fb-muted">Logs</h3>
              <ul className="fb-trace ios26-caption2">
                {result.logs.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="fb-run__block">
            <h3 className="ios26-caption2 fb-muted">Output data</h3>
            <pre className="fb-code ios26-caption2">{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </section>
  );
}
