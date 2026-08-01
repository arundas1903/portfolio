import React, { useState } from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import { summarizeTaskNotes } from '../../api/tasks';
import { trackEvent } from '../../analytics/mixpanel';
import type { TaskNoteRangeSummary } from '../../types/tasks';
import { formatDateRangeLabel, offsetIsoDate, todayIsoDate } from './utils';

interface SummarizeModalProps {
  initialFrom: string;
  initialTo: string;
  onClose: () => void;
}

function priorityClass(priority: string): string {
  if (priority === 'high') return 'tt-priority tt-priority--high';
  if (priority === 'low') return 'tt-priority tt-priority--low';
  return 'tt-priority tt-priority--medium';
}

export default function SummarizeModal({ initialFrom, initialTo, onClose }: SummarizeModalProps) {
  const today = todayIsoDate();
  const [dateFrom, setDateFrom] = useState(initialFrom || offsetIsoDate(today, -6));
  const [dateTo, setDateTo] = useState(initialTo || today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<TaskNoteRangeSummary | null>(null);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo || loading) return;

    setLoading(true);
    setError('');
    try {
      const from = dateFrom <= dateTo ? dateFrom : dateTo;
      const to = dateFrom <= dateTo ? dateTo : dateFrom;
      const result = await summarizeTaskNotes(from, to);
      setSummary(result);
      trackEvent('Task Summarize Generated', {
        date_from: from,
        date_to: to,
        note_count: result.note_count,
        section_count: result.sections.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tt-modal-backdrop" onClick={onClose} role="presentation">
      <div className="tt-summarize-wrap" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <GlassCard size="la" className="tt-summarize ios26-liquid-glass-la glass-surface">
          <div className="tt-summarize__header">
            <div>
              <p className="tt-eyebrow ios26-caption2">AI summary</p>
              <h2 className="ios26-title3">Summarize by label</h2>
              <p className="ios26-footnote tt-muted">
                Choose a date range and get a label-wise breakdown of themes and tasks.
              </p>
            </div>
            <Button variant="tinted" type="button" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="tt-date-range tt-summarize__range">
            <label className="tt-field">
              <span className="tt-field-label ios26-caption2">From</span>
              <input
                className="tt-input"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="tt-field">
              <span className="tt-field-label ios26-caption2">To</span>
              <input
                className="tt-input"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <div className="tt-date-range__actions">
              <Button variant="filled" type="button" onClick={handleGenerate} disabled={loading || !dateFrom || !dateTo}>
                {loading ? 'Summarizing…' : 'Generate summary'}
              </Button>
            </div>
          </div>

          {error && <p className="tt-error ios26-caption2">{error}</p>}

          {summary && (
            <div className="tt-summarize__result">
              <div className="tt-summarize__meta ios26-caption2 tt-muted">
                {formatDateRangeLabel(summary.date_from, summary.date_to)} · {summary.note_count} note
                {summary.note_count === 1 ? '' : 's'}
              </div>

              <GlassCard size="me" className="tt-summarize__overview ios26-liquid-glass-me glass-surface">
                <p className="ios26-footnote">{summary.overview}</p>
              </GlassCard>

              <div className="tt-summarize__sections">
                {summary.sections.map((section) => (
                  <GlassCard
                    key={section.label}
                    size="me"
                    className="tt-summarize__section ios26-liquid-glass-me glass-surface"
                  >
                    <div className="tt-summarize__section-head">
                      <span className="tt-label ios26-caption2">{section.label}</span>
                    </div>
                    <p className="ios26-footnote">{section.summary}</p>

                    {section.highlights.length > 0 && (
                      <ul className="tt-summarize__highlights ios26-caption2">
                        {section.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}

                    {section.tasks.length > 0 && (
                      <ul className="tt-summarize__tasks ios26-caption2">
                        {section.tasks.map((task) => (
                          <li key={task.title}>
                            <span className={priorityClass(task.priority)}>{task.priority}</span>
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
