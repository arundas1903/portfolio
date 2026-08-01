import type { UrlStrengthResult } from '../types/urlStrength';
import { API_BASE, authHeaders } from './chatAuth';

export interface UrlStrengthLimits {
  limit: number;
  remaining: number;
  retry_after_seconds: number;
  ai_unlocked: boolean;
}

export async function fetchUrlStrengthLimits(): Promise<UrlStrengthLimits> {
  const response = await fetch(`${API_BASE}/api/url-strength/limits`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Could not load URL Strength limits');
  }

  return response.json() as Promise<UrlStrengthLimits>;
}

export async function analyzeUrlStrength(
  url: string,
  options: { useAi?: boolean } = {},
): Promise<UrlStrengthResult> {
  const response = await fetch(`${API_BASE}/api/url-strength/analyze`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ url, use_ai: options.useAi ?? false }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.detail;
    const message =
      response.status === 401
        ? 'Valid access password required for AI analysis.'
        : response.status === 429
          ? typeof detail === 'string'
            ? detail
            : 'Daily URL analysis limit reached (10 per day). Try again tomorrow.'
          : typeof detail === 'string'
            ? detail
            : Array.isArray(detail) && detail[0]?.msg
              ? detail[0].msg
              : 'Could not analyze URL';
    throw new Error(message);
  }

  return payload as UrlStrengthResult;
}
