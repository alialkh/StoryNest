import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItemInfo
} from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePublicFeedStore } from '../store/publicFeedStore';
import { AppScaffold } from '../components/AppScaffold';
import { useAuthStore } from '../store/authStore';
import type { PublicStory } from '../services/publicFeedService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicFeed'>;

export const PublicFeedScreen: React.FC<Props> = ({ navigation }) => {
  const { stories, isLoading, error, loadFeed, toggleLike, likedStories } = usePublicFeedStore();
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();
  const [premiumPopupVisible, setPremiumPopupVisible] = React.useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const handleRefresh = async () => {
    await loadFeed();
  };

  const handleLike = async (story: PublicStory) => {
    if (user?.tier !== 'PREMIUM') {
      setPremiumPopupVisible(true);
      return;
    }
    try {
      const currentlyLiked = likedStories.has(story.id);
      await toggleLike(story.id, currentlyLiked);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const renderStory = ({ item }: ListRenderItemInfo<PublicStory>) => {
    const isLiked = likedStories.has(item.id);

    return (
      <Card
        style={styles.card}
        onPress={() => {
          navigation.navigate('StoryDetail' as any, {
            storyId: item.id,
            story: item
          });
        }}
      >
        <Card.Content>
          <Text variant="titleLarge" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" style={styles.excerpt} numberOfLines={3}>
            {item.excerpt}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="heart" size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={styles.statLabel}>
                {item.like_count} Likes
              </Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="comment-multiple" size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={styles.statLabel}>
                {item.comment_count} Comments
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              mode={isLiked ? 'contained' : 'outlined'}
              icon="heart"
              onPress={() => handleLike(item)}
              disabled={user?.tier !== 'PREMIUM'}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              {isLiked ? 'Liked' : 'Like'}
            </Button>
            <Button
              mode="outlined"
              icon="comment"
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Comment
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && stories.length === 0) {
    return (
      <AppScaffold title="Community Feed" onBack={() => navigation.goBack()}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      </AppScaffold>
    );
  }

  if (error && stories.length === 0) {
    return (
      <AppScaffold title="Community Feed" onBack={() => navigation.goBack()}>
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
          <Button mode="contained" onPress={handleRefresh} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      </AppScaffold>
    );
  }

  if (stories.length === 0) {
    return (
      <AppScaffold title="Community Feed" onBack={() => navigation.goBack()}>
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons name="book-open-blank-variant" size={64} color={theme.colors.outline} />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No stories yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyDescription}>
            Check back soon for amazing stories from the community!
          </Text>
        </View>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold title="Community Feed" onBack={() => navigation.goBack()}>
      <View style={styles.container}>
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          ListFooterComponent={
            isLoading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator animating={true} />
              </View>
            ) : null
          }
        />
      </View>
      <Portal>
        <Dialog visible={premiumPopupVisible} onDismiss={() => setPremiumPopupVisible(false)}>
          <Dialog.Title>Premium Feature</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Liking stories is a premium feature. Upgrade to premium to engage with the community!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPremiumPopupVisible(false)}>Cancel</Button>
            <Button onPress={() => {
              setPremiumPopupVisible(false);
              navigation.navigate('Upgrade' as any);
            }}>
              Upgrade
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    marginBottom: 16
  },
  excerpt: {
    marginTop: 8,
    marginBottom: 12,
    opacity: 0.8
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statLabel: {
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  actionButton: {
    flex: 1
  },
  actionButtonLabel: {
    fontSize: 12
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 16
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center'
  },
  emptyDescription: {
    marginTop: 8,
    marginHorizontal: 24,
    textAlign: 'center',
    opacity: 0.7
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center'
  }
});
