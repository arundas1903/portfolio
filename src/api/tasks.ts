import type {
  TaskAuthResponse,
  TaskNote,
  TaskNoteAnalysis,
  TaskNoteDateSummary,
  TaskNoteFilters,
  TaskNoteInput,
  TaskNoteRangeSummary,
  TaskUserProfile,
} from '../types/tasks';
import { API_BASE } from './chatAuth';

const TOKEN_KEY = 'task-tracker-token';
const EMAIL_KEY = 'task-tracker-email';

export function getTaskToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredTaskEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function setTaskSession(token: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearTaskSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getTaskToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === 'string') {
      return body.detail;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export async function registerTaskUser(email: string, password: string): Promise<TaskAuthResponse> {
  const response = await fetch(`${API_BASE}/api/tasks/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not register'));
  }
  const result: TaskAuthResponse = await response.json();
  setTaskSession(result.token, result.user.email);
  return result;
}

export async function loginTaskUser(email: string, password: string): Promise<TaskAuthResponse> {
  const response = await fetch(`${API_BASE}/api/tasks/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not log in'));
  }
  const result: TaskAuthResponse = await response.json();
  setTaskSession(result.token, result.user.email);
  return result;
}

export async function fetchTaskProfile(): Promise<TaskUserProfile> {
  const response = await fetch(`${API_BASE}/api/tasks/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not load profile'));
  }
  return response.json();
}

export async function fetchTaskNotes(filters: TaskNoteFilters = {}): Promise<TaskNote[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  if (filters.label) params.set('label', filters.label);
  if (filters.q) params.set('q', filters.q);

  const query = params.toString();
  const response = await fetch(`${API_BASE}/api/tasks/notes${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not load notes'));
  }
  const data = await response.json();
  return data.items as TaskNote[];
}

export async function fetchTaskNoteDates(): Promise<TaskNoteDateSummary[]> {
  const response = await fetch(`${API_BASE}/api/tasks/notes/dates`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not load note dates'));
  }
  const data = await response.json();
  return data.dates as TaskNoteDateSummary[];
}

export async function fetchTaskLabels(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/tasks/labels`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not load labels'));
  }
  const data = await response.json();
  return data.labels as string[];
}

export async function createTaskNote(input: TaskNoteInput): Promise<TaskNote> {
  const response = await fetch(`${API_BASE}/api/tasks/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not create note'));
  }
  return response.json();
}

export async function updateTaskNote(id: string, input: TaskNoteInput): Promise<TaskNote> {
  const response = await fetch(`${API_BASE}/api/tasks/notes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not update note'));
  }
  return response.json();
}

export async function deleteTaskNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/tasks/notes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not delete note'));
  }
}

export async function summarizeTaskNotes(dateFrom: string, dateTo: string): Promise<TaskNoteRangeSummary> {
  const response = await fetch(`${API_BASE}/api/tasks/summarize`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ date_from: dateFrom, date_to: dateTo }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not summarize notes'));
  }
  return response.json();
}

export async function analyzeTaskNote(id: string): Promise<{ note: TaskNote; analysis: TaskNoteAnalysis }> {
  const response = await fetch(`${API_BASE}/api/tasks/notes/${id}/analyze`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not analyze note'));
  }
  return response.json();
}
