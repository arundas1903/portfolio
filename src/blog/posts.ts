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

const portfolioIn15MinutesContent: BlogBlock[] = [
  {
    type: 'p',
    text: 'I wanted a personal portfolio site—something clean, fast, and credible enough to send to hiring managers, customers, and friends. Not a weekend project. Not a “I’ll finish it later” Notion page. A real site on a real domain.',
  },
  {
    type: 'p',
    text: 'I gave myself fifteen minutes. That sounds like a stunt until you realize most of the time in a greenfield project isn’t typing—it’s deciding what to build, hunting for boilerplate, wiring deployment, and fixing the boring glue between services. Cursor and AI collapse a lot of that glue work if you show up with intent.',
  },
  {
    type: 'p',
    text: 'This is the story of how arundas.me went from zero to live in about fifteen minutes—and what I learned about using AI as an operator, not just a code generator.',
  },
  { type: 'h2', text: 'My path to Cursor' },
  {
    type: 'p',
    text: 'I didn’t start with “let AI build my site.” I started with a workflow problem: I know product and systems, but I don’t always want to spend hours on scaffolding, CSS polish, and deployment checklists for something that should be simple.',
  },
  {
    type: 'ul',
    items: [
      'I’d used ChatGPT and Copilot for snippets, but they lacked full-project context',
      'I wanted an agent that could edit files, run commands, and iterate in-repo',
      'Cursor felt like the right step: VS Code familiarity + codebase-aware AI + terminal access',
      'The mental shift: describe outcomes, review diffs, steer—not micromanage every line',
    ],
  },
  {
    type: 'p',
    text: 'The first win wasn’t speed. It was momentum. Instead of stopping at “what folder structure should I use?”, I could say “scaffold a React portfolio with an iOS-inspired glass UI” and get a working baseline in one pass.',
  },
  { type: 'h2', text: 'The fifteen-minute plan' },
  {
    type: 'p',
    text: 'Before opening Cursor, I wrote a tight scope on a sticky note—literally four bullets:',
  },
  {
    type: 'ul',
    items: [
      'Single-page portfolio: hero, about, projects, blog, contact',
      'Deploy frontend to GitHub Pages from main',
      'Add a custom domain from GoDaddy',
      'Keep backend optional for later (chat APIs on Render)',
    ],
  },
  {
    type: 'p',
    text: 'Constraints are an AI superpower. Vague prompts produce vague sites. Specific prompts produce shippable diffs.',
  },
  { type: 'h2', text: 'Minute 0–5: Scaffold the site in Cursor' },
  {
    type: 'p',
    text: 'I opened Cursor on an empty folder and asked for a React + TypeScript portfolio with routing, a modern layout, and GitHub Pages compatibility. The agent generated the project structure, base components, and styling tokens.',
  },
  {
    type: 'p',
    text: 'What I did manually: skim the diff, reject anything over-engineered, and keep the design direction (“glass cards, calm typography, mobile-first”). What AI did well: file creation, imports, route wiring, and repetitive JSX.',
  },
  {
    type: 'ul',
    items: [
      'Created pages for Home, Projects, Blog, and Contact',
      'Added reusable UI primitives instead of one-off styles',
      'Set homepage/base path correctly for GitHub Pages',
      'Ran the dev server and fixed build errors in-loop',
    ],
  },
  {
    type: 'p',
    text: 'Lesson: treat the first pass as a draft you can steer. The goal in minute five isn’t perfection—it’s a build that compiles and looks like a portfolio.',
  },
  { type: 'h2', text: 'Minute 5–8: GitHub and CI' },
  {
    type: 'p',
    text: 'Next I pushed to GitHub and wired deployment. I asked Cursor to add a GitHub Actions workflow that builds on every push to main and publishes to GitHub Pages.',
  },
  {
    type: 'ul',
    items: [
      'Initialize git, create repo, push main',
      'Add workflow: install → build → deploy artifact',
      'Enable Pages from Actions in repo settings',
      'Verify the default *.github.io URL loads the site',
    ],
  },
  {
    type: 'p',
    text: 'This is where AI saves more time than autocomplete ever could. I didn’t have to remember the exact Actions YAML shape or Pages permission flags—I described the outcome and reviewed the pipeline like a PR.',
  },
  {
    type: 'p',
    text: 'Lesson: deployment is part of the product. If it’s not automated on push, you’ll hesitate to ship content updates later.',
  },
  { type: 'h2', text: 'Minute 8–11: GoDaddy domain and DNS' },
  {
    type: 'p',
    text: 'I bought arundas.me on GoDaddy and connected it to GitHub Pages. This is usually the step that breaks beginners—not because DNS is magic, but because the UI is confusing and docs are scattered.',
  },
  {
    type: 'p',
    text: 'I used AI as a checklist operator: “I own arundas.me on GoDaddy and host on GitHub Pages—what DNS records do I need?” Then I applied the answer in GoDaddy’s DNS panel.',
  },
  {
    type: 'ul',
    items: [
      'Add apex/root records pointing to GitHub Pages IPs (or use recommended A records)',
      'Add www CNAME to your GitHub Pages hostname',
      'In GitHub repo settings, set the custom domain and enforce HTTPS',
      'Wait for propagation (often minutes, sometimes longer)',
    ],
  },
  {
    type: 'p',
    text: 'The site was live on a custom domain before the coffee cooled. That moment—typing your name and seeing your work—is underrated.',
  },
  {
    type: 'p',
    text: 'Lesson: AI is excellent at turning platform-specific docs into a numbered checklist. You still click the buttons; it removes the “which tab was that in?” tax.',
  },
  { type: 'h2', text: 'Minute 11–15: Render for the backend' },
  {
    type: 'p',
    text: 'The static portfolio was done. I still wanted interactive assistants (Faith Discuss, A2P chat, Movie Discuss), which meant a small FastAPI backend with secrets, rate limits, and CORS.',
  },
  {
    type: 'p',
    text: 'Render was the fastest path: connect the GitHub repo, deploy the backend folder as a web service, set environment variables, and point the frontend API base URL at the Render URL.',
  },
  {
    type: 'ul',
    items: [
      'Create a Render web service from the backend directory',
      'Set OPENAI_API_KEY, chat password, CORS origins, and rate limits',
      'Add health checks and confirm /api routes respond',
      'Update frontend env/config to call the Render API in production',
    ],
  },
  {
    type: 'p',
    text: 'Within the same session, the portfolio went from static brochure to interactive product surface. That’s the part that would’ve taken me another evening without an agent handling boilerplate and config files.',
  },
  {
    type: 'p',
    text: 'Lesson: split frontend and backend deploy targets early. GitHub Pages for static assets; Render (or similar) for anything with secrets or compute.',
  },
  { type: 'h2', text: 'What I learned' },
  {
    type: 'p',
    text: 'Fifteen minutes isn’t a flex about typing speed. It’s proof that the bottleneck moved from “implementation” to “judgment.”',
  },
  {
    type: 'ul',
    items: [
      'Start with outcomes and constraints, not tools',
      'Review AI output like a senior engineer reviewing a junior PR',
      'Automate deploy on push or you won’t iterate on content',
      'DNS and hosting are shippable skills—AI just makes them less intimidating',
      'The best portfolio isn’t the prettiest template; it’s the one that’s live',
      'You can add depth later (blog posts, MCP servers, chatbots) because the pipeline exists',
    ],
  },
  {
    type: 'p',
    text: 'Since that first fifteen minutes, this site has grown: A2P Atlas, an MCP server, Movie Discuss, per-assistant rate limits, and blog posts like this one. The initial scaffold didn’t predict all of that—and it didn’t need to. It created a runway.',
  },
  {
    type: 'p',
    text: 'If you’re waiting for the perfect portfolio, ship the imperfect one today. Cursor won’t replace your taste or your product thinking—but it will get you to “live on my domain” faster than you expect.',
  },
];

