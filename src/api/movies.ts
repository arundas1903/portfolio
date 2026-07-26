import type { MovieChatMessage, MovieChatResponse, MovieUserProfile } from '../types/movies';
import type { ChatLimits } from './chatAuth';
import { API_BASE } from './chatAuth';

const TOKEN_KEY = 'movie-discuss-token';
const EMAIL_KEY = 'movie-discuss-email';
const CLIENT_ID_KEY = 'movie-discuss-client-id';

export function getMovieClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

export function getMovieToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredMovieEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function setMovieSession(token: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearMovieSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function movieHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getMovieToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function startMovieSession(email: string): Promise<{ token: string; user: MovieUserProfile }> {
  const response = await fetch(`${API_BASE}/api/movies/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, client_id: getMovieClientId() }),
  });

  if (response.status === 403) {
    const error = await response.json().catch(() => ({ detail: 'Email not allowed on this browser or network' }));
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Email not allowed on this browser or network');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Could not start session');
  }

  const result = await response.json();
  setMovieSession(result.token, result.user.email);
  return result;
}

export async function fetchMovieLimits(): Promise<ChatLimits> {
  const response = await fetch(`${API_BASE}/api/movies/limits`, {
    headers: movieHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load chat limits');
  }
  return response.json();
}

export async function fetchMovieProfile(): Promise<MovieUserProfile> {
  const response = await fetch(`${API_BASE}/api/movies/me`, {
    headers: movieHeaders(),
  });

  if (response.status === 401) {
    clearMovieSession();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('Could not load profile');
  }

  const result = await response.json();
  return result.user;
}

export async function sendMovieMessage(
  message: string,
  history: MovieChatMessage[],
): Promise<MovieChatResponse> {
  const response = await fetch(`${API_BASE}/api/movies/chat`, {
    method: 'POST',
    headers: movieHeaders(),
    body: JSON.stringify({ message, history }),
  });

  if (response.status === 401) {
    clearMovieSession();
    throw new Error('Session expired. Please sign in again.');
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
