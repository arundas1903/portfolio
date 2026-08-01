import React, { useCallback, useEffect, useState } from 'react';
import Button from '../../components/ios26/Button';
import { fetchBfsiLogs } from '../../api/bfsi';
import type { BfsiNotificationLog } from '../../types/bfsi';

const PAGE_SIZE = 10;

interface BfsiLogsTabProps {
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

function formatAiTokens(tokens: number | null): string {
  if (!tokens) {
    return '—';
  }
  return tokens.toLocaleString();
}

function channelLabel(channel: string): string {
  if (channel === 'sms') return 'SMS';
  if (channel === 'email') return 'Email';
  if (channel === 'push') return 'Push';
  if (channel === 'network') return 'Network';
  return channel;
}

function deliveryAudience(log: BfsiNotificationLog): string {
  if (log.channel === 'email') {
    return log.audience_email ?? '—';
  }
  if (log.channel === 'sms' || log.channel === 'push' || log.channel === 'network') {
    return log.audience_phone ?? '—';
  }
  return log.audience_phone ?? log.audience_email ?? '—';
}

export default function BfsiLogsTab({ onUsageUpdate }: BfsiLogsTabProps) {
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
      <p className="ios26-footnote bfsi-muted">
        Notifications and network API checks — {total} total.
      </p>

      {loading && <p className="ios26-footnote bfsi-muted">Loading logs…</p>}
      {error && <p className="bfsi-error ios26-caption2">{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <p className="ios26-footnote bfsi-muted">
          No activity yet. Send notifications or run SIM swap network checks to create logs.
        </p>
      )}

      {!loading && logs.length > 0 && (
        <>
          <div className="bfsi-table-wrap">
            <table className="bfsi-table ios26-footnote">
              <thead>
                <tr>
                  <th scope="col">Sent</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Channel price</th>
                  <th scope="col">AI tokens</th>
                  <th scope="col">Audience</th>
                  <th scope="col">Message</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="bfsi-muted ios26-caption2">{formatDate(log.created_at)}</td>
                    <td>{channelLabel(log.channel)}</td>
                    <td>{formatPaise(log.price_paise)}</td>
                    <td className="ios26-caption2">{formatAiTokens(log.ai_tokens)}</td>
                    <td className="ios26-caption2">{deliveryAudience(log)}</td>
                    <td>{log.message}</td>
                    <td>{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bfsi-pagination">
              <Button
                variant="tinted"
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => loadLogs(page - 1)}
              >
                Previous
              </Button>
              <span className="ios26-caption2 bfsi-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="tinted"
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => loadLogs(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
