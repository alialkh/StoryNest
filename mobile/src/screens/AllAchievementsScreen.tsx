import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, FlatList } from 'react-native';
import { Button, Card, Chip, ProgressBar, Surface, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGamificationStore } from '../store/gamificationStore';
import { AppScaffold } from '../components/AppScaffold';

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
  category: 'milestone' | 'streak' | 'engagement';
}

const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  // Milestone achievements
  {
    id: 'first_story',
    title: 'Story Starter',
    description: 'Create your first story',
    xp_reward: 50,
    icon: 'pencil',
    category: 'milestone'
  },
  {
    id: 'five_stories',
    title: 'Rising Author',
    description: 'Create 5 stories',
    xp_reward: 100,
    icon: 'pen',
    category: 'milestone'
  },
  {
    id: 'ten_stories',
    title: 'Prolific Writer',
    description: 'Create 10 stories',
    xp_reward: 250,
    icon: 'book-open-page-variant',
    category: 'milestone'
  },
  {
    id: 'twenty_stories',
    title: 'Master Storyteller',
    description: 'Create 20 stories',
    xp_reward: 500,
    icon: 'book-multiple',
    category: 'milestone'
  },
  {
    id: 'fifty_stories',
    title: 'Epic Author',
    description: 'Create 50 stories',
    xp_reward: 750,
    icon: 'crown',
    category: 'milestone'
  },
  {
    id: 'hundred_stories',
    title: 'Legend of the Craft',
    description: 'Create 100 stories',
    xp_reward: 1500,
    icon: 'shield-star',
    category: 'milestone'
  },
  {
    id: 'five_hundred_stories',
    title: 'Immortal Wordsmith',
    description: 'Create 500 stories',
    xp_reward: 5000,
    icon: 'lightning-bolt-circle',
    category: 'milestone'
  },
  // Streak achievements
  {
    id: 'three_day_streak',
    title: 'Consistent Creator',
    description: 'Create stories for 3 consecutive days',
    xp_reward: 150,
    icon: 'fire',
    category: 'streak'
  },
  {
    id: 'seven_day_streak',
    title: 'Week Warrior',
    description: 'Create stories for 7 consecutive days',
    xp_reward: 350,
    icon: 'fire',
    category: 'streak'
  },
  {
    id: 'thirty_day_streak',
    title: 'Legend Writer',
    description: 'Create stories for 30 consecutive days',
    xp_reward: 1000,
    icon: 'fire',
    category: 'streak'
  },
  // Engagement achievements
  {
    id: 'first_public_share',
    title: 'Story Sharer',
    description: 'Share your first story publicly',
    xp_reward: 100,
    icon: 'share-variant',
    category: 'engagement'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Share 10 stories publicly',
    xp_reward: 300,
    icon: 'heart-multiple',
    category: 'engagement'
  },
  {
    id: 'community_favorite',
    title: 'Community Favorite',
    description: 'Get 50 likes on your shared stories',
    xp_reward: 500,
    icon: 'heart-multiple-outline',
    category: 'engagement'
  }
];

interface Props {
  onBack: () => void;
}

