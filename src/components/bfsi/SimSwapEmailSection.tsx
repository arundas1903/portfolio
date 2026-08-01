import React, { useEffect } from 'react';
import Button from '../ios26/Button';
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

export default function SimSwapEmailSection() {
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
    <section className="bfsi-panel ios26-liquid-glass-la glass-surface">
      <div className="bfsi-panel__header">
        <div>
          <p className="bfsi-eyebrow ios26-caption2">SIM swap alert</p>
          <h2 className="ios26-title2">Default SIM swap email</h2>
          <p className="ios26-footnote bfsi-muted">
            Email sent when a UPI registration detects a SIM swap within 24 hours. Include a link
            to block transactions; unblocking requires contacting the bank.
          </p>
        </div>
        <Button
          variant="filled"
          type="button"
          onClick={() => (showForm ? closeForm() : openForm())}
        >
          {showForm ? 'Cancel' : config ? 'Edit SIM swap email' : 'Create SIM swap email'}
        </Button>
      </div>

      {showForm && (
        <form
          className="bfsi-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <label className="bfsi-field">
            <span className="ios26-caption2 bfsi-field-label">Email content</span>
            <textarea
              className="bfsi-textarea ios26-footnote"
              rows={12}
              value={emailContent}
              onChange={(event) => setEmailContent(event.target.value)}
              required
            />
            <span className="ios26-caption2 bfsi-muted">
              Sent to the customer when SIM swap is detected during UPI app registration. Appears in
              notification logs as a normal email.
            </span>
          </label>

          {error && <p className="bfsi-error ios26-caption2">{error}</p>}

          <div className="bfsi-form-actions">
            <Button variant="tinted" type="button" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button variant="filled" type="submit" disabled={saving || !emailContent.trim()}>
              {saving ? 'Saving…' : config ? 'Update email' : 'Save email'}
            </Button>
          </div>
        </form>
      )}

      {!showForm && config && (
        <div className="bfsi-config-card">
          <div className="bfsi-config-card__header">
            <span className="ios26-headline">Active SIM swap email</span>
          </div>
          <pre className="bfsi-simswap-preview ios26-caption2">{config.email_content}</pre>
          <span className="ios26-caption2 bfsi-muted">Updated {formatDate(config.updated_at)}</span>
          <div className="bfsi-config-card__actions">
            <Button variant="tinted" type="button" disabled={actionLoading} onClick={handleDelete}>
              Delete configuration
            </Button>
          </div>
          {error && <p className="bfsi-error ios26-caption2">{error}</p>}
        </div>
      )}

      {!showForm && !loading && !config && (
        <p className="ios26-footnote bfsi-muted">
          No SIM swap email configured. Registration will still be blocked, but no alert email is
          sent.
        </p>
      )}
    </section>
  );
}
