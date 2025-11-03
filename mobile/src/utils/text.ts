export const stripSuggestion = (text?: string): string => {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/gs, '').trim();
};

export const truncateWords = (text = '', maxWords = 50): string => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
};

export const extractSuggestion = (text?: string): string | null => {
  if (!text) return null;
  try {
    const m = text.match(/\*\*(.*?)\*\*/s);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
};

export const generateNewSuggestion = (base?: string, genre?: string | null): string => {
  // If a genre is provided, prefer a genre-specific suggestion.
  const genreTemplates: Record<string, string[]> = {
    Fantasy: [
      'A young squire discovers a map that leads to a sleeping dragon.',
      'An apprentice mage must prove their worth with a forbidden spell.'
    ],
    'Sci-Fi': [
      'A technician wakes to find the station AI has rewritten the logs.',
      'A courier must deliver a package that alters reality in tiny ways.'
    ],
    Romance: [
      'Two rivals trade recipes and accidentally fall in love.',
      'A chance meeting on a rainy bridge rewires two lonely hearts.'
    ],
    Mystery: [
      'A detective receives anonymous postcards that predict the next crime.',
      'A small clue found in an attic slowly unravels a family secret.'
    ],
    Adventure: [
      'A ragtag crew follows a torn map across uncharted islands.',
      'A reluctant guide must escort an artifact through dangerous terrain.'
    ],
    Journey: [
      'An old woman sets out on one last pilgrimage with a hidden goal.',
      'A misfit caravan navigates a landscape that remembers your past.'
    ],
    Medieval: [
      'A blacksmith uncovers a blade with the names of kings etched on it.',
      'A castle scribe discovers a forbidden chronicle that predicts betrayals.'
    ],
    Historical: [
      'A letter from a soldier changes the course of a small town’s fate.',
      'An apprentice archivist finds a diary that rewrites a known history.'
    ],
    Thriller: [
      'A single phone call pulls a retired agent back into the shadows.',
      'Someone is watching; the protagonist finds a list with their name on it.'
    ],
    Horror: [
      'A town’s lights go out and the children remember things they shouldn’t.',
      'An old photograph bleeds at the edges when no one is looking.'
    ]
  };

  if (genre && genreTemplates[genre]) {
    const list = genreTemplates[genre];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (base && base.trim()) {
    // Use the base prompt as inspiration and rephrase a fresh suggestion
    const short = base.split(/\.|\n/)[0].trim();
    return `Try a new story about ${short}.`;
  }

  const examples = [
    'A lighthouse keeper receives a message in a bottle that changes everything.',
    'An apprentice magician must perform one trick to save their village.',
    'A forgotten map resurfaces, pointing to a secret that should have stayed buried.',
    'A pair of rival bakers discover a recipe that grants memory of past lives.'
  ];
  return examples[Math.floor(Math.random() * examples.length)];
};

export const formatDateLong = (iso?: string | null): string | null => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const month = d.toLocaleString(undefined, { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    const suffix = (() => {
      const v = day % 100;
      if (v >= 11 && v <= 13) return 'th';
      switch (day % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    })();
    return `${month} ${day}${suffix}, ${year}`;
  } catch {
    return null;
  }
};

// Text formatting utilities for styled content
export interface FormattedSegment {
  text: string;
  type: 'normal' | 'bold' | 'italic';
}

export const parseFormattedText = (text: string): FormattedSegment[] => {
  if (!text) return [];

  const segments: FormattedSegment[] = [];
  let remaining = text;

  // Pattern matches: `bold` or _italic_
  const formatPattern = /(`[^`]+`|_[^_]+_)/g;

  let lastIndex = 0;
  let match;

  const regex = new RegExp(formatPattern);
  while ((match = regex.exec(text)) !== null) {
    // Add normal text before this match
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        type: 'normal'
      });
    }

    const matched = match[0];
    if (matched.startsWith('`') && matched.endsWith('`')) {
      segments.push({
        text: matched.slice(1, -1),
        type: 'bold'
      });
    } else if (matched.startsWith('_') && matched.endsWith('_')) {
      segments.push({
        text: matched.slice(1, -1),
        type: 'italic'
      });
    }

    lastIndex = match.index + matched.length;
  }

  // Add remaining normal text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'normal'
    });
  }

  return segments;
};
