import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import type { Story } from '../types';

interface Props {
  story: Story;
  onContinue?: (story: Story) => void;
  onShare?: (story: Story) => void;
  isLatest?: boolean;
}

export const StoryCard: React.FC<Props> = ({ story, onContinue, onShare, isLatest }) => {
  const theme = useTheme();

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }, isLatest && { borderColor: theme.colors.primary }]}
      mode="elevated"
    >
      <Card.Title
        title={story.prompt}
        subtitle={story.genre ?? story.tone ?? 'Story'}
        titleNumberOfLines={2}
        subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
        titleStyle={{ color: theme.colors.onSurface }}
      />
      <Card.Content style={styles.body}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 20 }}>
          {story.content}
        </Text>
        {story.continued_from_id ? (
          <Text variant="labelSmall" style={{ color: theme.colors.secondary, marginTop: 8 }}>
            Continuation from previous part
          </Text>
        ) : null}
      </Card.Content>
      <Card.Actions style={styles.actions}>
        {onContinue ? (
          <Button mode="contained-tonal" onPress={() => onContinue(story)} icon="pencil">
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  body: {
    paddingBottom: 12,
    gap: 8
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between'
  }
});
