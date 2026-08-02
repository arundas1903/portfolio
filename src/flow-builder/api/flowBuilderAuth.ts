import {
  clearChatPassword,
  getChatPassword,
  unlockChat,
  API_BASE,
} from '../../api/chatAuth';

const EMAIL_STORAGE_KEY = 'flow-builder-email';

export function getFlowBuilderEmail(): string | null {
  return sessionStorage.getItem(EMAIL_STORAGE_KEY);
}

export function setFlowBuilderEmail(email: string): void {
  sessionStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
}

export function clearFlowBuilderEmail(): void {
  sessionStorage.removeItem(EMAIL_STORAGE_KEY);
}

export function clearFlowBuilderSession(): void {
  clearFlowBuilderEmail();
  clearChatPassword();
}

export function flowBuilderAuthHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const password = getChatPassword();
  if (password) {
    headers['X-Chat-Password'] = password;
  }
  const email = getFlowBuilderEmail();
  if (email) {
    headers['X-Flow-Builder-Email'] = email;
  }
  return headers;
}

export interface FlowBuilderAccessStatus {
  required: boolean;
  unlocked: boolean;
  email_required: boolean;
}

export async function fetchFlowBuilderAccess(): Promise<FlowBuilderAccessStatus> {
  const response = await fetch(`${API_BASE}/api/flow-builder/access`, {
    headers: flowBuilderAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not check Flow Builder access');
  }
  return response.json();
}

export async function unlockFlowBuilder(email: string, password: string): Promise<FlowBuilderAccessStatus> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error('Email is required');
  }

  const status = await fetch(`${API_BASE}/api/flow-builder/access`);
  const accessInfo: FlowBuilderAccessStatus = status.ok
    ? await status.json()
    : { required: true, unlocked: false, email_required: true };

  if (accessInfo.required) {
    await unlockChat(password.trim());
  }

  setFlowBuilderEmail(trimmedEmail);

  const result = await fetchFlowBuilderAccess();
  if (!result.unlocked) {
    clearFlowBuilderSession();
    throw new Error('Could not unlock Flow Builder');
  }

  return result;
}

export const FLOW_BUILDER_AUTH_HEADERS = {
  password: 'X-Chat-Password',
  email: 'X-Flow-Builder-Email',
} as const;