const urlStrengthContent: BlogBlock[] = [
  {
    type: 'p',
    text: 'You get a link in Slack, a text, or an email: “Verify your account.” The domain looks almost right. Maybe it redirects once or twice. You could open it and hope—or you could run a quick sanity check first.',
  },
  {
    type: 'p',
    text: 'I built URL Strength for that moment. It’s a URL trust checker on my portfolio: paste a link and get domain age, stack fingerprints, spam-like heuristics, and an AI-written risk summary. It is not a URL shortener—it does not create or redirect links. It inspects them.',
  },
  { type: 'h2', text: 'Why I built it' },
  {
    type: 'p',
    text: 'Most “is this link safe?” tools are either opaque black boxes or static blocklists. I wanted something in between: transparent signals you can read, plus an LLM layer that synthesizes them into plain language—without claiming certainty.',
  },
  {
    type: 'ul',
    items: [
      'Phishing pages often use brand names in the title but not in the domain',
      'Very new domains show up constantly in scam campaigns',
      'Redirect chains hide the final destination until you click',
      'A portfolio is a good place to demo full-stack product thinking—not just UI polish',
    ],
  },
  {
    type: 'p',
    text: 'URL Strength also let me exercise patterns I use elsewhere on the site: password-gated AI features, per-tool rate limits, Mixpanel events, and a FastAPI service that does real network work safely.',
  },
  { type: 'h2', text: 'What you get when you analyze a URL' },
  {
    type: 'p',
    text: 'Paste a bare domain like arundas.me or a full https:// link. The app returns a risk level (low, medium, or high), a short summary, reasons behind the score, and a practical recommendation.',
  },
  {
    type: 'ul',
    items: [
      'Domain age from RDAP registration data (with registry fallbacks when needed)',
      'Technical signals: final URL, redirect count, HTTPS, HTTP status, page title, login-form detection',
      'Technology fingerprints: server headers, WordPress, Next.js, React, Cloudflare, and similar',
      'Heuristic spam flags: urgency phrases, brand/domain mismatches on credential pages',
      'Token usage when OpenAI runs the synthesis step',
    ],
  },
  {
    type: 'p',
    text: 'The UI is explicit that this is guidance—not a guarantee. That honesty matters for trust products.',
  },
  { type: 'h2', text: 'How it’s built: backend pipeline' },
  {
    type: 'p',
    text: 'The backend lives under backend/app/services/url_strength/ as four focused modules plus a FastAPI router.',
  },
  {
    type: 'ul',
    items: [
      'fetcher.py — normalizes input (adds https:// when missing), resolves DNS, blocks private/local hosts (SSRF protection), follows up to five redirects manually, and extracts title, meta description, and login/password forms from HTML',
      'rdap.py — looks up domain registration via IANA’s RDAP bootstrap, then tries registry-specific bases (Identity Digital, Google, rdap.nic.{tld}) and rdap.org as fallback',
      'signals.py — combines RDAP age, technology detection from headers/HTML, technical signal cards, and heuristic spam flags',
      'analyzer.py — sends structured signals to OpenAI for JSON risk assessment; falls back to pure heuristics when no API key is configured',
    ],
  },
  {
    type: 'p',
    text: 'The router exposes POST /api/url-strength/analyze and GET /api/url-strength/limits. Both require the same portfolio access password as my chat assistants (X-Chat-Password header). Analysis is rate-limited to 10 runs per IP per rolling 24 hours by default—configurable via URL_STRENGTH_DAILY_LIMIT.',
  },
  { type: 'h2', text: 'How it’s built: frontend' },
  {
    type: 'p',
    text: 'The React page at /url-strength reuses ChatPasswordGate for access control, then shows a simple URL form and a results layout built from GlassCard panels.',
  },
  {
    type: 'ul',
    items: [
      'UrlStrengthPage.tsx — password gate, quota banner, analyze form, and results sections (assessment, reasons, content read, technical signals, technologies, usage metadata)',
      'api/urlStrength.ts — typed client for analyze and limits endpoints, sharing authHeaders() with chat',
      'types/urlStrength.ts — response shapes for risk level, signals, and token counts',
      'url-strength.css — risk badge colors, signal grid, and panel spacing',
    ],
  },
  {
    type: 'p',
    text: 'Mixpanel tracks URL Strength Analyze events with risk level, token count, and whether the source was openai or heuristic—useful when tuning prompts or limits.',
  },
  { type: 'h2', text: 'Design choices I cared about' },
  {
    type: 'p',
    text: 'SSRF guardrails first: the fetcher refuses localhost, .local, .internal, and any hostname that resolves to a non-public IP. You cannot use my server to scan your internal network.',
  },
  {
    type: 'p',
    text: 'Graceful degradation: without OPENAI_API_KEY, the tool still runs heuristics and returns useful signals—just with a lower-confidence summary.',
  },
  {
    type: 'p',
    text: 'Domain age reliability: RDAP is messy across TLDs, so the lookup chain tries multiple registries instead of failing on the first 404.',
  },
  {
    type: 'p',
    text: 'Cost control: password gate + daily cap keep a public demo from becoming an open proxy for unlimited OpenAI calls.',
  },
  { type: 'h2', text: 'Try it on a link you’re unsure about' },
  {
    type: 'p',
    text: 'Open URL Strength, enter the portfolio password if prompted, and paste a URL. Compare the technical signals with the AI summary. If they disagree, trust the signals—the model is synthesizing, not fetching.',
  },
  {
    type: 'p',
    text: 'That loop—fetch safely, extract signals, explain risk in human terms—is the product. It’s the kind of small tool I like shipping on a portfolio: useful, bounded, and honest about what it can and cannot prove.',
  },
];

