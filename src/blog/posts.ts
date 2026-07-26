import type { BlogBlock, BlogPost } from './types';

const WORDS_PER_MINUTE = 200;

function estimateReadTime(blocks: BlogBlock[]): string {
  const words = blocks.reduce((count, block) => {
    if (block.type === 'ul') {
      return count + block.items.join(' ').split(/\s+/).filter(Boolean).length;
    }
    return count + block.text.split(/\s+/).filter(Boolean).length;
  }, 0);
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

const movieDiscussContent: BlogBlock[] = [
  {
    type: 'p',
    text: 'Most streaming apps optimize for “what’s trending.” That works until you realize two people with completely different tastes can both feel underserved by the same homepage.',
  },
  {
    type: 'p',
    text: 'I built Movie Discuss as a portfolio assistant to explore a different product shape: a conversational guide that learns your taste, remembers what you thought about films you’ve seen, and compares your view with broader public sentiment.',
  },
  { type: 'h2', text: 'The product problem' },
  {
    type: 'p',
    text: 'Choosing a movie is a recurring micro-decision. The friction isn’t lack of content—it’s lack of context. People want recommendations that reflect their mood, not just global popularity.',
  },
  {
    type: 'ul',
    items: [
      'Discovery fatigue from endless catalogs with weak personalization',
      'No easy way to capture “I liked it because…” after watching something',
      'Public review scores without a personal anchor for comparison',
      'Repeat conversations with friends asking “what should we watch?”',
    ],
  },
  { type: 'h2', text: 'What Movie Discuss does' },
  {
    type: 'p',
    text: 'Movie Discuss is an interactive assistant on my portfolio site. You sign in with an email, talk through your tastes on first visit, and get recommendations grounded in that profile.',
  },
  {
    type: 'p',
    text: 'When you discuss a film you watched, the assistant pulls public review context (via TMDB when configured), saves your perspective, and uses both to improve future suggestions.',
  },
  {
    type: 'ul',
    items: [
      'Onboarding conversation to learn genres, moods, and avoid lists',
      'Personalized recommendations tied to stored taste—not generic lists',
      'Post-watch discussions that compare your take with critic/user sentiment',
      'Persistent memory so return visits feel continuous, not reset',
    ],
  },
  { type: 'h2', text: 'Design choices I cared about' },
  {
    type: 'p',
    text: 'Lightweight identity: email-only sign-in, with one address bound per browser and network so profiles stay consistent without heavy auth.',
  },
  {
    type: 'p',
    text: 'Separate rate limits per assistant (20 messages per 30 minutes) so Movie Discuss doesn’t compete with my other portfolio chatbots for quota.',
  },
  {
    type: 'p',
    text: 'Structured memory: taste profiles and movie perspectives live in SQLite, while the LLM handles conversation—not the other way around.',
  },
  { type: 'h2', text: 'Why this belongs in a portfolio' },
  {
    type: 'p',
    text: 'It’s not just a chat UI demo. It shows product thinking across identity, memory, rate limiting, external APIs, and conversational UX— packaged as something visitors can actually try.',
  },
  {
    type: 'p',
    text: 'Open the assistant, tell it what you enjoy, ask for a recommendation, or debrief a film you watched last night. That loop—learn, suggest, reflect, remember—is the product.',
  },
];

const a2pAtlasContent: BlogBlock[] = [
  {
    type: 'p',
    text: 'Every A2P business hits the same wall when it tries to grow internationally: the product works, the API is stable, and the customer is ready to launch—then someone asks, “Can we send OTPs from an alphanumeric sender in Brazil?”',
  },
  {
    type: 'p',
    text: 'That question sounds simple. Answering it accurately is not. Origination rules vary by country, by channel (alphanumeric, short code, long code, toll-free), and by use case. The answer lives across carrier docs, provider country tables, compliance PDFs, and the institutional memory of whoever handled the last similar deal.',
  },
  {
    type: 'p',
    text: 'I built A2P Atlas because that friction shows up in every CPaaS org I’ve worked in—not as a technical bug, but as a product and go-to-market problem.',
  },
  { type: 'h2', text: 'The problem A2P teams actually face' },
  {
    type: 'p',
    text: 'A2P (Application-to-Person) messaging is a scale business. Revenue grows when customers send more messages to more countries. But each new market introduces regulatory risk, delivery uncertainty, and pre-sales complexity that slows deals down.',
  },
  {
    type: 'ul',
    items: [
      'Sales quotes timelines without knowing a country requires sender ID pre-registration',
      'Solutions engineers rebuild the same country research for every RFP',
      'Product teams discover channel gaps late—after a customer has already integrated',
      'Compliance flags issues post-launch, when changes are expensive and visible',
      'Support inherits tickets that are really “we never validated origination for this route”',
    ],
  },
  {
    type: 'p',
    text: 'The cost isn’t just a wrong answer. It’s a slipped launch date, a reworked integration, a lost enterprise deal, or messages that silently fail delivery tests in production.',
  },
  { type: 'h2', text: 'What product leaders should optimize for' },
  {
    type: 'p',
    text: 'From a product manager’s lens, country-level origination data is not documentation—it’s decision infrastructure. The goal is to move regulatory clarity earlier in the funnel so the business can commit with confidence.',
  },
  {
    type: 'ul',
    items: [
      'Reduce time-to-answer in pre-sales from days to minutes',
      'Make market expansion a repeatable process, not a hero-driven investigation',
      'Align sales promises with what the platform can actually originate today',
      'Give compliance and solutions a shared source of truth before build starts',
    ],
  },
  {
    type: 'p',
    text: 'When that data is scattered, the organization pays in coordination tax. When it’s accessible, teams spend energy on differentiation—routing, deliverability, UX, analytics—not on reconstructing basics.',
  },
  { type: 'h2', text: 'What A2P Atlas solves' },
  {
    type: 'p',
    text: 'A2P Atlas is an interactive world map of A2P SMS origination support by country. Pick a channel—alphanumeric sender ID, short code, long code, or toll-free—and see at a glance where that origination model is supported, restricted, or not available.',
  },
  {
    type: 'p',
    text: 'Click a country and you get a structured view of channel support, plus context like two-way SMS and international sending where data exists. It turns a research sprint into a self-serve lookup.',
  },
  {
    type: 'ul',
    items: [
      'Sales & BD: qualify opportunities faster and set realistic launch expectations',
      'Solutions & pre-sales: scope integrations without opening five tabs of PDFs',
      'Product: prioritize country and channel roadmap based on demand vs. feasibility',
      'Compliance & ops: spot registration-heavy markets before contracts are signed',
      'Engineering: fewer “quick checks” that interrupt sprint work',
    ],
  },
  { type: 'h2', text: 'How to use it in your workflow' },
  {
    type: 'p',
    text: 'Treat the map as the first step in any country expansion conversation—not the last compliance check.',
  },
  {
    type: 'ul',
    items: [
      'Deal qualification: confirm the customer’s target countries and preferred sender type before committing dates',
      'Launch planning: identify registration-required markets early and bake lead time into the project plan',
      'Roadmap input: cluster “high demand, blocked channel” countries as product investment candidates',
      'Customer onboarding: set delivery expectations before API keys are issued',
    ],
  },
  {
    type: 'p',
    text: 'The map compiles data from AWS End User Messaging SMS country tables and Twilio alphanumeric sender references. It’s a starting point for decisions—always validate with your provider and local counsel before production traffic.',
  },
  { type: 'h2', text: 'Why this matters for A2P businesses' },
  {
    type: 'p',
    text: 'A2P winners don’t just send messages reliably—they help customers launch in new markets predictably. Regulatory clarity is part of the product experience, whether you expose it in a dashboard or not.',
  },
  {
    type: 'p',
    text: 'A2P Atlas packages that clarity into something a PM can point sales toward, a solutions engineer can use on a call, and a leadership team can trust in planning discussions. Less guessing. Fewer surprises. Faster path from “Can we?” to “Here’s how.”',
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'movie-discuss-interactive-assistant',
    title: 'Movie Discuss: A Conversational Guide That Remembers Your Taste',
    excerpt:
      'How an interactive movie assistant learns preferences, saves your take on films, and uses public sentiment to improve recommendations over time.',
    date: '2026-07-26',
    readTime: estimateReadTime(movieDiscussContent),
    tags: ['AI', 'Product', 'Movies'],
    accent: 'var(--color-accent-purple)',
    liveDemo: '/?chat=movie-discuss',
    liveDemoTitle: 'Try Movie Discuss',
    liveDemoDescription:
      'Open the assistant, share your taste, and get recommendations—or talk through a film you watched and compare your view with public reviews.',
    liveDemoButtonLabel: 'Open Movie Discuss',
    content: movieDiscussContent,
  },
  {
    slug: 'a2p-atlas-regulatory-map',
    title: 'A2P Atlas: Stop Guessing Which Countries You Can Text From',
    excerpt:
      'How a regulatory map helps A2P businesses de-risk market expansion, shorten sales cycles, and align product, sales, and compliance before a single message is sent.',
    date: '2026-07-25',
    readTime: estimateReadTime(a2pAtlasContent),
    tags: ['A2P SMS', 'CPaaS', 'Product Strategy'],
    accent: 'var(--color-accent-teal)',
    liveDemo: '/a2p-atlas',
    liveDemoTitle: 'Explore the map',
    liveDemoDescription:
      'See A2P SMS origination support by country across alphanumeric, short code, long code, and toll-free channels.',
    liveDemoButtonLabel: 'Open A2P Atlas',
    content: a2pAtlasContent,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function formatBlogDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
