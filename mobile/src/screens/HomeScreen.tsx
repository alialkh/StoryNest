import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Snackbar, Surface, Text, useTheme, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StoryCard } from '../components/StoryCard';
import { ShareStoryDialog } from '../components/ShareStoryDialog';
import { CelebrationModal } from '../components/CelebrationModal';
import { useStoryStore } from '../store/storyStore';
import { useGamificationStore } from '../store/gamificationStore';
import { usePublicFeedStore } from '../store/publicFeedStore';
import { useAuthStore } from '../store/authStore';
import type { Story } from '../types';
import { AppScaffold, type SidebarAction } from '../components/AppScaffold';
import { formatShareCooldownMessage, formatShareUnlockTime, getShareCooldownProgress } from '../utils/time';

interface Props {
  onContinueStory: (story: Story) => void;
  onOpenLibrary: () => void;
  onOpenAccount: () => void;
  onUpgrade: () => void;
  onCreateStory: () => void;
  onOpenPublicFeed: () => void;
}

export const HomeScreen: React.FC<Props> = ({ onContinueStory, onOpenLibrary, onOpenAccount, onUpgrade, onCreateStory, onOpenPublicFeed }) => {
  const stories = useStoryStore((state) => state.stories);
  const loading = useStoryStore((state) => state.loading);
  const error = useStoryStore((state) => state.error);
  const remaining = useStoryStore((state) => state.remaining);
  const fetchStories = useStoryStore((state) => state.fetchStories);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const theme = useTheme();

  // Share dialog state
  const [shareDialogVisible, setShareDialogVisible] = useState(false);
  const [selectedStoryForShare, setSelectedStoryForShare] = useState<Story | null>(null);
  const [celebrationXp, setCelebrationXp] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const {
    shareStory: shareToPublic,
    isLoading: isPublicSharingLoading,
    error: publicShareError,
    canShare: canSharePublicly,
    shareCooldownUntil,
    shareCooldownStartedAt,
    hydrateShareStatus,
    clearError: clearPublicShareError
  } = usePublicFeedStore();

  // Gamification stats
  const stats = useGamificationStore((state) => state.stats);
  const fetchStats = useGamificationStore((state) => state.fetchStats);

  // Compute stats for engagement
  const rootStories = useMemo(() => stories.filter(s => !s.continued_from_id), [stories]);
  // Prefer the most recent root (original) story for display
  const latest = useMemo(() => rootStories[0], [rootStories]);
  
  useEffect(() => {
    void fetchStories();
    void fetchStats();
    void hydrateShareStatus();
  }, [fetchStories, fetchStats, hydrateShareStatus]);

  useEffect(() => {
    if (error) {
      setSnackbar(error);
    }
  }, [error]);

  useEffect(() => {
    if (publicShareError) {
      setSnackbar(publicShareError);
      clearPublicShareError();
    }
  }, [publicShareError, clearPublicShareError]);

  const handleShare = (story: Story) => {
    setSelectedStoryForShare(story);
    setShareDialogVisible(true);
  };

  const cooldownMessage = shareCooldownUntil ? formatShareCooldownMessage(shareCooldownUntil) : null;
  const unlockTimeCopy = shareCooldownUntil ? formatShareUnlockTime(shareCooldownUntil) : null;
  const shareCooldownProgress = getShareCooldownProgress(shareCooldownStartedAt, shareCooldownUntil);

  const handlePublicShare = async (story: Story) => {
    try {
      const xpGained = await shareToPublic(story.id);
      setCelebrationXp(xpGained);
      setCelebrationVisible(true);
      setSnackbar('Story shared to community feed!');
    } catch (error) {
      // The share dialog will surface the message; store-level error state triggers the snackbar effect
    }
  };

  const sidebarActions: SidebarAction[] = [
    {
      key: 'public-feed',
      icon: 'globe',
      label: 'Community Feed',
      onPress: onOpenPublicFeed
    },
    {
      key: 'library',
      icon: 'book-open-variant',
      label: 'Story library',
      onPress: onOpenLibrary
    },
    {
      key: 'account',
      icon: 'account-circle',
      label: 'My account',
      onPress: onOpenAccount
    },
    {
      key: 'upgrade',
      icon: 'crown-outline',
      label: 'Upgrade to Premium',
      onPress: onUpgrade
    },
    {
      key: 'logout',
      icon: 'logout',
      label: 'Sign out',
      onPress: () => {
        void logout();
      }
    }
  ];

  return (
    <AppScaffold
      title="StoryNest"
      subtitle="Compose original adventures in a few taps"
      sidebarActions={sidebarActions}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]} elevation={3}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="displaySmall" style={[styles.heroTitle, { color: theme.colors.onPrimaryContainer }]}>
                ✨ Ready to Write?
              </Text>
              <Text variant="bodyLarge" style={[{ color: theme.colors.onPrimaryContainer, opacity: 0.8, marginTop: 8 }]}>
                Create your next story in seconds with AI-powered inspiration.
              </Text>
            </View>
          </View>

          {/* Gamification Badges */}
          {stats && (
            <View style={styles.gamificationRow}>
              <Chip
                icon="flame"
                style={{ backgroundColor: theme.colors.tertiaryContainer }}
                textStyle={{ color: theme.colors.onTertiaryContainer }}
              >
                {stats.current_streak} Day Streak
              </Chip>
              <Chip
                icon="lightning-bolt"
                style={{ backgroundColor: theme.colors.secondaryContainer }}
                textStyle={{ color: theme.colors.onSecondaryContainer }}
              >
                {stats.total_xp} XP
              </Chip>
              <Chip
                icon="book"
                style={{ backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                {stats.total_stories} Stories
              </Chip>
            </View>
          )}

          {/* Daily Quota Display */}
          {remaining !== null && (
            <View style={styles.quotaSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                  Today's Stories Remaining
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                  {remaining}/{5}
                </Text>
              </View>
              <ProgressBar
                progress={Math.max(0, remaining / 5)}
                color={theme.colors.primary}
                style={{ height: 6, borderRadius: 3 }}
              />
              {remaining <= 1 && (
                <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 6, fontWeight: '500' }}>
                  ⚡ Only {remaining} story remaining today!
                </Text>
              )}
            </View>
          )}

          <Button
            mode="contained"
            icon="sparkles"
            onPress={onCreateStory}
            style={styles.primaryCTA}
            labelStyle={{ fontSize: 16, paddingVertical: 8 }}
          >
            Start Creating Now
          </Button>

          <View style={styles.heroActions}>
            <Button mode="contained-tonal" icon="book-open-page-variant" onPress={onOpenLibrary}>
              My Library
            </Button>
            {remaining !== null && remaining <= 0 && (
              <Button mode="contained" icon="crown" onPress={onUpgrade}>
                Get Unlimited
              </Button>
            )}
          </View>
        </Surface>
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {latest ? '📖 Latest Story' : '✨ Your Creative Journey'}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {latest
                ? `You have ${rootStories.length} ${rootStories.length === 1 ? 'story' : 'stories'} in your collection.`
                : 'Every great writer starts with one story. Let\'s create yours!'}
            </Text>
          </View>
          {loading && stories.length === 0 ? <ActivityIndicator animating /> : null}
          {latest ? (
            <StoryCard story={latest} onContinue={onContinueStory} onShare={handleShare} isLatest />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text variant="displaySmall" style={{ fontSize: 48, marginBottom: 12, textAlign: 'center' }}>
                📝
              </Text>
              <Text variant="headlineSmall" style={[{ color: theme.colors.onSurface, textAlign: 'center', marginBottom: 8 }]}>
                No Stories Yet!
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyState, { color: theme.colors.onSurfaceVariant }]}>
                You're moments away from creating your first masterpiece. Tap "Start Creating Now" above to begin your journey.
              </Text>
              <Button
                mode="contained-tonal"
                icon="sparkles"
                onPress={onCreateStory}
                style={{ marginTop: 16 }}
              >
                Create Your First Story
              </Button>
            </View>
          )}
        </Surface>
        {rootStories.slice(1, 3).map((story) => (
          <StoryCard key={story.id} story={story} onContinue={onContinueStory} onShare={handleShare} />
        ))}
        {user?.tier === 'PREMIUM' && !canSharePublicly ? (
          <Surface style={[styles.section, styles.shareLimitBanner, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
            <View style={styles.shareLimitContent}>
              <MaterialCommunityIcons name="calendar-clock" size={28} color={theme.colors.onSecondaryContainer} />
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                  Daily share limit reached
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>
                  {cooldownMessage ?? 'You can share another story tomorrow.'}
                </Text>
                {unlockTimeCopy ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, marginTop: 4, fontStyle: 'italic' }}>
                    {unlockTimeCopy}
                  </Text>
                ) : null}
              </View>
            </View>
            {shareCooldownProgress !== null ? (
              <ProgressBar
                progress={shareCooldownProgress}
                color={theme.colors.onSecondaryContainer}
                style={styles.shareLimitProgress}
              />
            ) : null}
          </Surface>
        ) : null}
        {rootStories.length > 3 ? (
          <Button mode="outlined" onPress={onOpenLibrary} style={styles.showAllButton} icon="book-open-page-variant">
            Show all
          </Button>
        ) : null}
      </ScrollView>
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        style={{ backgroundColor: theme.colors.secondary }}
        action={{ label: 'Close', onPress: () => setSnackbar(null) }}
      >
        {snackbar}
      </Snackbar>

      {/* Share to public feed dialog */}
      <ShareStoryDialog
        visible={shareDialogVisible}
        story={selectedStoryForShare}
        isPremium={user?.tier === 'PREMIUM'}
        isLoading={isPublicSharingLoading}
        canShare={canSharePublicly}
        shareCooldownUntil={shareCooldownUntil}
        shareCooldownStartedAt={shareCooldownStartedAt}
        onShare={handlePublicShare}
        onDismiss={() => {
          setShareDialogVisible(false);
          setSelectedStoryForShare(null);
        }}
        onUpgrade={onUpgrade}
      />

      {/* Celebration modal for successful share */}
      <CelebrationModal
        visible={celebrationVisible}
        xpGained={celebrationXp}
        onDismiss={() => setCelebrationVisible(false)}
      />
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 56,
    gap: 24,
    paddingHorizontal: 16
  },
  hero: {
    padding: 24,
    borderRadius: 28,
    gap: 16
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  heroTitle: {
    flex: 1,
    fontWeight: '700'
  },
  heroBadge: {
    borderRadius: 24
  },
  gamificationRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8
  },
  quotaSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 8
  },
  primaryCTA: {
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 8
  },
  heroSubtitle: {
    lineHeight: 22
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap'
  },
  section: {
    padding: 20,
    borderRadius: 28,
    gap: 16
  },
  shareLimitBanner: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18
  },
  shareLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  shareLimitProgress: {
    marginTop: 16,
    borderRadius: 999,
    height: 6
  },
  sectionHeader: {
    gap: 6
  },
  emptyStateContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  emptyState: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24
  },
  showAllButton: {
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 18
  }
});
