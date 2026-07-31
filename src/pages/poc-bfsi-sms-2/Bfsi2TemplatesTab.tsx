import React, { useCallback, useEffect, useState } from 'react';
import {
  KaleAlert,
  KaleBadge,
  KaleButton,
  KaleCard,
  KaleField,
  KaleInput,
  KaleSelect,
  KaleTable,
  KaleTextarea,
} from '../../design/kaleyra';
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
    <button type="button" className="bfsi2-copy-btn" onClick={handleCopy} aria-label="Copy template ID">
      {copied ? 'Copied' : 'Copy ID'}
    </button>
  );
}

export default function Bfsi2TemplatesTab() {
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
    <div className="bfsi2-main">
      <KaleCard className="bfsi2-panel">
        <div className="bfsi2-panel__header">
          <div>
            <p className="kale-eyebrow">Default configuration</p>
            <h2 className="kale-title-500">V2 routing rules</h2>
            <p className="kale-text-300">
              Used by the v2 send API when AI detects a transaction message with an amount. No
              template name or message body — routing only.
            </p>
          </div>
          <KaleButton
            variant="primary"
            onClick={() => (showConfigForm ? closeConfigForm() : openConfigForm())}
          >
            {showConfigForm
              ? 'Cancel'
              : defaultConfig
                ? 'Edit default configuration'
                : 'Create default configuration'}
          </KaleButton>
        </div>

        {showConfigForm && (
          <form className="bfsi2-panel" onSubmit={handleConfigSubmit}>
            <KaleField label="Amount threshold">
              <KaleInput
                type="number"
                min="0"
                step="0.01"
                value={configThreshold}
                onChange={(event) => setConfigThreshold(event.target.value)}
                required
              />
            </KaleField>

            <div className="bfsi2-form-grid">
              <KaleField label="If amount is greater than threshold">
                <KaleSelect
                  value={configChannelAbove}
                  onChange={(event) => setConfigChannelAbove(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`config-above-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </KaleSelect>
              </KaleField>

              <KaleField label="If amount is less than or equal to threshold">
                <KaleSelect
                  value={configChannelBelow}
                  onChange={(event) => setConfigChannelBelow(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`config-below-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </KaleSelect>
              </KaleField>
            </div>

            {configError && <KaleAlert variant="error">{configError}</KaleAlert>}

            <div className="bfsi2-form-actions">
              <KaleButton variant="ghost" onClick={closeConfigForm} disabled={configSaving}>
                Cancel
              </KaleButton>
              <KaleButton variant="primary" type="submit" disabled={configSaving}>
                {configSaving ? 'Saving…' : defaultConfig ? 'Update configuration' : 'Save configuration'}
              </KaleButton>
            </div>
          </form>
        )}

        {!showConfigForm && defaultConfig && (
          <div className={`bfsi2-config-card${defaultConfig.paused ? ' bfsi2-config-card--paused' : ''}`}>
            <div className="bfsi2-config-card__header">
              <span className="kale-title-500">
                {defaultConfig.paused ? 'Paused default configuration' : 'Active default configuration'}
              </span>
              {defaultConfig.paused && <KaleBadge variant="warning">Paused</KaleBadge>}
            </div>
            <span className="kale-text-300">{defaultConfig.routing_summary}</span>
            <span className="kale-text-300">Updated {formatDate(defaultConfig.updated_at)}</span>
            <div className="bfsi2-config-card__actions">
              <KaleButton variant="ghost" size="sm" disabled={configActionLoading} onClick={handlePauseConfig}>
                {configActionLoading
                  ? 'Updating…'
                  : defaultConfig.paused
                    ? 'Resume configuration'
                    : 'Pause configuration'}
              </KaleButton>
              <KaleButton variant="ghost" size="sm" disabled={configActionLoading} onClick={handleDeleteConfig}>
                Delete configuration
              </KaleButton>
            </div>
            {configError && <KaleAlert variant="error">{configError}</KaleAlert>}
          </div>
        )}

        {!showConfigForm && !loading && !defaultConfig && (
          <p className="kale-text-300">
            No default configuration yet. v2 sends fall back to SMS until one is saved.
          </p>
        )}

        <p className="kale-text-300 bfsi2-api-hint">
          Public Swagger documentation:{' '}
          <a href={getBfsiApiDocsUrl()} target="_blank" rel="noopener noreferrer">
            {getBfsiApiDocsUrl()}
          </a>
          . v1 and v2 send endpoints are under the <strong>bfsi-v1</strong> and{' '}
          <strong>bfsi-v2</strong> tags and require the <code>X-BFSI-Owner-Email</code> header.
        </p>
      </KaleCard>

      <KaleCard className="bfsi2-panel">
        <div className="bfsi2-panel__header">
          <div>
            <p className="kale-eyebrow">Templates</p>
            <h2 className="kale-title-500">Notification templates</h2>
            <p className="kale-text-300">
              Each template must include the {AMOUNT_VARIABLE} variable. Routing rules decide SMS,
              email, or push based on the transaction amount at send time (v1 API). Pass your account
              email in the <code>X-BFSI-Owner-Email</code> header when calling{' '}
              <code>POST /api/bfsi/v1/notifications/send</code>.
            </p>
          </div>
          <KaleButton
            variant="primary"
            onClick={() => (showForm && !editingId ? closeForm() : openCreateForm())}
          >
            {showForm && !editingId ? 'Cancel' : 'Create template'}
          </KaleButton>
        </div>

        {showForm && (
          <form className="bfsi2-panel" onSubmit={handleSubmit}>
            {editingId && (
              <p className="kale-text-300">
                Editing template <code className="bfsi2-template-id">{editingId}</code>
              </p>
            )}
            <div className="bfsi2-form-grid">
              <KaleField label="Template name">
                <KaleInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Transaction success alert"
                  required
                />
              </KaleField>

              <KaleField label="Amount threshold">
                <KaleInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountThreshold}
                  onChange={(event) => setAmountThreshold(event.target.value)}
                  required
                />
              </KaleField>
            </div>

            <KaleField
              label="Template content"
              hint={`Required variable: ${AMOUNT_VARIABLE}. Example: "Hi, your transaction of ${AMOUNT_VARIABLE} rupees is successful."`}
            >
              <KaleTextarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} required />
            </KaleField>

            <div className="bfsi2-form-grid">
              <KaleField label="If amount is greater than threshold">
                <KaleSelect
                  value={channelAbove}
                  onChange={(event) => setChannelAbove(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`above-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </KaleSelect>
              </KaleField>

              <KaleField label="If amount is less than or equal to threshold">
                <KaleSelect
                  value={channelBelow}
                  onChange={(event) => setChannelBelow(event.target.value as NotificationChannel)}
                >
                  {CHANNEL_OPTIONS.map((option) => (
                    <option key={`below-${option.value}`} value={option.value}>
                      Send {option.label}
                    </option>
                  ))}
                </KaleSelect>
              </KaleField>
            </div>

            {error && <KaleAlert variant="error">{error}</KaleAlert>}

            <div className="bfsi2-form-actions">
              <KaleButton variant="ghost" onClick={closeForm} disabled={saving}>
                Cancel
              </KaleButton>
              <KaleButton variant="primary" type="submit" disabled={saving || !name.trim() || !content.trim()}>
                {saving ? 'Saving…' : editingId ? 'Update template' : 'Save template'}
              </KaleButton>
            </div>
          </form>
        )}
      </KaleCard>

      {!showForm && (
        <KaleCard className="bfsi2-panel">
          <h3 className="kale-title-500">Saved templates</h3>

          {loading && <p className="kale-text-300">Loading templates…</p>}
          {error && <KaleAlert variant="error">{error}</KaleAlert>}

          {!loading && templates.length === 0 && (
            <p className="kale-text-300">No templates yet. Create one to get a UUID and routing rules.</p>
          )}

          {!loading && templates.length > 0 && (
            <KaleTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'id', label: 'Template ID' },
                { key: 'content', label: 'Content' },
                { key: 'routing', label: 'Routing' },
                { key: 'created', label: 'Created' },
                { key: 'actions', label: 'Actions' },
              ]}
            >
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="kale-title-500">{template.name}</td>
                  <td>
                    <code className="bfsi2-template-id">{template.id}</code>
                    <CopyIdButton id={template.id} />
                  </td>
                  <td>{template.content}</td>
                  <td className="kale-text-300">{template.routing_summary}</td>
                  <td className="kale-text-300">{formatDate(template.created_at)}</td>
                  <td>
                    <button type="button" className="bfsi2-edit-btn" onClick={() => openEditForm(template)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </KaleTable>
          )}
        </KaleCard>
      )}
    </div>
  );
}
