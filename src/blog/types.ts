export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  accent: string;
  liveDemo?: string;
  liveDemoTitle?: string;
  liveDemoDescription?: string;
  liveDemoButtonLabel?: string;
  content: BlogBlock[];
}
