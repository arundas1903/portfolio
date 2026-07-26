const STORAGE_KEY = 'faith-chat-password';

const API_BASE = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:8000';

export function getChatPassword(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setChatPassword(password: string): void {
  sessionStorage.setItem(STORAGE_KEY, password);
}

export function clearChatPassword(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const password = getChatPassword();
  if (password) {
    headers['X-Chat-Password'] = password;
  }
  return headers;
}

export interface ChatAccessStatus {
  unlocked: boolean;
  required: boolean;
}

export interface ChatLimits {
  limit: number;
  window_minutes: number;
  remaining: number;
  retry_after_seconds: number;
}

export async function fetchChatLimits(): Promise<ChatLimits> {
  const response = await fetch(`${API_BASE}/api/chat/limits`);
  if (!response.ok) {
    throw new Error('Could not load chat limits');
  }
  return response.json();
}

export async function fetchChatAccessStatus(): Promise<ChatAccessStatus> {
  const response = await fetch(`${API_BASE}/api/chat/access`);
  if (!response.ok) {
    throw new Error('Could not check chat access');
  }
  return response.json();
}

export async function unlockChat(password: string): Promise<ChatAccessStatus> {
  const response = await fetch(`${API_BASE}/api/chat/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (response.status === 401) {
    throw new Error('Incorrect password');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unlock failed' }));
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Unlock failed');
  }

  const result: ChatAccessStatus = await response.json();
  if (result.unlocked) {
    setChatPassword(password);
  }
  return result;
}

export { API_BASE, authHeaders, clearChatPassword as clearChatSession };
