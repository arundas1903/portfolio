export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function parseLabelInput(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
    ),
  );
}

export function labelsToInput(labels: string[]): string {
  return labels.join(', ');
}

export function offsetIsoDate(isoDate: string, dayOffset: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateRangeLabel(from: string, to: string): string {
  if (from === to) {
    return formatDisplayDate(from);
  }
  return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

export function startOfMonthIsoDate(isoDate: string): string {
  const [year, month] = isoDate.split('-');
  return `${year}-${month}-01`;
}

export function notePreview(content: string, maxLength = 160): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trim()}…`;
}
