import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Snackbar, Surface, Text, useTheme } from 'react-native-paper';
import { PromptComposer } from '../components/PromptComposer';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { AppScaffold, type SidebarAction } from '../components/AppScaffold';
import { useAuthStore } from '../store/authStore';

interface Props {
  onContinueStory: (story: Story) => void;
  onOpenLibrary: () => void;
  onUpgrade: () => void;
}

export const HomeScreen: React.FC<Props> = ({ onContinueStory, onOpenLibrary, onUpgrade }) => {
  const stories = useStoryStore((state) => state.stories);
  const loading = useStoryStore((state) => state.loading);
  const error = useStoryStore((state) => state.error);
  const remaining = useStoryStore((state) => state.remaining);
  const fetchStories = useStoryStore((state) => state.fetchStories);
  const generateStory = useStoryStore((state) => state.generateStory);
  const shareStory = useStoryStore((state) => state.shareStory);
  const logout = useAuthStore((state) => state.logout);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const theme = useTheme();

  const latest = useMemo(() => stories[0], [stories]);

  useEffect(() => {
    void fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (error) {
      setSnackbar(error);
    }
  }, [error]);

  const handleGenerate = (payload: { prompt: string; genre?: string | null; tone?: string | null }) => {
    void generateStory({ ...payload }).then((story) => {
      if (story) {
        setSnackbar('Story created!');
      }
    });
  };

  const handleShare = (story: Story) => {
    void shareStory(story.id).then((result) => {
      if (result?.shareUrl) {
        setSnackbar(`Share link copied: ${result.shareUrl}`);
      }
    });
  };

  const sidebarActions: SidebarAction[] = [
    {
      key: 'library',
      icon: 'book-open-variant',
      label: 'Story library',
      onPress: onOpenLibrary
    },
    {
      key: 'upgrade',
      icon: 'crown-outline',
      label: 'Upgrade to Premium',
      onPress: onUpgrade
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
    <AppScaffold
      title="Daily story lab"
      subtitle="Compose original adventures in a few taps"
      sidebarActions={sidebarActions}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={[styles.hero, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.heroHeader}>
            <Text variant="headlineMedium" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
              Spin a new adventure
            </Text>
            <Chip icon="star-four-points" textStyle={{ color: theme.colors.onPrimary }} style={[styles.heroBadge, { backgroundColor: theme.colors.primary }]}>
              Fresh inspiration
            </Chip>
          </View>
          <Text variant="bodyLarge" style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Prompt your imagination and unlock vibrant short stories crafted just for you.
          </Text>
          <View style={styles.heroActions}>
            <Button mode="contained-tonal" icon="book-open-page-variant" onPress={onOpenLibrary}>
              Library
            </Button>
            <Button mode="contained" icon="crown" onPress={onUpgrade}>
              Upgrade
            </Button>
          </View>
        </Surface>
        <PromptComposer onSubmit={handleGenerate} disabled={loading} remaining={remaining} />
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              Latest story
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Continue where you left off or share a favourite moment.
            </Text>
          </View>
          {loading && stories.length === 0 ? <ActivityIndicator animating /> : null}
          {latest ? (
            <StoryCard story={latest} onContinue={onContinueStory} onShare={handleShare} isLatest />
          ) : (
            <Text variant="bodyMedium" style={[styles.emptyState, { color: theme.colors.onSurfaceVariant }]}>
              No stories yet. Start by crafting your first tale!
            </Text>
          )}
        </Surface>
        {stories.slice(1).map((story) => (
          <StoryCard key={story.id} story={story} onContinue={onContinueStory} onShare={handleShare} />
        ))}
      </ScrollView>
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        style={{ backgroundColor: theme.colors.secondary }}
        action={{ label: 'Close', onPress: () => setSnackbar(null) }}
      >
        {snackbar}
      </Snackbar>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 56,
    gap: 24
  },
  hero: {
    padding: 24,
    borderRadius: 28,
    gap: 16
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  heroTitle: {
    flex: 1,
    marginRight: 16
  },
  heroSubtitle: {
    lineHeight: 22
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap'
  },
  heroBadge: {
    borderRadius: 24
  },
  section: {
    padding: 20,
    borderRadius: 28,
    gap: 16
  },
  sectionHeader: {
    gap: 6
  },
  emptyState: {
    textAlign: 'center',
    marginTop: 8
  }
});
