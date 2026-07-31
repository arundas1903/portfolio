import React, { useCallback, useEffect, useState } from 'react';
import Button from '../../components/ios26/Button';
import {
  createBfsiTemplate,
  deleteBfsiDefaultConfig,
  fetchBfsiDefaultConfig,
  fetchBfsiTemplates,
  getBfsiApiDocsUrl,
  pauseBfsiDefaultConfig,
  saveBfsiDefaultConfig,
  updateBfsiTemplate,
} from '../../api/bfsi';
import {
  AMOUNT_VARIABLE,
  CHANNEL_OPTIONS,
  DEFAULT_TEMPLATE_CONTENT,
  type BfsiDefaultConfig,
  type BfsiTemplate,
  type NotificationChannel,
} from '../../types/bfsi';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className="bfsi-copy-btn ios26-caption2"
      onClick={handleCopy}
      aria-label="Copy template ID"
    >
      {copied ? 'Copied' : 'Copy ID'}
    </button>
  );
}

export default function BfsiTemplatesTab() {
  const [templates, setTemplates] = useState<BfsiTemplate[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<BfsiDefaultConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configActionLoading, setConfigActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState(DEFAULT_TEMPLATE_CONTENT);
  const [amountThreshold, setAmountThreshold] = useState('50');
  const [channelAbove, setChannelAbove] = useState<NotificationChannel>('sms');
  const [channelBelow, setChannelBelow] = useState<NotificationChannel>('push');
  const [configThreshold, setConfigThreshold] = useState('50');
  const [configChannelAbove, setConfigChannelAbove] = useState<NotificationChannel>('sms');
  const [configChannelBelow, setConfigChannelBelow] = useState<NotificationChannel>('push');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [items, config] = await Promise.all([fetchBfsiTemplates(), fetchBfsiDefaultConfig()]);
      setTemplates(items);
      setDefaultConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName('');
    setContent(DEFAULT_TEMPLATE_CONTENT);
    setAmountThreshold('50');
    setChannelAbove('sms');
    setChannelBelow('push');
    setEditingId(null);
    setError('');
  };

  const resetConfigForm = (config: BfsiDefaultConfig | null) => {
    setConfigThreshold(String(config?.amount_threshold ?? '50'));
    setConfigChannelAbove(config?.channel_if_above ?? 'sms');
    setConfigChannelBelow(config?.channel_if_below ?? 'push');
    setConfigError('');
  };

  const openCreateForm = () => {
    resetForm();
    setShowConfigForm(false);
    setShowForm(true);
  };

  const openConfigForm = () => {
    resetConfigForm(defaultConfig);
    setShowForm(false);
    setShowConfigForm(true);
  };

  const openEditForm = (template: BfsiTemplate) => {
    setEditingId(template.id);
    setName(template.name);
    setContent(template.content);
    setAmountThreshold(String(template.amount_threshold));
    setChannelAbove(template.channel_if_above);
    setChannelBelow(template.channel_if_below);
    setError('');
    setShowConfigForm(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const closeConfigForm = () => {
    setShowConfigForm(false);
    resetConfigForm(defaultConfig);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const threshold = Number(amountThreshold);
    if (Number.isNaN(threshold) || threshold < 0) {
      setError('Enter a valid amount threshold.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name,
        content,
        amount_threshold: threshold,
        channel_if_above: channelAbove,
        channel_if_below: channelBelow,
      };

      if (editingId) {
        const updated = await updateBfsiTemplate(editingId, payload);
        setTemplates((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createBfsiTemplate(payload);
        setTemplates((prev) => [created, ...prev]);
      }

      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${editingId ? 'update' : 'create'} template`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (configSaving) return;

    const threshold = Number(configThreshold);
    if (Number.isNaN(threshold) || threshold < 0) {
      setConfigError('Enter a valid amount threshold.');
      return;
    }

    setConfigSaving(true);
    setConfigError('');

    try {
      const saved = await saveBfsiDefaultConfig({
        amount_threshold: threshold,
        channel_if_above: configChannelAbove,
        channel_if_below: configChannelBelow,
      });
      setDefaultConfig(saved);
      closeConfigForm();
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Could not save default configuration');
    } finally {
      setConfigSaving(false);
    }
  };

  const handlePauseConfig = async () => {
    if (!defaultConfig || configActionLoading) return;

    setConfigActionLoading(true);
    setConfigError('');
    try {
      const updated = await pauseBfsiDefaultConfig(!defaultConfig.paused);
      setDefaultConfig(updated);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Could not update default configuration');
    } finally {
      setConfigActionLoading(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!defaultConfig || configActionLoading) return;
    if (!window.confirm('Delete this default configuration? v2 sends will fall back to SMS.')) {
      return;
    }

    setConfigActionLoading(true);
    setConfigError('');
    try {
      await deleteBfsiDefaultConfig();
      setDefaultConfig(null);
      closeConfigForm();
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Could not delete default configuration');
    } finally {
      setConfigActionLoading(false);
    }
  };

  return (
    <div className="bfsi-templates">
      <section className="bfsi-panel ios26-liquid-glass-la glass-surface">
        <div className="bfsi-panel__header">
          <div>
            <p className="bfsi-eyebrow ios26-caption2">Default configuration</p>
            <h2 className="ios26-title2">V2 routing rules</h2>
            <p className="ios26-footnote bfsi-muted">
              Used by the v2 send API when AI detects a transaction message with an amount. No
              template name or message body — routing only.
            </p>
          </div>
          <Button
            variant="filled"
            type="button"
            onClick={() => (showConfigForm ? closeConfigForm() : openConfigForm())}
          >
            {showConfigForm ? 'Cancel' : defaultConfig ? 'Edit default configuration' : 'Create default configuration'}
          </Button>
        </div>

        {showConfigForm && (
          <form className="bfsi-create-form" onSubmit={handleConfigSubmit}>
            <label className="bfsi-field">
              <span className="ios26-caption2 bfsi-field-label">Amount threshold</span>
              <input
                className="bfsi-input ios26-footnote"
                type="number"
                min="0"
                step="0.01"
                value={configThreshold}
                onChange={(event) => setConfigThreshold(event.target.value)}
                required
              />
            </label>

            <div className="bfsi-form-grid">
              <label className="bfsi-field">
                <span className="ios26-caption2 bfsi-field-label">
                  If amount is greater than threshold
                </span>
                <select
                  className="bfsi-input ios26-footnote"
                  value={configChannelAbove}
                  onChange={(event) => setConfigChannelAbove(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`config-above-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bfsi-field">
                <span className="ios26-caption2 bfsi-field-label">
                  If amount is less than or equal to threshold
                </span>
                <select
                  className="bfsi-input ios26-footnote"
                  value={configChannelBelow}
                  onChange={(event) => setConfigChannelBelow(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`config-below-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {configError && <p className="bfsi-error ios26-caption2">{configError}</p>}

            <div className="bfsi-form-actions">
              <Button variant="tinted" type="button" onClick={closeConfigForm} disabled={configSaving}>
                Cancel
              </Button>
              <Button variant="filled" type="submit" disabled={configSaving}>
                {configSaving ? 'Saving…' : defaultConfig ? 'Update configuration' : 'Save configuration'}
              </Button>
            </div>
          </form>
        )}

        {!showConfigForm && defaultConfig && (
          <div className={`bfsi-config-card${defaultConfig.paused ? ' bfsi-config-card--paused' : ''}`}>
            <div className="bfsi-config-card__header">
              <span className="ios26-headline">
                {defaultConfig.paused ? 'Paused default configuration' : 'Active default configuration'}
              </span>
              {defaultConfig.paused && (
                <span className="bfsi-config-card__badge ios26-caption2">Paused</span>
              )}
            </div>
            <span className="ios26-footnote bfsi-muted">{defaultConfig.routing_summary}</span>
            <span className="ios26-caption2 bfsi-muted">
              Updated {formatDate(defaultConfig.updated_at)}
            </span>
            <div className="bfsi-config-card__actions">
              <Button
                variant="tinted"
                type="button"
                disabled={configActionLoading}
                onClick={handlePauseConfig}
              >
                {configActionLoading
                  ? 'Updating…'
                  : defaultConfig.paused
                    ? 'Resume configuration'
                    : 'Pause configuration'}
              </Button>
              <Button
                variant="tinted"
                type="button"
                disabled={configActionLoading}
                onClick={handleDeleteConfig}
              >
                Delete configuration
              </Button>
            </div>
            {configError && <p className="bfsi-error ios26-caption2">{configError}</p>}
          </div>
        )}

        {!showConfigForm && !loading && !defaultConfig && (
          <p className="ios26-footnote bfsi-muted">
            No default configuration yet. v2 sends fall back to SMS until one is saved.
          </p>
        )}

        <p className="ios26-caption2 bfsi-muted bfsi-api-hint">
          Public Swagger documentation:{' '}
          <a href={getBfsiApiDocsUrl()} target="_blank" rel="noopener noreferrer">
            {getBfsiApiDocsUrl()}
          </a>
          . v1 and v2 send endpoints are under the <strong>bfsi-v1</strong> and{' '}
          <strong>bfsi-v2</strong> tags and require the <code>X-BFSI-Owner-Email</code> header.
        </p>
      </section>

      <section className="bfsi-panel ios26-liquid-glass-la glass-surface">
        <div className="bfsi-panel__header">
          <div>
            <p className="bfsi-eyebrow ios26-caption2">Templates</p>
            <h2 className="ios26-title2">Notification templates</h2>
            <p className="ios26-footnote bfsi-muted">
              Each template must include the {AMOUNT_VARIABLE} variable. Routing rules decide SMS,
              email, or push based on the transaction amount at send time (v1 API). Pass your account
              email in the <code>X-BFSI-Owner-Email</code> header when calling{' '}
              <code>POST /api/bfsi/v1/notifications/send</code>.
            </p>
          </div>
          <Button
            variant="filled"
            type="button"
            onClick={() => (showForm && !editingId ? closeForm() : openCreateForm())}
          >
            {showForm && !editingId ? 'Cancel' : 'Create template'}
          </Button>
        </div>

        {showForm && (
          <form className="bfsi-create-form" onSubmit={handleSubmit}>
            {editingId && (
              <p className="ios26-caption2 bfsi-muted">
                Editing template <code className="bfsi-template-id">{editingId}</code>
              </p>
            )}
            <div className="bfsi-form-grid">
              <label className="bfsi-field">
                <span className="ios26-caption2 bfsi-field-label">Template name</span>
                <input
                  className="bfsi-input ios26-footnote"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Transaction success alert"
                  required
                />
              </label>

              <label className="bfsi-field">
                <span className="ios26-caption2 bfsi-field-label">Amount threshold</span>
                <input
                  className="bfsi-input ios26-footnote"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountThreshold}
                  onChange={(event) => setAmountThreshold(event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="bfsi-field">
              <span className="ios26-caption2 bfsi-field-label">Template content</span>
              <textarea
                className="bfsi-textarea ios26-footnote"
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
              />
              <span className="ios26-caption2 bfsi-muted">
                Required variable: {AMOUNT_VARIABLE}. Example: &quot;Hi, your transaction of{' '}
                {AMOUNT_VARIABLE} rupees is successful.&quot;
              </span>
            </label>

            <div className="bfsi-form-grid">
              <label className="bfsi-field">
                <span className="ios26-caption2 bfsi-field-label">
                  If amount is greater than threshold
                </span>
                <select
                  className="bfsi-input ios26-footnote"
                  value={channelAbove}
                  onChange={(event) => setChannelAbove(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`above-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bfsi-field">
                <span className="ios26-caption2 bfsi-field-label">
                  If amount is less than or equal to threshold
                </span>
                <select
                  className="bfsi-input ios26-footnote"
                  value={channelBelow}
                  onChange={(event) => setChannelBelow(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`below-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p className="bfsi-error ios26-caption2">{error}</p>}

            <div className="bfsi-form-actions">
              <Button variant="tinted" type="button" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
              <Button variant="filled" type="submit" disabled={saving || !name.trim() || !content.trim()}>
                {saving ? 'Saving…' : editingId ? 'Update template' : 'Save template'}
              </Button>
            </div>
          </form>
        )}
      </section>

      {!showForm && (
      <section className="bfsi-panel ios26-liquid-glass-la glass-surface">
        <h3 className="ios26-headline">Saved templates</h3>

        {loading && <p className="ios26-footnote bfsi-muted">Loading templates…</p>}

        {!loading && error && (
          <p className="bfsi-error ios26-caption2">{error}</p>
        )}

        {!loading && templates.length === 0 && (
          <p className="ios26-footnote bfsi-muted">
            No templates yet. Create one to get a UUID and routing rules.
          </p>
        )}

        {!loading && templates.length > 0 && (
          <div className="bfsi-table-wrap">
            <table className="bfsi-table ios26-footnote">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Template ID</th>
                  <th scope="col">Content</th>
                  <th scope="col">Routing</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="bfsi-table__name ios26-headline">{template.name}</td>
                    <td className="bfsi-table__id">
                      <code className="bfsi-template-id ios26-caption2">{template.id}</code>
                      <CopyIdButton id={template.id} />
                    </td>
                    <td>{template.content}</td>
                    <td className="bfsi-table__routing ios26-caption2">{template.routing_summary}</td>
                    <td className="bfsi-muted ios26-caption2">{formatDate(template.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="bfsi-edit-btn ios26-caption2"
                        onClick={() => openEditForm(template)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
