import { chatDeepLink } from '../utils/chatDeepLink';

export interface Project {
  title: string;
  description: string;
  icon: string;
  technologies: string[];
  accent: string;
  liveDemo?: string;
}

export const FEATURED_PROJECT_COUNT = 3;

export const projects: Project[] = [
  {
    title: 'Movie Discuss',
    description:
      'Interactive movie assistant that learns your taste, saves your reviews, and recommends films based on what you enjoy—not just what’s trending.',
    icon: '🎬',
    technologies: ['AI', 'OpenAI', 'TMDB', 'FastAPI'],
    accent: 'var(--color-accent-purple)',
    liveDemo: chatDeepLink('movie-discuss'),
  },
  {
    title: 'Daily Task Tracker',
    description:
      'Google Keep–style daily notes with date-linked history, labels, and an AI task analyzer that extracts priorities and action items from your notes.',
    icon: '📝',
    technologies: ['React', 'FastAPI', 'OpenAI', 'SQLite'],
    accent: 'var(--color-accent-yellow)',
    liveDemo: '/task-tracker',
  },
  {
    title: 'URL Strength',
    description:
      'Paste a link to inspect domain age, stack fingerprints, spam-like heuristics, and an AI risk summary with token usage.',
    icon: '🔗',
    technologies: ['FastAPI', 'OpenAI', 'RDAP', 'React'],
    accent: 'var(--color-accent-teal)',
    liveDemo: '/url-strength',
  },
  {
    title: 'A2P Regulatory MCP',
    description:
      'Model Context Protocol server for AI-assisted A2P SMS regulatory intelligence — country lookup, registration rules, and onboarding guidance across 190+ markets.',
    icon: '📡',
    technologies: ['MCP', 'A2P SMS', 'CPaaS', 'Python'],
    accent: 'var(--color-accent-cyan)',
    liveDemo: '/a2p-regulatory-mcp',
  },
  {
    title: 'A2P Atlas',
    description:
      'Interactive world map of A2P SMS origination support by country — alphanumeric sender IDs, short codes, long codes, and toll-free numbers.',
    icon: '🌍',
    technologies: ['CPaaS', 'A2P SMS', 'Regulatory', 'Maps'],
    accent: 'var(--color-accent-teal)',
    liveDemo: '/a2p-atlas',
  },
  {
    title: 'Enterprise SMS and Email Platform',
    description:
      'Scalable messaging platform for enterprise clients, delivering high-volume SMS and email with analytics, routing, and reliability at scale.',
    icon: '📱',
    technologies: ['CPaaS', 'SMS', 'Email', 'Enterprise'],
    accent: 'var(--color-accent-blue)',
  },
  {
    title: 'CRM Integration Framework',
    description:
      'Flexible integration layer connecting multiple CRM platforms with unified APIs, reducing integration time and improving data sync.',
    icon: '⚡',
    technologies: ['CRM', 'API Integration', 'Data Sync'],
    accent: 'var(--color-accent-teal)',
  },
];
