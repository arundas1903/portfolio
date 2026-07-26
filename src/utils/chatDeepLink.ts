import type { ChatbotId } from '../components/chatbots/catalog';

export const CHAT_QUERY_PARAM = 'chat';

export function chatDeepLink(assistant: ChatbotId | 'open' = 'open'): string {
  return `?${CHAT_QUERY_PARAM}=${assistant}`;
}
