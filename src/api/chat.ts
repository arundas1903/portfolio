import type { ChatResponse } from '../types/chat';
import { API_BASE, authHeaders, clearChatSession } from './chatAuth';

export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
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
  fetchChatLimits,
  getChatPassword,
  unlockChat,
  clearChatSession,
} from './chatAuth';
export type { ChatAccessStatus, ChatLimits } from './chatAuth';
