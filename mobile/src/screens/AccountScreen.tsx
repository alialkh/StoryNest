import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, ProgressBar, Surface, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useGamificationStore } from '../store/gamificationStore';
import { AppScaffold } from '../components/AppScaffold';

// Simple relative time formatter
const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

interface Props {
  onBack: () => void;
}

export const AccountScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const stats = useGamificationStore((state) => state.stats);
  const achievements = useGamificationStore((state) => state.achievements);
  const fetchStats = useGamificationStore((state) => state.fetchStats);
  const fetchAchievements = useGamificationStore((state) => state.fetchAchievements);
  const loading = useGamificationStore((state) => state.loading);

  useEffect(() => {
    void fetchStats();
    void fetchAchievements();
  }, [fetchStats, fetchAchievements]);

  const handleLogout = () => {
    void logout();
  };

  const isPremium = user?.tier === 'PREMIUM';
  const streakPercentage = Math.min((stats?.current_streak ?? 0) / 30, 1); // 30-day goal
  const storiesPercentage = Math.min((stats?.total_stories ?? 0) / 20, 1); // 20 stories goal

  return (
    <AppScaffold
      title="Account"
      subtitle="Your profile and achievements"
      onBack={onBack}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
          <View style={styles.profileHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="displaySmall" style={{ color: theme.colors.onPrimaryContainer, marginBottom: 8 }}>
                {user?.email}
              </Text>
              <Chip
                style={{ alignSelf: 'flex-start' }}
                icon={isPremium ? 'crown' : undefined}
                mode="outlined"
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                {isPremium ? 'Premium Member' : 'Free Tier'}
              </Chip>
            </View>
          </View>
        </Surface>

        {/* Gamification Stats */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            📊 Your Stats
          </Text>

          {loading && !stats ? (
            <ActivityIndicator animating />
          ) : stats ? (
            <View style={styles.statsGrid}>
              {/* Total Stories */}
              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
                    {stats.total_stories}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    Stories Created
                  </Text>
                  <ProgressBar
                    progress={storiesPercentage}
                    style={{ marginTop: 12 }}
                    color={theme.colors.primary}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {Math.min(stats.total_stories, 20)} / 20 toward Masterpiece
                  </Text>
                </Card.Content>
              </Card>

              {/* Current Streak */}
              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="displaySmall" style={{ color: theme.colors.tertiary }}>
                    {stats.current_streak}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    Day Streak 🔥
                  </Text>
                  <ProgressBar
                    progress={streakPercentage}
                    style={{ marginTop: 12 }}
                    color={theme.colors.tertiary}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    Record: {stats.longest_streak} days
                  </Text>
                </Card.Content>
              </Card>

              {/* Total XP */}
              <Card style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  <Text variant="displaySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {stats.total_xp}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    Total XP ⚡
                  </Text>
                </Card.Content>
              </Card>

              {/* Last Story */}
              <Card style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Last Story
                  </Text>
                  <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
                    {formatRelativeTime(stats.last_story_date)}
                  </Text>
                </Card.Content>
              </Card>
            </View>
          ) : null}
        </Surface>

        {/* Achievements */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            🏆 Achievements ({achievements.length})
          </Text>

          {achievements.length === 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Keep creating stories to earn achievements!
            </Text>
          ) : (
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <Card key={achievement.id} style={[styles.achievementCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Card.Content>
                    <View style={styles.achievementRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                          {achievement.title}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                          {achievement.description}
                        </Text>
                      </View>
                      <Chip
                        style={{ alignSelf: 'flex-start', marginLeft: 12 }}
                      >
                        +{achievement.xp_reward} XP
                      </Chip>
                    </View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                      Earned {new Date(achievement.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </Surface>

        {/* Actions */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.errorContainer }]} elevation={1}>
          <Button
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            style={styles.logoutButton}
          >
            Sign Out
          </Button>
        </Surface>
      </ScrollView>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20
  },
  section: {
    borderRadius: 24,
    padding: 20
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statsGrid: {
    gap: 12
  },
  statCard: {
    borderRadius: 16,
    marginBottom: 8
  },
  achievementCard: {
    borderRadius: 16,
    marginBottom: 12
  },
  achievementsList: {
    gap: 12
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  logoutButton: {
    borderRadius: 12
  }
});
