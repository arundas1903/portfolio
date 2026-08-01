import React, { useState } from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import type { TaskNoteInput } from '../../types/tasks';
import { labelsToInput, parseLabelInput, todayIsoDate } from './utils';

interface NoteComposerProps {
  onSave: (input: TaskNoteInput) => Promise<void>;
}

export default function NoteComposer({ onSave }: NoteComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [labelsInput, setLabelsInput] = useState('');
  const [noteDate, setNoteDate] = useState(todayIsoDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setContent('');
    setLabelsInput('');
    setNoteDate(todayIsoDate());
    setExpanded(false);
    setError('');
  };

  const handleSave = async () => {
    if (!content.trim() || saving) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        note_date: noteDate,
        labels: parseLabelInput(labelsInput),
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard
      size="me"
      className={`tt-composer ios26-liquid-glass-me glass-surface${expanded ? ' tt-composer--expanded' : ''}`}
    >
      <input
        className="tt-composer__title ios26-headline"
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onFocus={() => setExpanded(true)}
      />
      <textarea
        className="tt-textarea"
        placeholder="Take a note…"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onFocus={() => setExpanded(true)}
        rows={expanded ? 5 : 2}
      />

      {expanded && (
        <div className="tt-form-grid">
          <label className="tt-field">
            <span className="tt-field-label ios26-caption2">Date</span>
            <input
              className="tt-input"
              type="date"
              value={noteDate}
              onChange={(event) => setNoteDate(event.target.value)}
            />
          </label>
          <label className="tt-field">
            <span className="tt-field-label ios26-caption2">Labels</span>
            <input
              className="tt-input"
              type="text"
              placeholder="work, personal"
              value={labelsInput}
              onChange={(event) => setLabelsInput(event.target.value)}
            />
          </label>
        </div>
      )}

      {error && <p className="tt-error ios26-caption2">{error}</p>}

      {expanded && (
        <div className="tt-form-actions">
          <Button variant="tinted" type="button" onClick={reset} disabled={saving}>
            Close
          </Button>
          <Button variant="filled" type="button" onClick={handleSave} disabled={saving || !content.trim()}>
            {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

export function NoteEditorModal({
  initial,
  onClose,
  onSave,
}: {
  initial: TaskNoteInput & { id: string };
  onClose: () => void;
  onSave: (input: TaskNoteInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [labelsInput, setLabelsInput] = useState(labelsToInput(initial.labels));
  const [noteDate, setNoteDate] = useState(initial.note_date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!content.trim() || saving) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        note_date: noteDate,
        labels: parseLabelInput(labelsInput),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tt-modal-backdrop" onClick={onClose} role="presentation">
      <div onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <GlassCard size="la" className="tt-modal ios26-liquid-glass-la glass-surface">
        <h2 className="ios26-title3">Edit note</h2>
        <input
          className="tt-composer__title ios26-headline"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="tt-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
        />
        <div className="tt-form-grid">
          <label className="tt-field">
            <span className="tt-field-label ios26-caption2">Date</span>
            <input
              className="tt-input"
              type="date"
              value={noteDate}
              onChange={(event) => setNoteDate(event.target.value)}
            />
          </label>
          <label className="tt-field">
            <span className="tt-field-label ios26-caption2">Labels</span>
            <input
              className="tt-input"
              type="text"
              placeholder="work, personal"
              value={labelsInput}
              onChange={(event) => setLabelsInput(event.target.value)}
            />
          </label>
        </div>
        {error && <p className="tt-error ios26-caption2">{error}</p>}
        <div className="tt-form-actions">
          <Button variant="tinted" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="filled" type="button" onClick={handleSave} disabled={saving || !content.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </GlassCard>
      </div>
    </div>
  );
}
