import React, { useCallback, useEffect, useState } from 'react';
import {
  KaleAlert,
  KaleButton,
  KaleEmpty,
  KaleTable,
} from '../../design/kaleyra';
import { fetchBfsiLogs } from '../../api/bfsi';
import type { BfsiNotificationLog } from '../../types/bfsi';

const PAGE_SIZE = 10;

interface Bfsi2LogsTabProps {
  onUsageUpdate?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPaise(paise: number): string {
  return `${paise} paise`;
}

function channelLabel(channel: string): string {
  if (channel === 'sms') return 'SMS';
  if (channel === 'email') return 'Email';
  if (channel === 'push') return 'Push';
  return channel;
}

function deliveryAudience(log: BfsiNotificationLog): string {
  if (log.channel === 'email') {
    return log.audience_email ?? '—';
  }
  if (log.channel === 'sms' || log.channel === 'push') {
    return log.audience_phone ?? '—';
  }
  return log.audience_phone ?? log.audience_email ?? '—';
}

const LOG_COLUMNS = [
  { key: 'sent', label: 'Sent' },
  { key: 'channel', label: 'Channel' },
  { key: 'price', label: 'Price' },
  { key: 'audience', label: 'Audience' },
  { key: 'message', label: 'Message' },
  { key: 'status', label: 'Status' },
];

export default function Bfsi2LogsTab({ onUsageUpdate }: Bfsi2LogsTabProps) {
  const [logs, setLogs] = useState<BfsiNotificationLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchBfsiLogs(targetPage, PAGE_SIZE);
        setLogs(result.items);
        setPage(result.page);
        setTotalPages(result.total_pages);
        setTotal(result.total);
        onUsageUpdate?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load logs');
      } finally {
        setLoading(false);
      }
    },
    [onUsageUpdate],
  );

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  return (
    <>
      <p className="kale-text-300">
        Successful send API calls for your templates — {total} total.
      </p>

      {loading && <p className="kale-text-300">Loading logs…</p>}
      {error && <KaleAlert variant="error">{error}</KaleAlert>}

      {!loading && !error && logs.length === 0 && (
        <KaleEmpty>No sends yet. Call the v1 send API to create logs.</KaleEmpty>
      )}

      {!loading && logs.length > 0 && (
        <>
          <KaleTable columns={LOG_COLUMNS}>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="kale-text-300">{formatDate(log.created_at)}</td>
                <td>{channelLabel(log.channel)}</td>
                <td>{formatPaise(log.price_paise)}</td>
                <td className="kale-text-400">{deliveryAudience(log)}</td>
                <td>{log.message}</td>
                <td>{log.status}</td>
              </tr>
            ))}
          </KaleTable>

          {totalPages > 1 && (
            <div className="bfsi2-pagination">
              <KaleButton
                variant="ghost"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => loadLogs(page - 1)}
              >
                Previous
              </KaleButton>
              <span className="kale-text-300">
                Page {page} of {totalPages}
              </span>
              <KaleButton
                variant="ghost"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => loadLogs(page + 1)}
              >
                Next
              </KaleButton>
            </div>
          )}
        </>
      )}
    </>
  );
}
