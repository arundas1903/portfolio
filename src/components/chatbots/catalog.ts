export type ChatbotId = 'faith-discuss' | 'coming-soon';

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
    id: 'coming-soon',
    title: 'Coming soon',
    subtitle: 'More assistants on the way',
    available: false,
    icon: '✨',
  },
];