export const FEATURED_BLOG_COUNT = 3;

export const blogPosts: BlogPost[] = [
  {
    slug: 'url-strength-trust-checker',
    title: 'URL Strength: Why I Built a URL Trust Checker (and How It Works)',
    excerpt:
      'Paste a link to inspect domain age, tech fingerprints, spam heuristics, and an AI risk summary—built with FastAPI, RDAP, OpenAI, and the same guardrails as my portfolio chat tools.',
    date: '2026-08-01',
    readTime: estimateReadTime(urlStrengthContent),
    tags: ['AI', 'Security', 'FastAPI'],
    accent: 'var(--color-accent-teal)',
    liveDemo: '/url-strength',
    liveDemoTitle: 'Try URL Strength',
    liveDemoDescription:
      'Analyze a URL for domain age, detected technologies, heuristic spam flags, and an AI-written risk assessment.',
    liveDemoButtonLabel: 'Open URL Strength',
    content: urlStrengthContent,
  },
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
    slug: 'portfolio-in-15-minutes-with-cursor',
    title: 'How I Built This Portfolio in 15 Minutes with Cursor (and What I Learned)',
    excerpt:
      'From zero to arundas.me in fifteen minutes—scaffolding with Cursor, deploying on GitHub Pages, pointing GoDaddy DNS, and wiring a Render backend, all with AI as the operator.',
    date: '2026-07-25',
    readTime: estimateReadTime(portfolioIn15MinutesContent),
    tags: ['Cursor', 'AI', 'GitHub', 'GoDaddy'],
    accent: 'var(--color-accent-indigo)',
    liveDemo: '/',
    liveDemoTitle: 'Visit the site',
    liveDemoDescription:
      'The portfolio that came out of that fifteen-minute session—now with projects, blog posts, and interactive AI assistants.',
    liveDemoButtonLabel: 'Open portfolio',
    content: portfolioIn15MinutesContent,
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
