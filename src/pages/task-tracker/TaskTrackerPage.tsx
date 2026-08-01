import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SubpageNav from '../../components/ios26/SubpageNav';
import GlassCard from '../../components/ios26/GlassCard';
import Button from '../../components/ios26/Button';
import {
  analyzeTaskNote,
  clearTaskSession,
  createTaskNote,
  deleteTaskNote,
  fetchTaskLabels,
  fetchTaskNotes,
  fetchTaskProfile,
  getTaskToken,
  updateTaskNote,
} from '../../api/tasks';
import type { TaskNote, TaskNoteInput, TaskUserProfile } from '../../types/tasks';
import NoteCard from './NoteCard';
import NoteComposer, { NoteEditorModal } from './NoteComposer';
import SummarizeModal from './SummarizeModal';
import TaskAuthGate from './TaskAuthGate';
import {
  formatDateRangeLabel,
  offsetIsoDate,
  startOfMonthIsoDate,
  todayIsoDate,
} from './utils';

type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'custom';

export default function TaskTrackerPage() {
  const [user, setUser] = useState<TaskUserProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!getTaskToken()) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const profile = await fetchTaskProfile();
        if (!cancelled) setUser(profile);
      } catch {
        clearTaskSession();
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    loadSession();
  }, []);

  const handleSignOut = () => {
    clearTaskSession();
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div className="tt-page">
        <div className="tt-background" aria-hidden />
        <div className="tt-page__inner">
          <SubpageNav to="/" label="Portfolio" />
          <p className="ios26-footnote tt-muted tt-loading">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tt-page">
        <div className="tt-background" aria-hidden />
        <div className="tt-page__inner tt-page__inner--gate">
          <SubpageNav to="/" label="Portfolio" />
          <TaskAuthGate onAuthenticated={setUser} />
        </div>
      </div>
    );
  }

  return <TaskTrackerApp user={user} onSignOut={handleSignOut} />;
}

