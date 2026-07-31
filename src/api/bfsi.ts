import type {
  BfsiTemplate,
  BfsiTemplateCreateInput,
  BfsiUserProfile,
  BfsiNotificationLogsPage,
  BfsiUsage,
  BfsiDefaultConfig,
  BfsiDefaultConfigInput,
  BfsiV2SendInput,
  BfsiV2SendResponse,
} from '../types/bfsi';
import { API_BASE } from './chatAuth';

const TOKEN_KEY = 'bfsi-sms-token';
const EMAIL_KEY = 'bfsi-sms-email';
const CLIENT_ID_KEY = 'bfsi-sms-client-id';

function getClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export function getBfsiToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredBfsiEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function clearStoredBfsiEmail(): void {
  localStorage.removeItem(EMAIL_KEY);
}

export function setBfsiSession(token: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearBfsiSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function resetBfsiBindings(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/bfsi/session/reset-bindings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: getClientId() }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not reset email bindings'));
  }
}

export async function resetBfsiEmailForBrowser(): Promise<void> {
  clearStoredBfsiEmail();
  clearBfsiSession();
  await resetBfsiBindings();
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getBfsiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => ({ detail: fallback }));
  return typeof error.detail === 'string' ? error.detail : fallback;
}

export function getBfsiApiDocsUrl(): string {
  return `${API_BASE}/docs`;
}

export async function startBfsiSession(email: string): Promise<{ token: string; user: BfsiUserProfile }> {
  const response = await fetch(`${API_BASE}/api/bfsi/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, client_id: getClientId() }),
  });

  if (response.status === 403) {
    throw new Error(await parseError(response, 'Email not allowed on this browser or network'));
  }

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not start session'));
  }

  const result = await response.json();
  setBfsiSession(result.token, result.user.email);
  return result;
}

export async function fetchBfsiProfile(): Promise<BfsiUserProfile> {
  const response = await fetch(`${API_BASE}/api/bfsi/me`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('Could not load profile');
  }

  const result = await response.json();
  return result.user;
}

export async function fetchBfsiTemplates(): Promise<BfsiTemplate[]> {
  const response = await fetch(`${API_BASE}/api/bfsi/templates`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('Could not load templates');
  }

  const result = await response.json();
  return result.templates;
}

export async function createBfsiTemplate(input: BfsiTemplateCreateInput): Promise<BfsiTemplate> {
  const response = await fetch(`${API_BASE}/api/bfsi/templates`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not create template'));
  }

  return response.json();
}

export async function updateBfsiTemplate(
  templateId: string,
  input: BfsiTemplateCreateInput,
): Promise<BfsiTemplate> {
  const response = await fetch(`${API_BASE}/api/bfsi/templates/${templateId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not update template'));
  }

  return response.json();
}

export async function fetchBfsiDefaultConfig(): Promise<BfsiDefaultConfig | null> {
  const response = await fetch(`${API_BASE}/api/bfsi/default-config`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('Could not load default configuration');
  }

  const result = await response.json();
  return result.config ?? null;
}

export async function saveBfsiDefaultConfig(input: BfsiDefaultConfigInput): Promise<BfsiDefaultConfig> {
  const response = await fetch(`${API_BASE}/api/bfsi/default-config`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not save default configuration'));
  }

  return response.json();
}

export async function pauseBfsiDefaultConfig(paused: boolean): Promise<BfsiDefaultConfig> {
  const response = await fetch(`${API_BASE}/api/bfsi/default-config/pause`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ paused }),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not update default configuration'));
  }

  return response.json();
}

export async function deleteBfsiDefaultConfig(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/bfsi/default-config`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not delete default configuration'));
  }
}

export async function fetchBfsiUsage(): Promise<BfsiUsage> {
  const response = await fetch(`${API_BASE}/api/bfsi/usage`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('Could not load usage');
  }

  return response.json();
}

export async function fetchBfsiLogs(page = 1, pageSize = 10): Promise<BfsiNotificationLogsPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const response = await fetch(`${API_BASE}/api/bfsi/logs?${params}`, {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearBfsiSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('Could not load notification logs');
  }

  return response.json();
}

export async function sendBfsiV2Notification(
  ownerEmail: string,
  input: BfsiV2SendInput,
): Promise<BfsiV2SendResponse> {
  const response = await fetch(`${API_BASE}/api/bfsi/v2/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BFSI-Owner-Email': ownerEmail,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not send notification'));
  }

  return response.json();
}
