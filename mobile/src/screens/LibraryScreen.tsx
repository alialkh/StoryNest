import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme, Chip } from 'react-native-paper';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { AppScaffold, type SidebarAction } from '../components/AppScaffold';
import { useAuthStore } from '../store/authStore';

/**
 * Props for LibraryScreen component
 * 
 * @interface Props
 * @property {() => void} onBack - Callback to navigate back to previous screen
 * @property {(story: Story) => void} onContinueStory - Callback when "Continue" button pressed on a story card
 *                                                       Navigates to Continuation/editing screen
 * @property {(story: Story) => void} onViewStory - Callback when clicking story title/body
 *                                                   Should navigate to view/continue screen (same as onContinueStory)
 *                                                   NOTE: Do NOT navigate to community StoryDetail screen!
 *                                                   Personal library stories are different from public feed stories.
 */
interface Props {
  onBack: () => void;
  onContinueStory: (story: Story) => void;
  onViewStory: (story: Story) => void;
}

/**
 * LibraryScreen - Displays user's personal story library with favorites feature
 * 
 * Features:
 * - View all personal stories in paginated card list
 * - Filter between "All Stories" and "Favorites" tabs
 * - Mark/unmark stories as favorites with heart icon
 * - Continue editing any story
 * - Share stories to community
 * - Click story title/body to view full content
 * 
 * State Management:
 * - Uses Zustand store for persistent story and favorites data
 * - Maintains local favoriteStoryIds Set for O(1) lookup
 * - Separates fetch logic from UI update logic to prevent infinite loops
 * 
 * Important: This screen handles PERSONAL stories, not community/public stories.
 * Navigation should always go to Continuation screen, never to StoryDetail screen.
 */
export const LibraryScreen: React.FC<Props> = ({ onBack, onContinueStory, onViewStory }) => {
  // Zustand store selectors - all trigger re-renders on change
  const stories = useStoryStore((state) => state.stories);
  const favorites = useStoryStore((state) => state.favorites);
  const shareStory = useStoryStore((state) => state.shareStory);
  const toggleFavorite = useStoryStore((state) => state.toggleFavorite);
  const fetchFavorites = useStoryStore((state) => state.fetchFavorites);
  const logout = useAuthStore((state) => state.logout);
  const theme = useTheme();

  // UI state
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  
  /**
   * Local cache of favorite story IDs for efficient lookup (O(1) instead of O(n))
   * Updated whenever the favorites array changes
   * Prevents unnecessary re-renders while keeping lookup fast
   */
  const [favoriteStoryIds, setFavoriteStoryIds] = useState<Set<string>>(new Set());

  /**
   * IMPORTANT: Separated fetch logic and UI update into TWO effects to prevent infinite loops
   * 
   * Effect 1: Fetch favorites on mount
   * - Only depends on fetchFavorites function
   * - Called ONCE on component mount
   * - Does NOT depend on favorites array (would cause infinite loop)
   */
  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  /**
   * Effect 2: Update local cache when favorites change
   * - Only depends on favorites array from store
   * - Called whenever favorites is updated
   * - No API calls, just local state update
   * - Keeps favoriteStoryIds Set in sync with store
   */
  useEffect(() => {
    setFavoriteStoryIds(new Set(favorites.map(s => s.id)));
  }, [favorites]);

  const displayedStories = useMemo(() => {
    if (filterMode === 'favorites') {
      return favorites;
    }
    return stories;
  }, [filterMode, stories, favorites]);

  /**
   * Check if a story is in the user's favorites list
   * @param storyId - The story ID to check
   * @returns true if story is favorited, false otherwise (O(1) lookup)
   */
  const isFavorite = (storyId: string) => favoriteStoryIds.has(storyId);

  /**
   * Handle favorite button press on a story card
   * 
   * @param story - The story object to favorite/unfavorite
   * @param currentFavorite - Whether the story is currently favorited
   * 
   * Flow:
   * 1. Call toggleFavorite API (adds or removes from backend)
   * 2. If successful, update local favoriteStoryIds cache
   * 3. Zustand store's favorites array is updated automatically
   * 4. Effect 2 syncs favoriteStoryIds with the store
   */
  const handleToggleFavorite = async (story: Story, currentFavorite: boolean) => {
    const success = await toggleFavorite(story.id, currentFavorite);
    if (success) {
      setFavoriteStoryIds(prev => {
        const newSet = new Set(prev);
        if (currentFavorite) {
          newSet.delete(story.id);
        } else {
          newSet.add(story.id);
        }
        return newSet;
      });
    }
  };

  const sidebarActions: SidebarAction[] = [
    {
      key: 'home',
      icon: 'home-variant-outline',
      label: 'Back to home',
      onPress: onBack
    },
    {
      key: 'logout',
      icon: 'logout',
      label: 'Sign out',
      onPress: () => {
        void logout();
      }
    }
  ];

  return (
    <AppScaffold title="Your story library" subtitle="Revisit favourites and pick up unfinished arcs" onBack={onBack} sidebarActions={sidebarActions}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.banner, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {stories.length === 0 ? 'No saved stories yet' : `You have ${stories.length} saved stories`}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Generate fresh tales from the home screen or continue any chapter below.
          </Text>
          <Button mode="contained-tonal" icon="home-variant" onPress={onBack} style={styles.bannerButton}>
            Back to home
          </Button>
        </Surface>

        {/* Filter tabs */}
        <View style={styles.filterContainer}>
          <Chip
            selected={filterMode === 'all'}
            onPress={() => setFilterMode('all')}
            mode={filterMode === 'all' ? 'flat' : 'outlined'}
            style={styles.filterChip}
          >
            All Stories ({stories.length})
          </Chip>
          <Chip
            selected={filterMode === 'favorites'}
            onPress={() => setFilterMode('favorites')}
            mode={filterMode === 'favorites' ? 'flat' : 'outlined'}
            style={styles.filterChip}
          >
            Favorites ({favorites.length})
          </Chip>
        </View>

        {displayedStories.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
            {filterMode === 'favorites' ? 'No favorited stories yet — heart your favorite tales to see them here.' : 'No saved stories yet — generate one to get started.'}
          </Text>
        ) : null}
        {displayedStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onContinue={onContinueStory}
            onViewFull={onViewStory}
            onShare={() => void shareStory(story.id)}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite(story.id)}
          />
        ))}
      </ScrollView>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
    paddingTop: 8,
    gap: 16
  },
  banner: {
    padding: 20,
    borderRadius: 24,
    gap: 12
  },
  bannerButton: {
    alignSelf: 'flex-start'
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4
  },
  filterChip: {
    flex: 1
  },
  empty: {
    textAlign: 'center',
    marginTop: 12
  }
});