function TaskTrackerApp({
  user,
  onSignOut,
}: {
  user: TaskUserProfile;
  onSignOut: () => void;
}) {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState<TaskNote | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [showSummarize, setShowSummarize] = useState(false);

  const today = todayIsoDate();

  const applyPreset = useCallback(
    (preset: DatePreset) => {
      setDatePreset(preset);
      if (preset === 'all') {
        setDateFrom('');
        setDateTo('');
        return;
      }
      if (preset === 'today') {
        setDateFrom(today);
        setDateTo(today);
        return;
      }
      if (preset === 'last7') {
        setDateFrom(offsetIsoDate(today, -6));
        setDateTo(today);
        return;
      }
      if (preset === 'last30') {
        setDateFrom(offsetIsoDate(today, -29));
        setDateTo(today);
        return;
      }
      if (preset === 'thisMonth') {
        setDateFrom(startOfMonthIsoDate(today));
        setDateTo(today);
      }
    },
    [today],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [noteItems, labelItems] = await Promise.all([
        fetchTaskNotes({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          label: selectedLabel || undefined,
          q: search.trim() || undefined,
        }),
        fetchTaskLabels(),
      ]);
      setNotes(noteItems);
      setLabels(labelItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notes');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search, selectedLabel]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreate = async (input: TaskNoteInput) => {
    await createTaskNote(input);
    await loadAll();
  };

  const handleUpdate = async (input: TaskNoteInput) => {
    if (!editingNote) return;
    await updateTaskNote(editingNote.id, input);
    setEditingNote(null);
    await loadAll();
  };

  const handleDelete = async (note: TaskNote) => {
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;
    await deleteTaskNote(note.id);
    await loadAll();
  };

  const handleAnalyze = async (note: TaskNote) => {
    setAnalyzingId(note.id);
    setError('');
    try {
      await analyzeTaskNote(note.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze note');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleFromChange = (value: string) => {
    setDatePreset('custom');
    setDateFrom(value);
    if (value && dateTo && value > dateTo) {
      setDateTo(value);
    }
  };

  const handleToChange = (value: string) => {
    setDatePreset('custom');
    setDateTo(value);
    if (value && dateFrom && value < dateFrom) {
      setDateFrom(value);
    }
  };

  const totalNotes = useMemo(() => notes.length, [notes.length]);

  const dateFilterLabel = useMemo(() => {
    if (!dateFrom && !dateTo) return '';
    if (dateFrom && dateTo) return formatDateRangeLabel(dateFrom, dateTo);
    if (dateFrom) return `From ${formatDateRangeLabel(dateFrom, dateFrom)}`;
    return `Until ${formatDateRangeLabel(dateTo, dateTo)}`;
  }, [dateFrom, dateTo]);

  const presetButtons: { id: DatePreset; label: string }[] = [
    { id: 'all', label: 'All dates' },
    { id: 'today', label: 'Today' },
    { id: 'last7', label: 'Last 7 days' },
    { id: 'last30', label: 'Last 30 days' },
    { id: 'thisMonth', label: 'This month' },
  ];

  return (
    <div className="tt-page">
      <div className="tt-background" aria-hidden />

      <div className="tt-page__inner">
        <SubpageNav to="/" label="Portfolio" />

        <GlassCard size="la" className="tt-header ios26-liquid-glass-la glass-surface">
          <div className="tt-header__content">
            <div>
              <p className="tt-eyebrow ios26-caption2">Daily notes</p>
              <h1 className="ios26-title2">Task Tracker</h1>
              <p className="ios26-footnote tt-muted">
                Signed in as {user.email}. Capture daily notes, label them, and let AI extract tasks.
              </p>
            </div>
            <div className="tt-header__actions">
              <Button variant="filled" type="button" onClick={() => setShowSummarize(true)}>
                Summarize
              </Button>
              <Button variant="tinted" type="button" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard size="la" className="tt-panel ios26-liquid-glass-la glass-surface">
          <div className="tt-toolbar">
            <div className="tt-date-range">
              <label className="tt-field">
                <span className="tt-field-label ios26-caption2">From</span>
                <input
                  className="tt-input"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => handleFromChange(event.target.value)}
                />
              </label>
              <label className="tt-field">
                <span className="tt-field-label ios26-caption2">To</span>
                <input
                  className="tt-input"
                  type="date"
                  value={dateTo}
                  onChange={(event) => handleToChange(event.target.value)}
                />
              </label>
              <div className="tt-date-range__actions">
                <Button variant="tinted" type="button" onClick={() => applyPreset('all')}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="tt-date-presets">
              {presetButtons.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`tt-filter-chip ios26-caption2${datePreset === preset.id ? ' tt-filter-chip--active' : ''}`}
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="tt-toolbar__group">
              <label className="tt-field">
                <span className="tt-field-label ios26-caption2">Search</span>
                <input
                  className="tt-input"
                  type="search"
                  placeholder="Search notes"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            <div className="tt-label-filter">
              <button
                type="button"
                className={`tt-filter-chip ios26-caption2${selectedLabel === '' ? ' tt-filter-chip--active' : ''}`}
                onClick={() => setSelectedLabel('')}
              >
                All labels
              </button>
              {labels.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`tt-filter-chip ios26-caption2${selectedLabel === label ? ' tt-filter-chip--active' : ''}`}
                  onClick={() => setSelectedLabel(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <NoteComposer onSave={handleCreate} />

          {error && <p className="tt-error ios26-caption2">{error}</p>}
          {loading && <p className="ios26-footnote tt-muted">Loading notes…</p>}

          {!loading && (
            <>
              <p className="ios26-footnote tt-muted tt-count">
                {totalNotes} note{totalNotes === 1 ? '' : 's'}
                {dateFilterLabel ? ` · ${dateFilterLabel}` : ''}
                {selectedLabel ? ` · ${selectedLabel}` : ''}
              </p>

              {notes.length === 0 ? (
                <div className="tt-empty ios26-liquid-glass-me glass-surface">
                  <p className="ios26-footnote tt-muted">No notes in this range. Try another date or add a note above.</p>
                </div>
              ) : (
                <div className="tt-grid">
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={setEditingNote}
                      onDelete={handleDelete}
                      onAnalyze={handleAnalyze}
                      analyzing={analyzingId === note.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>

      {editingNote && (
        <NoteEditorModal
          initial={{
            id: editingNote.id,
            title: editingNote.title,
            content: editingNote.content,
            note_date: editingNote.note_date,
            labels: editingNote.labels,
          }}
          onClose={() => setEditingNote(null)}
          onSave={handleUpdate}
        />
      )}

      {showSummarize && (
        <SummarizeModal
          initialFrom={dateFrom}
          initialTo={dateTo}
          onClose={() => setShowSummarize(false)}
        />
      )}
    </div>
  );
}
