export type ChatbotId = 'faith-discuss' | 'a2p-regulatory';

export interface ChatbotOption {
  id: ChatbotId;
  title: string;
  subtitle: string;
  available: boolean;
  icon: string;
}

export const CHATBOTS: ChatbotOption[] = [
  {
    id: 'faith-discuss',
    title: 'Faith Discussion',
    subtitle: 'Bible · Quran · Hindu scriptures',
    available: true,
    icon: '🕊️',
  },
  {
    id: 'a2p-regulatory',
    title: 'A2P Regulatory Intel',
    subtitle: '190+ countries · onboarding guidance',
    available: true,
    icon: '📡',
  },
];
