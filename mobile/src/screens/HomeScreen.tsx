import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text } from 'react-native-paper';
import { PromptComposer } from '../components/PromptComposer';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { EnchantedBackground } from '../components/EnchantedBackground';

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
    <EnchantedBackground contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text variant="displaySmall" style={styles.heroTitle}>
            Spin a new adventure
          </Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Prompt your imagination and unlock vibrant short stories crafted just for you.
          </Text>
        </View>
        <PromptComposer onSubmit={handleGenerate} disabled={loading} remaining={remaining} />
        <View style={styles.sectionHeader}>
          <View>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Latest story
            </Text>
            <Text variant="bodySmall" style={styles.sectionHint}>
              Continue where you left off or share a favourite moment.
            </Text>
          </View>
          <View style={styles.actions}>
            <Button mode="text" onPress={onOpenLibrary} icon="bookshelf">
              Library
            </Button>
            <Button mode="contained-tonal" onPress={onUpgrade} icon="crown">
              Upgrade
            </Button>
          </View>
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
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 48,
    gap: 24
  },
  hero: {
    gap: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#1E1E46',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  heroTitle: {
    color: '#4C1D95'
  },
  heroSubtitle: {
    color: '#4338CA'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitle: {
    color: '#312E81'
  },
  sectionHint: {
    color: '#433C68'
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  emptyState: {
    marginTop: 16,
    textAlign: 'center'
  }
});
