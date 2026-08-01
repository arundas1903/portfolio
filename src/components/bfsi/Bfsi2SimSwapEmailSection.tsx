import React, { useEffect } from 'react';
import {
  KaleAlert,
  KaleButton,
  KaleCard,
  KaleTextarea,
} from '../../design/kaleyra';
import { useSimSwapEmailConfig } from '../../hooks/useSimSwapEmailConfig';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Bfsi2SimSwapEmailSection() {
  const {
    config,
    loading,
    saving,
    actionLoading,
    error,
    showForm,
    emailContent,
    setEmailContent,
    loadConfig,
    openForm,
    closeForm,
    handleSave,
    handleDelete,
  } = useSimSwapEmailConfig();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <KaleCard>
      <div className="bfsi2-panel__header">
        <div>
          <p className="kale-text-300">SIM swap alert</p>
          <h2 className="kale-heading-400">Default SIM swap email</h2>
          <p className="kale-text-300">
            Email sent when a UPI registration detects a SIM swap within 24 hours. Include a link
            to block transactions; unblocking requires contacting the bank.
          </p>
        </div>
        <KaleButton
          variant="primary"
          size="sm"
          type="button"
          onClick={() => (showForm ? closeForm() : openForm())}
        >
          {showForm ? 'Cancel' : config ? 'Edit SIM swap email' : 'Create SIM swap email'}
        </KaleButton>
      </div>

      {showForm && (
        <form
          className="bfsi2-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <label className="bfsi2-field">
            <span className="kale-text-300">Email content</span>
            <KaleTextarea
              rows={12}
              value={emailContent}
              onChange={(event) => setEmailContent(event.target.value)}
              required
            />
            <span className="kale-text-300">
              Sent when SIM swap is detected during UPI registration. Logged as a normal email.
            </span>
          </label>

          {error && <KaleAlert variant="error">{error}</KaleAlert>}

          <div className="bfsi2-form-actions">
            <KaleButton variant="ghost" type="button" onClick={closeForm} disabled={saving}>
              Cancel
            </KaleButton>
            <KaleButton variant="primary" type="submit" disabled={saving || !emailContent.trim()}>
              {saving ? 'Saving…' : config ? 'Update email' : 'Save email'}
            </KaleButton>
          </div>
        </form>
      )}

      {!showForm && config && (
        <div className="bfsi2-config-card">
          <h3 className="kale-heading-300">Active SIM swap email</h3>
          <pre className="bfsi2-simswap-preview">{config.email_content}</pre>
          <p className="kale-text-300">Updated {formatDate(config.updated_at)}</p>
          <KaleButton variant="ghost" type="button" disabled={actionLoading} onClick={handleDelete}>
            Delete configuration
          </KaleButton>
          {error && <KaleAlert variant="error">{error}</KaleAlert>}
        </div>
      )}

      {!showForm && !loading && !config && (
        <p className="kale-text-300">
          No SIM swap email configured. Registration will still be blocked, but no alert email is
          sent.
        </p>
      )}
    </KaleCard>
  );
}
