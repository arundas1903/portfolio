export interface MovieUserProfile {
  email: string;
  interests: Record<string, unknown>;
  onboarding_complete: boolean;
}

export interface MovieChatResponse {
  reply: string;
  onboarding_complete: boolean;
  interests: Record<string, unknown>;
  saved_perspective?: string | null;
  movie_context?: string | null;
}

export interface MovieChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
