import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Button, Text, Portal, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Story } from '../types/index.js';

interface ShareStoryDialogProps {
  visible: boolean;
  story: Story | null;
  isPremium: boolean;
  isLoading: boolean;
  onShare: (story: Story) => Promise<void>;
  onDismiss: () => void;
}

export const ShareStoryDialog: React.FC<ShareStoryDialogProps> = ({
  visible,
  story,
  isPremium,
  isLoading,
  onShare,
  onDismiss
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDailyLimitError, setIsDailyLimitError] = useState(false);

  const handleShare = async () => {
    if (!story) return;
    try {
      setError(null);
      setIsDailyLimitError(false);
      await onShare(story);
      onDismiss();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share story';
      const isDailyLimit = message.includes('1 story per day') || message.includes('daily');
      setIsDailyLimitError(isDailyLimit);
      setError(message);
    }
  };

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
          ) : (
            <View style={styles.contentContainer}>
              {error ? (
                <>
                  <MaterialCommunityIcons 
                    name={isDailyLimitError ? 'clock-alert' : 'alert-circle'} 
                    size={48} 
                    color={isDailyLimitError ? '#FF9800' : '#F44336'} 
                  />
                  <Text variant="headlineSmall" style={[styles.title, { color: isDailyLimitError ? '#FF9800' : '#F44336' }]}>
                    {isDailyLimitError ? 'Daily Limit Reached' : 'Unable to Share'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {isDailyLimitError 
                      ? 'You can share 1 story per day. Come back tomorrow to share another one!'
                      : error}
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
          {isPremium && !error && (
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
  errorText: {
    marginTop: 12,
    color: '#d32f2f',
    textAlign: 'center'
  }
});
