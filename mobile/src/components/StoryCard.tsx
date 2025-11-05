import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Button, Card, Text, useTheme, IconButton } from 'react-native-paper';
import type { Story } from '../types';
import { stripSuggestion, truncateWords, formatDateLong } from '../utils/text';

/**
 * Props for StoryCard component
 * 
 * @interface Props
 * @property {Story} story - The story object to display
 * @property {(story: Story) => void} [onContinue] - Optional: Callback for "Continue" button press
 * @property {(story: Story) => void} [onShare] - Optional: Callback for "Share" button press
 * @property {(story: Story) => void} [onViewFull] - Optional: Callback for clicking story title/body
 * @property {(story: Story, isFavorite: boolean) => Promise<void>} [onToggleFavorite] - Optional: Callback for heart icon press
 *                                                      isFavorite param is CURRENT state before toggle
 * @property {boolean} [isFavorite] - Optional: Whether story is currently favorited (default: false)
 * @property {boolean} [isLatest] - Optional: Whether this is the latest/most recent story (shows primary border)
 */
interface Props {
  story: Story;
  onContinue?: (story: Story) => void;
  onShare?: (story: Story) => void;
  onViewFull?: (story: Story) => void;
  onToggleFavorite?: (story: Story, isFavorite: boolean) => Promise<void>;
  isFavorite?: boolean;
  isLatest?: boolean;
}

/**
 * StoryCard - Reusable card component for displaying story summaries
 * 
 * Used in:
 * - HomeScreen (with continue, share, view callbacks)
 * - LibraryScreen (with continue, share, view, favorite callbacks)
 * - PublicFeedScreen (read-only card)
 * 
 * Features:
 * - Displays story title/genre, truncated content preview (50 words)
 * - Shows creation date and "continuation" label if applicable
 * - Optional "Continue" button for editing/continuing story
 * - Optional "Share" button for sharing to community
 * - Optional heart icon for favoriting (shows filled when isFavorite=true)
 * - Clickable title/body area that triggers onViewFull callback
 * - Highlights latest story with primary border color
 * 
 * Important: onToggleFavorite receives the CURRENT favorite state, not the new state
 * This allows the parent to handle the state transition logic
 */
export const StoryCard: React.FC<Props> = ({ story, onContinue, onShare, onViewFull, onToggleFavorite, isFavorite = false, isLatest }) => {
  const theme = useTheme();
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Standardized card colors (remove per-conversation themed colors)
  const accent = {
    bg: theme.colors.surface,
    border: isLatest ? theme.colors.primary : 'transparent',
    pill: theme.colors.surfaceVariant
  } as const;

  const displayed = truncateWords(stripSuggestion(story.content || ''), 50);
  const formattedDate = formatDateLong(story.created_at ?? null);

  const handleToggleFavorite = async () => {
    if (onToggleFavorite) {
      setFavoriteLoading(true);
      try {
        await onToggleFavorite(story, isFavorite);
      } finally {
        setFavoriteLoading(false);
      }
    }
  };

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
        {onToggleFavorite ? (
          <IconButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? theme.colors.error : theme.colors.onSurfaceVariant}
            size={20}
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
          />
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
