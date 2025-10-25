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
      <Card.Title title={story.prompt} subtitle={story.genre ?? story.tone ?? 'Story'} />
      <Card.Content>
        <Text variant="bodyMedium" style={styles.content}>
          {story.content}
        </Text>
        {story.continued_from_id ? (
          <Text variant="labelSmall" style={styles.meta}>
            Continuation from previous part
          </Text>
        ) : null}
      </Card.Content>
      <Card.Actions>
        {onContinue ? (
          <Button onPress={() => onContinue(story)} icon="pen">
            Continue
          </Button>
        ) : null}
        {onShare ? (
          <Button onPress={() => onShare(story)} icon="share-variant">
            Share
          </Button>
        ) : null}
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16
  },
  highlight: {
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  content: {
    marginBottom: 12,
    lineHeight: 20
  },
  meta: {
    marginTop: 8,
    color: '#6B7280'
  }
});
