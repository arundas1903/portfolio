import React from 'react';
import type { ConfigField } from '../types/flow';

interface NodeConfigPanelProps {
  nodeId: string | null;
  label: string;
  moduleType: string;
  config: Record<string, unknown>;
  fields: ConfigField[];
  onChange: (nodeId: string, config: Record<string, unknown>) => void;
}

export default function NodeConfigPanel({
  nodeId,
  label,
  moduleType,
  config,
  fields,
  onChange,
}: NodeConfigPanelProps) {
  if (!nodeId) {
    return (
      <aside className="fb-inspector ios26-liquid-glass-me glass-surface">
        <h2 className="ios26-headline">Inspector</h2>
        <p className="ios26-footnote fb-muted">Select a node to edit its configuration.</p>
      </aside>
    );
  }

  const update = (key: string, value: unknown) => {
    onChange(nodeId, { ...config, [key]: value });
  };

  return (
    <aside className="fb-inspector ios26-liquid-glass-me glass-surface">
      <h2 className="ios26-headline">{label}</h2>
      <p className="ios26-caption2 fb-muted">{moduleType}</p>

      {fields.length === 0 ? (
        <p className="ios26-footnote fb-muted">No configuration for this module.</p>
      ) : (
        <div className="fb-inspector__fields">
          {fields.map((field) => (
            <label key={field.key} className="fb-field">
              <span className="ios26-caption2 fb-muted">{field.label}</span>
              {field.field_type === 'select' ? (
                <select
                  className="fb-input ios26-footnote"
                  value={String(config[field.key] ?? field.default ?? '')}
                  onChange={(event) => update(field.key, event.target.value)}
                >
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.field_type === 'number' ? (
                <input
                  className="fb-input ios26-footnote"
                  type="number"
                  value={Number(config[field.key] ?? field.default ?? 0)}
                  onChange={(event) => update(field.key, Number(event.target.value))}
                />
              ) : field.field_type === 'boolean' ? (
                <label className="fb-checkbox ios26-footnote">
                  <input
                    type="checkbox"
                    checked={Boolean(config[field.key] ?? field.default ?? false)}
                    onChange={(event) => update(field.key, event.target.checked)}
                  />
                  <span>{field.description || 'Enabled'}</span>
                </label>
              ) : field.field_type === 'textarea' ? (
                <>
                <textarea
                  className="fb-textarea ios26-footnote"
                  rows={4}
                  value={String(config[field.key] ?? field.default ?? '')}
                  onChange={(event) => update(field.key, event.target.value)}
                  spellCheck={false}
                />
                {field.description && (
                  <span className="ios26-caption2 fb-muted">{field.description}</span>
                )}
                </>
              ) : (
                <>
                <input
                  className="fb-input ios26-footnote"
                  type="text"
                  value={String(config[field.key] ?? field.default ?? '')}
                  onChange={(event) => update(field.key, event.target.value)}
                />
                {field.description && (
                  <span className="ios26-caption2 fb-muted">{field.description}</span>
                )}
                </>
              )}
              {field.field_type !== 'textarea' && field.field_type !== 'boolean' && field.description && (
                <span className="ios26-caption2 fb-muted">{field.description}</span>
              )}
            </label>
          ))}
        </div>
      )}
    </aside>
  );
}
