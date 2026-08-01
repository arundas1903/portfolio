import { useCallback, useState } from 'react';
import {
  deleteBfsiSimSwapEmailConfig,
  fetchBfsiSimSwapEmailConfig,
  saveBfsiSimSwapEmailConfig,
} from '../api/bfsi';
import {
  DEFAULT_SIM_SWAP_EMAIL_CONTENT,
  type BfsiSimSwapEmailConfig,
} from '../types/bfsi';

export function useSimSwapEmailConfig() {
  const [config, setConfig] = useState<BfsiSimSwapEmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [emailContent, setEmailContent] = useState(DEFAULT_SIM_SWAP_EMAIL_CONTENT);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const item = await fetchBfsiSimSwapEmailConfig();
      setConfig(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load SIM swap email configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetForm = useCallback((item: BfsiSimSwapEmailConfig | null) => {
    setEmailContent(item?.email_content ?? DEFAULT_SIM_SWAP_EMAIL_CONTENT);
    setError('');
  }, []);

  const openForm = useCallback(() => {
    resetForm(config);
    setShowForm(true);
  }, [config, resetForm]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    resetForm(config);
  }, [config, resetForm]);

  const handleSave = useCallback(async () => {
    if (saving || !emailContent.trim()) return;

    setSaving(true);
    setError('');
    try {
      const saved = await saveBfsiSimSwapEmailConfig({ email_content: emailContent.trim() });
      setConfig(saved);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save SIM swap email configuration');
    } finally {
      setSaving(false);
    }
  }, [emailContent, saving]);

  const handleDelete = useCallback(async () => {
    if (!config || actionLoading) return;
    if (!window.confirm('Delete this SIM swap email configuration?')) return;

    setActionLoading(true);
    setError('');
    try {
      await deleteBfsiSimSwapEmailConfig();
      setConfig(null);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete SIM swap email configuration');
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, closeForm, config]);

  return {
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
  };
}
