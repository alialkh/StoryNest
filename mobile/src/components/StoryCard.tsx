import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import type { Story } from '../types';

interface Props {
  story: Story;
  onContinue?: (story: Story) => void;
  onShare?: (story: Story) => void;
  isLatest?: boolean;
}

export const StoryCard: React.FC<Props> = ({ story, onContinue, onShare, isLatest }) => {
  return (
    <Card style={[styles.card, isLatest && styles.highlight]}>
      <Card.Title
        title={story.prompt}
        subtitle={story.genre ?? story.tone ?? 'Story'}
        titleNumberOfLines={2}
        subtitleStyle={styles.subtitle}
      />
      <Card.Content style={styles.body}>
        <Text variant="bodyMedium" style={styles.content}>
          {story.content}
        </Text>
        {story.continued_from_id ? (
          <Text variant="labelSmall" style={styles.meta}>
            Continuation from previous part
          </Text>
        ) : null}
      </Card.Content>
      <Card.Actions style={styles.actions}>
        {onContinue ? (
          <Button mode="contained-tonal" onPress={() => onContinue(story)} icon="pen">
            Continue
          </Button>
        ) : null}
        {onShare ? (
          <Button mode="text" onPress={() => onShare(story)} icon="share-variant">
            Share
          </Button>
        ) : null}
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    shadowColor: '#1F2937',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  highlight: {
    borderWidth: 2,
    borderColor: '#7C3AED'
  },
  body: {
    paddingBottom: 12
  },
  content: {
    marginBottom: 12,
    lineHeight: 20,
    color: '#312E81'
  },
  meta: {
    marginTop: 8,
    color: '#6B21A8'
  },
  subtitle: {
    color: '#5B21B6'
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between'
  }
});
