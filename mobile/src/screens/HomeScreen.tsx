import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text } from 'react-native-paper';
import { PromptComposer } from '../components/PromptComposer';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';

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
  const [snackbar, setSnackbar] = useState<string | null>(null);
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PromptComposer onSubmit={handleGenerate} disabled={loading} remaining={remaining} />
        <View style={styles.headerRow}>
          <Text variant="titleMedium">Latest story</Text>
          <Button onPress={onOpenLibrary}>Library</Button>
          <Button mode="outlined" onPress={onUpgrade} icon="crown">
            Upgrade
          </Button>
        </View>
        {loading && stories.length === 0 ? <ActivityIndicator animating /> : null}
        {latest ? (
          <StoryCard story={latest} onContinue={onContinueStory} onShare={handleShare} isLatest />
        ) : (
          <Text variant="bodyMedium" style={styles.emptyState}>
            No stories yet. Start by crafting your first tale!
          </Text>
        )}
        {stories.slice(1).map((story) => (
          <StoryCard key={story.id} story={story} onContinue={onContinueStory} onShare={handleShare} />
        ))}
      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={2500}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    padding: 16
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  emptyState: {
    marginTop: 16,
    textAlign: 'center'
  }
});