export const AllAchievementsScreen: React.FC<Props> = ({ onBack }) => {
  const theme = useTheme();
  const achievements = useGamificationStore((state) => state.achievements);
  const stats = useGamificationStore((state) => state.stats);
  const loading = useGamificationStore((state) => state.loading);
  const fetchAchievements = useGamificationStore((state) => state.fetchAchievements);
  const fetchStats = useGamificationStore((state) => state.fetchStats);

  useEffect(() => {
    void fetchAchievements();
    void fetchStats();
  }, [fetchAchievements, fetchStats]);

  const earnedAchievementIds = new Set(achievements.map((a) => a.achievement_type));

  const getProgress = (achievement: AchievementDefinition): { current: number; target: number; percentage: number } => {
    if (!stats) return { current: 0, target: 1, percentage: 0 };

    const parseTarget = (desc: string): number => {
      const match = desc.match(/(\d+)/);
      return match ? parseInt(match[1]) : 1;
    };

    switch (achievement.id) {
      case 'first_story':
        return { current: stats.total_stories, target: 1, percentage: Math.min(stats.total_stories / 1, 1) };
      case 'five_stories':
        return { current: stats.total_stories, target: 5, percentage: Math.min(stats.total_stories / 5, 1) };
      case 'ten_stories':
        return { current: stats.total_stories, target: 10, percentage: Math.min(stats.total_stories / 10, 1) };
      case 'twenty_stories':
        return { current: stats.total_stories, target: 20, percentage: Math.min(stats.total_stories / 20, 1) };
      case 'fifty_stories':
        return { current: stats.total_stories, target: 50, percentage: Math.min(stats.total_stories / 50, 1) };
      case 'hundred_stories':
        return { current: stats.total_stories, target: 100, percentage: Math.min(stats.total_stories / 100, 1) };
      case 'five_hundred_stories':
        return { current: stats.total_stories, target: 500, percentage: Math.min(stats.total_stories / 500, 1) };
      case 'three_day_streak':
        return { current: stats.current_streak, target: 3, percentage: Math.min(stats.current_streak / 3, 1) };
      case 'seven_day_streak':
        return { current: stats.current_streak, target: 7, percentage: Math.min(stats.current_streak / 7, 1) };
      case 'thirty_day_streak':
        return { current: stats.current_streak, target: 30, percentage: Math.min(stats.current_streak / 30, 1) };
      default:
        return { current: 0, target: 1, percentage: 0 };
    }
  };

  const renderAchievementCard = (item: AchievementDefinition) => {
    const isEarned = earnedAchievementIds.has(item.id);
    const progress = getProgress(item);

    return (
      <Card
        key={item.id}
        style={[
          styles.achievementCard,
          {
            backgroundColor: isEarned ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
            opacity: isEarned ? 1 : 0.7
          }
        ]}
      >
        <Card.Content>
          <View style={styles.achievementContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={40}
                color={isEarned ? theme.colors.primary : theme.colors.outline}
              />
            </View>
            <View style={styles.achievementInfo}>
              <View style={styles.titleRow}>
                <Text
                  variant="titleSmall"
                  style={{
                    color: isEarned ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                    fontWeight: '600',
                    flex: 1
                  }}
                >
                  {item.title}
                </Text>
                {isEarned && (
                  <Chip
                    style={{ backgroundColor: theme.colors.primary, height: 28 }}
                    textStyle={{ color: theme.colors.onPrimary, fontSize: 12 }}
                  >
                    +{item.xp_reward} XP
                  </Chip>
                )}
              </View>
              <Text
                variant="bodySmall"
                style={{
                  color: isEarned ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                  marginTop: 4
                }}
              >
                {item.description}
              </Text>

              {!isEarned && (
                <>
                  <ProgressBar
                    progress={progress.percentage}
                    style={{ marginTop: 8, height: 4, borderRadius: 2 }}
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 4,
                      fontSize: 11
                    }}
                  >
                    Progress: {progress.current} / {progress.target}
                  </Text>
                </>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const milestoneAchievements = ALL_ACHIEVEMENTS.filter((a) => a.category === 'milestone');
  const streakAchievements = ALL_ACHIEVEMENTS.filter((a) => a.category === 'streak');
  const engagementAchievements = ALL_ACHIEVEMENTS.filter((a) => a.category === 'engagement');

  if (loading && achievements.length === 0) {
    return (
      <AppScaffold title="All Achievements" subtitle="Collect them all!" onBack={onBack}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator animating size="large" />
        </View>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold title="All Achievements" subtitle="Collect them all!" onBack={onBack}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Milestone Achievements */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
            📚 Story Milestones
          </Text>
          <View style={styles.achievementsList}>
            {milestoneAchievements.map((achievement) => renderAchievementCard(achievement))}
          </View>
        </Surface>

        {/* Streak Achievements */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
            🔥 Streaks
          </Text>
          <View style={styles.achievementsList}>
            {streakAchievements.map((achievement) => renderAchievementCard(achievement))}
          </View>
        </Surface>

        {/* Engagement Achievements */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
            💬 Community
          </Text>
          <View style={styles.achievementsList}>
            {engagementAchievements.map((achievement) => renderAchievementCard(achievement))}
          </View>
        </Surface>
      </ScrollView>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16
  },
  section: {
    borderRadius: 16,
    padding: 16
  },
  achievementsList: {
    gap: 12
  },
  achievementCard: {
    borderRadius: 12
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  achievementInfo: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  }
});
