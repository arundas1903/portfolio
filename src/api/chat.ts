import type { ChatResponse } from '../types/chat';

const API_BASE = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:8000';

export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Failed to send message');
  }

  return response.json();
}
