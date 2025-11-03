/**
 * Per-genre theme configuration.
 * Maps genre names to accent colors and (eventually) background images.
 * Designed to scale: add image URIs and caching later.
 */

export interface GenreTheme {
  color: string;
  icon: string;
  description: string;
  imageUri?: string; // placeholder for future image asset
}

export const genreThemes: Record<string, GenreTheme> = {
  Fantasy: {
    color: '#7C3AED', // violet
    icon: 'wand-plus',
    description: 'Magic, quests, and otherworldly realms'
  },
  'Sci-Fi': {
    color: '#06B6D4', // cyan
    icon: 'rocket-launch',
    description: 'Future tech and cosmic adventures'
  },
  Romance: {
    color: '#EC4899', // pink
    icon: 'heart',
    description: 'Love, connection, and tender moments'
  },
  Mystery: {
    color: '#8B5CF6', // purple
    icon: 'magnify',
    description: 'Secrets, clues, and hidden truths'
  },
  Adventure: {
    color: '#F59E0B', // amber
    icon: 'compass',
    description: 'Journeys, challenges, and discovery'
  },
  Journey: {
    color: '#10B981', // emerald
    icon: 'map',
    description: 'Roads traveled and lives transformed'
  },
  Medieval: {
    color: '#6366F1', // indigo
    icon: 'chess-knight',
    description: 'Castles, knights, and ancient lore'
  },
  Historical: {
    color: '#78350F', // amber-950
    icon: 'scroll-text',
    description: 'True events and bygone eras'
  },
  Thriller: {
    color: '#DC2626', // red
    icon: 'flash',
    description: 'Suspense, danger, and high stakes'
  },
  Horror: {
    color: '#1F2937', // gray-800
    icon: 'ghost',
    description: 'Fear, mystery, and the unknown'
  }
};

/**
 * Get theme by genre name. Falls back to a neutral theme if genre not found.
 */
export const getGenreTheme = (genre?: string | null): GenreTheme => {
  if (!genre || !genreThemes[genre]) {
    return {
      color: '#6B7280', // gray-500
      icon: 'book-open-variant',
      description: 'A tale waiting to be told'
    };
  }
  return genreThemes[genre];
};
