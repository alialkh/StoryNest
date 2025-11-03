import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScaffold } from '../components/AppScaffold';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';
import { useGamificationStore } from '../store/gamificationStore';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicFeed'>;

interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string | null;
  xp_reward: number;
  earned_at: string;
}

const ACHIEVEMENT_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  first_story: 'pencil-box-outline',
  five_stories: 'star-outline',
  ten_stories: 'star',
  twenty_stories: 'star-circle',
  fifty_stories: 'trophy-outline',
  hundred_stories: 'trophy',
  five_hundred_stories: 'crown',
  three_day_streak: 'calendar-check',
  seven_day_streak: 'calendar-check-outline',
  thirty_day_streak: 'calendar-multiple-check'
};

const MILESTONE_BADGES = [
  { count: 50, title: '50 Stories', icon: 'flag' as const, color: '#4CAF50' },
  { count: 100, title: '100 Stories', icon: 'crown-outline' as const, color: '#FFA726' },
  { count: 500, title: '500 Stories', icon: 'crown' as const, color: '#FFD700' }
];

export const AchievementsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const stats = useGamificationStore((state) => state.stats);
  const fetchStats = useGamificationStore((state) => state.fetchStats);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const response = await api.get('/gamification/achievements');
        setAchievements(response.data);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadAchievements();
    void fetchStats();
  }, [fetchStats]);

  const renderAchievement = ({ item }: ListRenderItemInfo<Achievement>) => {
    const earnedDate = new Date(item.earned_at);
    const formattedDate = earnedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const iconName = ACHIEVEMENT_ICONS[item.achievement_type] || 'medal';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.achievementRow}>
            <MaterialCommunityIcons
              name={iconName}
              size={40}
              color={theme.colors.primary}
            />
            <View style={styles.achievementText}>
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {item.title}
              </Text>
              {item.description && (
                <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
                  {item.description}
                </Text>
              )}
              <Text variant="labelSmall" style={{ marginTop: 6, opacity: 0.6 }}>
                {formattedDate}
              </Text>
            </View>
            <View style={styles.xpBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ marginLeft: 4, fontWeight: '600' }}>
                +{item.xp_reward}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMilestone = ({ count, title, icon, color }: (typeof MILESTONE_BADGES)[0]) => {
    const isUnlocked = (stats?.total_stories ?? 0) >= count;

    return (
      <View key={count} style={styles.milestoneCard}>
        <View
          style={[
            styles.milestoneBadge,
            { backgroundColor: isUnlocked ? color : theme.colors.surfaceVariant }
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={32}
            color={isUnlocked ? '#fff' : theme.colors.onSurfaceVariant}
          />
        </View>
        <Text
          variant="labelLarge"
          style={[
            { marginTop: 8, textAlign: 'center', fontWeight: '600' },
            isUnlocked ? { color: color } : { color: theme.colors.onSurfaceVariant }
          ]}
        >
          {title}
        </Text>
        {!isUnlocked && (
          <Text variant="labelSmall" style={{ marginTop: 4, textAlign: 'center', opacity: 0.6 }}>
            {count - (stats?.total_stories ?? 0)} to go
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <AppScaffold title="Achievements" onBack={() => navigation.goBack()}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold title="Achievements" onBack={() => navigation.goBack()}>
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Milestones
            </Text>
            <View style={styles.milestonesGrid}>
              {MILESTONE_BADGES.map(renderMilestone)}
            </View>

            <Text variant="headlineSmall" style={[styles.sectionTitle, { marginTop: 24 }]}>
              Earned Achievements
            </Text>

            {achievements.length === 0 && (
              <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7, marginVertical: 16 }}>
                No achievements yet. Keep creating to unlock badges!
              </Text>
            )}
          </View>
        }
      />
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  sectionTitle: {
    marginVertical: 12,
    fontWeight: '600'
  },
  card: {
    marginBottom: 12
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  achievementText: {
    flex: 1
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70033',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  milestonesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    gap: 12
  },
  milestoneCard: {
    flex: 1,
    alignItems: 'center'
  },
  milestoneBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
