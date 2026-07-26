import type { A2PChatResponse } from '../types/a2p';
import type { ChatLimits } from './chatAuth';
import { API_BASE, authHeaders, clearChatSession } from './chatAuth';

export async function fetchA2PLimits(): Promise<ChatLimits> {
  const response = await fetch(`${API_BASE}/api/a2p/limits`);
  if (!response.ok) {
    throw new Error('Could not load chat limits');
  }
  return response.json();
}

export async function sendA2PMessage(message: string): Promise<A2PChatResponse> {
  const response = await fetch(`${API_BASE}/api/a2p/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });

  if (response.status === 401) {
    clearChatSession();
    throw new Error('Session expired. Please enter the password again.');
  }

  if (response.status === 429) {
    const error = await response.json().catch(() => ({ detail: 'Rate limit reached' }));
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Rate limit reached');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Failed to send message');
  }

  return response.json();
}

export {
  fetchChatAccessStatus,
  getChatPassword,
  unlockChat,
  clearChatSession,
} from './chatAuth';
