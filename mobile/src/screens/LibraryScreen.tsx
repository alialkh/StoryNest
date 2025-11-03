import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme, Chip } from 'react-native-paper';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { AppScaffold, type SidebarAction } from '../components/AppScaffold';
import { useAuthStore } from '../store/authStore';

interface Props {
  onBack: () => void;
  onContinueStory: (story: Story) => void;
  onViewStory: (story: Story) => void;
}

export const LibraryScreen: React.FC<Props> = ({ onBack, onContinueStory, onViewStory }) => {
  const stories = useStoryStore((state) => state.stories);
  const favorites = useStoryStore((state) => state.favorites);
  const shareStory = useStoryStore((state) => state.shareStory);
  const toggleFavorite = useStoryStore((state) => state.toggleFavorite);
  const fetchFavorites = useStoryStore((state) => state.fetchFavorites);
  const logout = useAuthStore((state) => state.logout);
  const theme = useTheme();
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [favoriteStoryIds, setFavoriteStoryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    setFavoriteStoryIds(new Set(favorites.map(s => s.id)));
  }, [favorites]);

  const displayedStories = useMemo(() => {
    if (filterMode === 'favorites') {
      return favorites;
    }
    return stories;
  }, [filterMode, stories, favorites]);

  const isFavorite = (storyId: string) => favoriteStoryIds.has(storyId);

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
