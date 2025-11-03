import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ListRenderItemInfo, ScrollView, Share, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, TextInput, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppScaffold, type SidebarAction, type HeaderAction } from '../components/AppScaffold';
import { FormattedText } from '../components/FormattedText';
import { ZoomableText } from '../components/ZoomableText';
import { PremiumFeaturePopup } from '../components/PremiumFeaturePopup';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';
import type { PublicStory } from '../services/publicFeedService';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'StoryDetail'>;

interface PublicStoryComment {
  id: string;
  public_story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const StoryDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { storyId, story: initialStory } = route.params as { storyId: string; story?: any };
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const [story, setStory] = useState<PublicStory | null>(initialStory || null);
  const [comments, setComments] = useState<PublicStoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  const [premiumPopupFeature, setPremiumPopupFeature] = useState('');
  const [textSize, setTextSize] = useState<'small' | 'normal' | 'large'>('normal');

  const handleShareStory = async () => {
    try {
      if (story) {
        await Share.share({
          message: `Check out this story from StoryNest: "${story.title}"\n\n${story.excerpt}`,
          title: story.title
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleReportStory = () => {
    Alert.alert(
      'Report Story',
      'Thank you for helping us maintain community standards.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'Your report has been submitted.');
        }}
      ]
    );
  };

  const handleToggleTextSize = () => {
    const sizes: Array<'small' | 'normal' | 'large'> = ['small', 'normal', 'large'];
    const currentIndex = sizes.indexOf(textSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setTextSize(sizes[nextIndex]);
  };

  const headerActions: HeaderAction[] = [
    {
      key: 'zoom',
      icon: 'magnify-plus',
      label: textSize === 'small' ? 'Enlarge' : textSize === 'large' ? 'Shrink' : 'Enlarge',
      onPress: handleToggleTextSize
    },
    {
      key: 'share',
      icon: 'share-variant',
      label: 'Share',
      onPress: handleShareStory
    },
    {
      key: 'report',
      icon: 'flag',
      label: 'Report',
      onPress: handleReportStory
    }
  ];

  useEffect(() => {
    const loadStoryDetails = async () => {
      try {
        setLoading(true);
        
        // If we don't have the full text yet, try to fetch it
        if (!story?.text && story?.story_id) {
          try {
            const storyResponse = await api.get(`/stories/${story.story_id}`);
            setStory(prev => prev ? { ...prev, text: storyResponse.data.text } : null);
          } catch (err) {
            console.error('Failed to load full story text:', err);
          }
        }
        
        // Fetch comments
        const commentsResponse = await api.get(`/feed/feed/${storyId}/comments?limit=100`);
        setComments(commentsResponse.data);

        // Check if liked
        try {
          const likedResponse = await api.get(`/feed/feed/${storyId}/liked`);
          setIsLiked(likedResponse.data.liked);
        } catch {
          // Not authenticated or error checking like status
        }
      } catch (error) {
        console.error('Failed to load story details:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadStoryDetails();
  }, [storyId]);

  const handleAddComment = async () => {
    // Check if user is premium
    if (user?.tier !== 'PREMIUM') {
      setPremiumPopupFeature('Commenting on stories');
      setPremiumPopupVisible(true);
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.post(`/feed/feed/${storyId}/comment`, {
        content: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleLike = async () => {
    // Check if user is premium
    if (user?.tier !== 'PREMIUM') {
      setPremiumPopupFeature('Liking stories');
      setPremiumPopupVisible(true);
      return;
    }

    try {
      if (isLiked) {
        await api.delete(`/feed/feed/${storyId}/like`);
      } else {
        await api.post(`/feed/feed/${storyId}/like`);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const renderComment = ({ item }: ListRenderItemInfo<PublicStoryComment>) => {
    const commentDate = new Date(item.created_at);
    const timeAgo = getTimeAgo(commentDate);

    return (
      <Card style={styles.commentCard}>
        <Card.Content>
          <View style={styles.commentHeader}>
            <Text variant="labelMedium" style={{ fontWeight: '600' }}>
              Reader
            </Text>
            <Text variant="labelSmall" style={{ opacity: 0.6 }}>
              {timeAgo}
            </Text>
          </View>
          <Text variant="bodyMedium" style={{ marginTop: 8 }}>
            {item.content}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <AppScaffold title="Story" onBack={() => navigation.goBack()}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold title="Community Story" onBack={() => navigation.goBack()} headerActions={headerActions}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Story Content */}
        <Card style={styles.storyCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ marginBottom: 8, fontWeight: '600' }}>
              {route.params.story?.title}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="heart" size={16} color={theme.colors.primary} />
                <Text variant="labelSmall" style={{ marginLeft: 4 }}>
                  {route.params.story?.like_count ?? 0}
                </Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="comment-multiple" size={16} color={theme.colors.primary} />
                <Text variant="labelSmall" style={{ marginLeft: 4 }}>
                  {comments.length}
                </Text>
              </View>
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <ZoomableText
              content={(story?.text || story?.excerpt) ?? ''}
              variant="bodyMedium"
              style={{ lineHeight: 22 }}
              textSize={textSize}
            />

            <View style={styles.actionButtons}>
              <Button
                mode={isLiked ? 'contained' : 'outlined'}
                icon="heart"
                onPress={handleToggleLike}
                style={styles.actionButton}
              >
                {isLiked ? 'Liked' : 'Like'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 12, fontWeight: '600' }}>
          Comments ({comments.length})
        </Text>

        {/* Add Comment */}
        <Card style={styles.commentInputCard}>
          <Card.Content>
            <TextInput
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.commentInput}
            />
            <Button
              mode="contained"
              onPress={handleAddComment}
              loading={isSubmittingComment}
              disabled={isSubmittingComment || !newComment.trim()}
              style={{ marginTop: 8 }}
            >
              Post Comment
            </Button>
          </Card.Content>
        </Card>

        {/* Comments List */}
        {comments.length === 0 ? (
          <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.6, marginTop: 16 }}>
            No comments yet. Be the first to share your thoughts!
          </Text>
        ) : (
          <View style={{ marginTop: 12 }}>
            {comments.map((comment) => (
              <View key={comment.id}>{renderComment({ item: comment } as any)}</View>
            ))}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
      <PremiumFeaturePopup
        visible={premiumPopupVisible}
        featureName={premiumPopupFeature}
        onDismiss={() => setPremiumPopupVisible(false)}
        onUpgrade={() => {
          setPremiumPopupVisible(false);
          navigation.navigate('Upgrade');
        }}
      />
    </AppScaffold>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  storyCard: {
    marginBottom: 16
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 12
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  actionButton: {
    flex: 1
  },
  commentInputCard: {
    marginBottom: 16
  },
  commentInput: {
    marginBottom: 8
  },
  commentCard: {
    marginBottom: 12
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});
