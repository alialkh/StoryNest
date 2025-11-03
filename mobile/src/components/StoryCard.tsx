import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import type { Story } from '../types';
import { stripSuggestion, truncateWords, formatDateLong } from '../utils/text';

interface Props {
  story: Story;
  onContinue?: (story: Story) => void;
  onShare?: (story: Story) => void;
  onViewFull?: (story: Story) => void;
  isLatest?: boolean;
}

export const StoryCard: React.FC<Props> = ({ story, onContinue, onShare, onViewFull, isLatest }) => {
  const theme = useTheme();

  // Standardized card colors (remove per-conversation themed colors)
  const accent = {
    bg: theme.colors.surface,
    border: isLatest ? theme.colors.primary : 'transparent',
    pill: theme.colors.surfaceVariant
  } as const;

  const displayed = truncateWords(stripSuggestion(story.content || ''), 50);
  const formattedDate = formatDateLong(story.created_at ?? null);

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: accent.bg, borderColor: accent.border }
      ]}
      mode="elevated"
    >
      <Card.Title
        title={story.title || story.prompt}
        subtitle={story.genre ?? story.tone ?? undefined}
        right={() => (formattedDate ? <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{formattedDate}</Text> : null)}
        titleNumberOfLines={2}
        subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
        titleStyle={{ color: theme.colors.onSurface }}
      />
      <Card.Content style={styles.body}>
        <Pressable onPress={() => onViewFull?.(story)}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 20 }}>
            {displayed}
          </Text>
          {story.continued_from_id ? (
            <Text variant="labelSmall" style={{ color: theme.colors.secondary, marginTop: 8 }}>
              Continuation from previous part
            </Text>
          ) : null}
        </Pressable>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        {onContinue ? (
          <Button
            mode="contained"
            onPress={() => onContinue(story)}
            icon="pencil"
          >
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
    borderWidth: 2,
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
