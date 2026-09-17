/** Static site metadata and the primary navigation model. */

export const SITE = {
  name: 'AI Mathematics Research Lab',
  short: 'AI Math Lab',
  tagline:
    'The mathematical foundations of modern AI — from probability to optimization, learning theory, deep learning and LLM systems.',
  description:
    'An interactive mathematical laboratory: rigorous theory, complete proofs, reproducible numerical experiments and a problem database, from undergraduate foundations to research level.',
  repo: 'https://github.com/theFulminatedHuman/vedantbhardwaj.github.io',
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Shown in the command palette and on hover. */
  hint?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Sections that are not per-field. Field links are generated from content. */
export const PRIMARY_NAV: NavSection[] = [
  {
    label: 'Start',
    items: [
      { href: '/', label: 'Home' },
      { href: '/dashboard', label: 'Dashboard', hint: 'Your progress and today’s work' },
      { href: '/learn', label: 'Learning Path', hint: 'Level 0 → research, in order' },
      { href: '/daily', label: 'Daily Mathematics', hint: 'Four problems, chosen for today' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/problems', label: 'Problems', hint: 'Filterable problem database' },
      { href: '/abyss', label: 'The Abyss', hint: 'The hardest problems on the site' },
      { href: '/proofs', label: 'Proof Library', hint: 'Every theorem, searchable' },
      { href: '/experiments', label: 'Experiments', hint: 'Reproducible simulations' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/papers', label: 'Research Papers', hint: 'Paper → mathematics breakdowns' },
      { href: '/topics', label: 'All Topics' },
      { href: '/graph', label: 'Mastery Graph', hint: 'Prerequisite dependency graph' },
      { href: '/progress', label: 'Progress', hint: 'Contribution heatmap and statistics' },
    ],
  },
];
