import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { StoryCard } from '../components/StoryCard';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { EnchantedBackground } from '../components/EnchantedBackground';

interface Props {
  onBack: () => void;
  onContinueStory: (story: Story) => void;
}

export const LibraryScreen: React.FC<Props> = ({ onBack, onContinueStory }) => {
  const stories = useStoryStore((state) => state.stories);
  const shareStory = useStoryStore((state) => state.shareStory);

  return (
    <EnchantedBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={onBack} style={styles.back} mode="contained-tonal" />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.title}>
              Your story library
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Revisit favourites and continue an unfinished adventure.
            </Text>
          </View>
        </View>
        {stories.length === 0 ? (
          <Text variant="bodyMedium" style={styles.empty}>
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
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingTop: 32,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerText: {
    flex: 1,
    gap: 4
  },
  title: {
    color: '#312E81'
  },
  subtitle: {
    color: '#433C68'
  },
  back: {
    alignSelf: 'flex-start',
    marginLeft: -12
  },
  empty: {
    textAlign: 'center',
    color: '#4338CA'
  }
});
