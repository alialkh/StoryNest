import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Button, Text, Portal, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Story } from '../types/index.js';

interface ShareStoryDialogProps {
  visible: boolean;
  story: Story | null;
  isPremium: boolean;
  isLoading: boolean;
  canShare: boolean;
  shareCooldownUntil: string | null;
  onShare: (story: Story) => Promise<void>;
  onDismiss: () => void;
}

const isDailyShareLimitError = (error: unknown): error is Error & { code?: string } => {
  return error instanceof Error && (error as any).code === 'DAILY_SHARE_LIMIT';
};

export const ShareStoryDialog: React.FC<ShareStoryDialogProps> = ({
  visible,
  story,
  isPremium,
  isLoading,
  canShare,
  shareCooldownUntil,
  onShare,
  onDismiss
}) => {
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [lastErrorWasLimit, setLastErrorWasLimit] = useState(false);

  const shareResetDate = useMemo(
    () => (shareCooldownUntil ? new Date(shareCooldownUntil) : null),
    [shareCooldownUntil]
  );

  useEffect(() => {
    if (!shareResetDate) {
      setTimeRemaining(null);
      return;
    }

    const updateTimeRemaining = () => {
      const diffMs = shareResetDate.getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeRemaining(null);
        return;
      }

      const totalMinutes = Math.ceil(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        setTimeRemaining(minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`);
      } else {
        setTimeRemaining(`${Math.max(totalMinutes, 1)}m`);
      }
    };

    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(timer);
  }, [shareResetDate]);

  useEffect(() => {
    if (!visible) {
      setError(null);
      setLastErrorWasLimit(false);
    }
  }, [visible]);

  const isShareWindowClosed = useMemo(() => {
    if (!canShare) {
      return true;
    }
    if (!shareResetDate) {
      return false;
    }
    return shareResetDate.getTime() > Date.now();
  }, [canShare, shareResetDate]);

  const formattedResetTime = useMemo(() => {
    if (!shareResetDate) {
      return null;
    }

    return shareResetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [shareResetDate]);

  const limitMessage = useMemo(() => {
    if (!isShareWindowClosed) {
      return null;
    }

    if (error) {
      return error;
    }

    if (timeRemaining) {
      return `You can share another story in ${timeRemaining}.`;
    }

    return 'You can share 1 story per day. Come back tomorrow to share another one!';
  }, [isShareWindowClosed, error, timeRemaining]);

  const handleShare = async () => {
    if (!story || isShareWindowClosed) {
      return;
    }
    try {
      setError(null);
      setLastErrorWasLimit(false);
      await onShare(story);
      onDismiss();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share story';
      setError(message);
      if (isDailyShareLimitError(err)) {
        setLastErrorWasLimit(true);
      } else {
        console.error('Failed to share story:', err);
        setLastErrorWasLimit(false);
      }
    }
  };

  useEffect(() => {
    if (!isShareWindowClosed && lastErrorWasLimit) {
      setError(null);
      setLastErrorWasLimit(false);
    }
  }, [isShareWindowClosed, lastErrorWasLimit]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Share to Public Feed</Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator animating={true} size="large" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Sharing your story...
              </Text>
            </View>
          ) : !isPremium ? (
            <View style={styles.contentContainer}>
              <MaterialCommunityIcons name="lock" size={48} color="#9C27B0" />
              <Text variant="headlineSmall" style={styles.title}>
                Premium Feature
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                Share your stories to the public feed and earn XP rewards. Upgrade to Premium to unlock this feature.
              </Text>
            </View>
          ) : isShareWindowClosed ? (
            <View style={styles.contentContainer}>
              <MaterialCommunityIcons name="clock-alert" size={48} color="#FF9800" />
              <Text variant="headlineSmall" style={[styles.title, { color: '#FF9800' }]}>Daily Limit Reached</Text>
              <Text variant="bodyMedium" style={styles.description}>
                {limitMessage}
              </Text>
              <Text variant="bodySmall" style={[styles.limitMeta, { color: '#FFECB3' }]}>
                {formattedResetTime
                  ? `Next share window unlocks at ${formattedResetTime}.`
                  : 'Your sharing window refreshes at midnight.'}
              </Text>
            </View>
          ) : (
            <View style={styles.contentContainer}>
              {error ? (
                <>
                  <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
                  <Text variant="headlineSmall" style={[styles.title, { color: '#F44336' }]}>
                    Unable to Share
                  </Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {error}
                  </Text>
                  <Text variant="bodySmall" style={styles.xpText}>
                    💡 Keep creating stories to build your audience!
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="share-variant" size={48} color="#4CAF50" />
                  <Text variant="bodyMedium" style={styles.shareText}>
                    Share "{story?.title || 'Untitled'}" to the public feed?
                  </Text>
                  <Text variant="bodySmall" style={styles.xpText}>
                    You'll earn +50 XP and reach more readers!
                  </Text>
                </>
              )}
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>{error ? 'Got it' : 'Cancel'}</Button>
          {isPremium && !isShareWindowClosed && (
            <Button
              mode="contained"
              onPress={handleShare}
              loading={isLoading}
              disabled={isLoading}
            >
              Share Story
            </Button>
          )}
          {!isPremium && (
            <Button mode="contained">Upgrade</Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 8,
  },
  dialogContent: {
    paddingHorizontal: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24
  },
  loadingText: {
    marginTop: 16
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 16
  },
  title: {
    marginTop: 12,
    marginBottom: 8
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.8
  },
  shareText: {
    marginTop: 12,
    textAlign: 'center'
  },
  xpText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
    color: '#FFD700',
    fontWeight: '600'
  },
  limitMeta: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '500'
  },
  errorText: {
    marginTop: 12,
    color: '#d32f2f',
    textAlign: 'center'
  }
});
