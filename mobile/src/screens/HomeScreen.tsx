import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Snackbar, Surface, Text, useTheme, ProgressBar } from 'react-native-paper';
import { StoryCard } from '../components/StoryCard';
import { ShareStoryDialog } from '../components/ShareStoryDialog';
import { CelebrationModal } from '../components/CelebrationModal';
import { useStoryStore } from '../store/storyStore';
import { useGamificationStore } from '../store/gamificationStore';
import { usePublicFeedStore } from '../store/publicFeedStore';
import { useAuthStore } from '../store/authStore';
import type { Story } from '../types';
import { AppScaffold, type SidebarAction } from '../components/AppScaffold';
import { formatDateLong } from '../utils/text';

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
  const shareStory = useStoryStore((state) => state.shareStory);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const theme = useTheme();

  // Share dialog state
  const [shareDialogVisible, setShareDialogVisible] = useState(false);
  const [selectedStoryForShare, setSelectedStoryForShare] = useState<Story | null>(null);
  const [celebrationXp, setCelebrationXp] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const shareToPublic = usePublicFeedStore((state) => state.shareStory);
  const isPublicSharingLoading = usePublicFeedStore((state) => state.isLoading);
  const canShareToPublic = usePublicFeedStore((state) => state.canShare);
  const shareCooldownUntil = usePublicFeedStore((state) => state.shareCooldownUntil);
  const initialiseShareLimit = usePublicFeedStore((state) => state.initialiseShareLimit);

  // Gamification stats
  const stats = useGamificationStore((state) => state.stats);
  const fetchStats = useGamificationStore((state) => state.fetchStats);

  // Compute stats for engagement
  const rootStories = useMemo(() => stories.filter(s => !s.continued_from_id), [stories]);
  const todayStories = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return rootStories.filter(s => s.created_at?.startsWith(today) || false);
  }, [rootStories]);
  
  // Prefer the most recent root (original) story for display
  const latest = useMemo(() => rootStories[0], [rootStories]);
  
  const dailyLimit = remaining !== null ? (remaining <= 3 ? remaining : remaining) : null;
  const storiesCreatedToday = rootStories.length > 0 ? todayStories.length : 0;

  useEffect(() => {
    void fetchStories();
    void fetchStats();
    void initialiseShareLimit();
  }, [fetchStories, fetchStats, initialiseShareLimit]);

  useEffect(() => {
    if (error) {
      setSnackbar(error);
    }
  }, [error]);

  const handleShare = (story: Story) => {
    setSelectedStoryForShare(story);
    setShareDialogVisible(true);
  };

  const handlePublicShare = async (story: Story) => {
    try {
      const xpGained = await shareToPublic(story.id);
      setCelebrationXp(xpGained);
      setCelebrationVisible(true);
      setSnackbar('Story shared to community feed!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share';
      setSnackbar(message);
    }
  };

  const sidebarActions: SidebarAction[] = [
    {
      key: 'public-feed',
      icon: 'earth',
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
                icon="fire"
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

          {/* Premium Upgrade Banner */}
          {user?.tier !== 'PREMIUM' && (
            <Surface
              style={[
                styles.premiumBanner,
                { backgroundColor: theme.colors.secondaryContainer }
              ]}
              elevation={2}
            >
              <View style={styles.premiumBannerContent}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.onSecondaryContainer, fontWeight: '600', marginBottom: 8 }}
                >
                  👑 Unlock Premium
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSecondaryContainer, opacity: 0.9, marginBottom: 12 }}
                >
                  Unlimited daily stories, advanced features, and more.
                </Text>
                <Button
                  mode="contained"
                  buttonColor={theme.colors.secondary}
                  textColor={theme.colors.onSecondary}
                  onPress={onUpgrade}
                  icon="crown"
                  compact
                >
                  Upgrade Now
                </Button>
              </View>
            </Surface>
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
            icon="star"
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
            <StoryCard story={latest} onContinue={onContinueStory} onShare={handleShare} onViewFull={onContinueStory} isLatest />
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
                icon="star"
                onPress={onCreateStory}
                style={{ marginTop: 16 }}
              >
                Create Your First Story
              </Button>
            </View>
          )}
        </Surface>
        {rootStories.slice(1, 3).map((story) => (
          <StoryCard key={story.id} story={story} onContinue={onContinueStory} onShare={handleShare} onViewFull={onContinueStory} />
        ))}
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
        canShare={canShareToPublic}
        shareCooldownUntil={shareCooldownUntil}
        onShare={handlePublicShare}
        onDismiss={() => {
          setShareDialogVisible(false);
          setSelectedStoryForShare(null);
        }}
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
  premiumBanner: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 12
  },
  premiumBannerContent: {
    flexDirection: 'column',
    gap: 8
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
