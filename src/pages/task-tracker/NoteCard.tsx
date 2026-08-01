import React from 'react';
import Button from '../../components/ios26/Button';
import GlassCard from '../../components/ios26/GlassCard';
import type { TaskNote } from '../../types/tasks';
import { formatDisplayDate, formatUpdatedAt, notePreview } from './utils';

interface NoteCardProps {
  note: TaskNote;
  onEdit: (note: TaskNote) => void;
  onDelete: (note: TaskNote) => void;
  onAnalyze: (note: TaskNote) => void;
  analyzing: boolean;
}

function priorityClass(priority: string): string {
  if (priority === 'high') return 'tt-priority tt-priority--high';
  if (priority === 'low') return 'tt-priority tt-priority--low';
  return 'tt-priority tt-priority--medium';
}

export default function NoteCard({ note, onEdit, onDelete, onAnalyze, analyzing }: NoteCardProps) {
  return (
    <GlassCard size="me" className="tt-card ios26-liquid-glass-me glass-surface">
      <button type="button" className="tt-card__body" onClick={() => onEdit(note)}>
        {note.title && <h3 className="ios26-headline tt-card__title">{note.title}</h3>}
        <p className="ios26-footnote tt-card__content">{notePreview(note.content)}</p>
        <div className="tt-card__meta ios26-caption2 tt-muted">
          <span>{formatDisplayDate(note.note_date)}</span>
          <span>Updated {formatUpdatedAt(note.updated_at)}</span>
        </div>
        {note.labels.length > 0 && (
          <div className="tt-card__labels">
            {note.labels.map((label) => (
              <span key={label} className="tt-label ios26-caption2">
                {label}
              </span>
            ))}
          </div>
        )}
      </button>

      {note.ai_analysis && (
        <div className="tt-card__analysis">
          <p className="ios26-caption2">{note.ai_analysis.summary}</p>
          {note.ai_analysis.tasks.length > 0 && (
            <ul className="tt-card__tasks ios26-caption2">
              {note.ai_analysis.tasks.slice(0, 4).map((task) => (
                <li key={task.title}>
                  <span className={priorityClass(task.priority)}>{task.priority}</span>
                  {task.title}
                </li>
              ))}
            </ul>
          )}
          <p className="ios26-caption2 tt-muted">{note.ai_analysis.focus}</p>
        </div>
      )}

      <div className="tt-card__actions">
        <Button variant="tinted" type="button" onClick={() => onAnalyze(note)} disabled={analyzing}>
          {analyzing ? 'Analyzing…' : 'AI analyze'}
        </Button>
        <Button variant="tinted" type="button" onClick={() => onEdit(note)}>
          Edit
        </Button>
        <Button variant="glass" type="button" onClick={() => onDelete(note)}>
          Delete
        </Button>
      </div>
    </GlassCard>
  );
}
