import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';

interface Props {
  onBack: () => void;
  onContinueStory: (story: Story) => void;
}

export const LibraryScreen: React.FC<Props> = ({ onBack, onContinueStory }) => {
  const stories = useStoryStore((state) => state.stories);
  const shareStory = useStoryStore((state) => state.shareStory);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <IconButton icon="arrow-left" onPress={onBack} style={styles.back} />
      <Text variant="headlineSmall" style={styles.title}>
        Your library
      </Text>
      {stories.length === 0 ? (
        <Text variant="bodyMedium">No saved stories yet — generate one to get started.</Text>
      ) : null}
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} onContinue={onContinueStory} onShare={() => void shareStory(story.id)} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  title: {
    marginBottom: 16
  },
  back: {
    alignSelf: 'flex-start'
  }
});
