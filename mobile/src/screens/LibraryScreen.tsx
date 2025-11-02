import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { AppScaffold, type SidebarAction } from '../components/AppScaffold';
import { useAuthStore } from '../store/authStore';

interface Props {
  onBack: () => void;
  onContinueStory: (story: Story) => void;
}

export const LibraryScreen: React.FC<Props> = ({ onBack, onContinueStory }) => {
  const stories = useStoryStore((state) => state.stories);
  const shareStory = useStoryStore((state) => state.shareStory);
  const logout = useAuthStore((state) => state.logout);
  const theme = useTheme();

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
        {stories.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
            No saved stories yet — generate one to get started.
          </Text>
        ) : null}
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onContinue={onContinueStory}
            onShare={() => void shareStory(story.id)}
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
  empty: {
    textAlign: 'center',
    marginTop: 12
  }
});
