import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Button, List, Surface, Text, useTheme } from 'react-native-paper';
import { useStoryStore } from '../store/storyStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { AppScaffold } from '../components/AppScaffold';

interface Props {
  onBack: () => void;
}

export const UpgradeScreen: React.FC<Props> = ({ onBack }) => {
  const user = useAuthStore((state) => state.user);
  const remaining = useStoryStore((state) => state.remaining);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const theme = useTheme();

  const handleUpgrade = () => {
    setLoading(true);
    void api
      .post('/billing/checkout')
      .then((response) => {
        const url: string = response.data.checkoutUrl;
        setMessage('Opening checkout...');
        return Linking.openURL(url);
      })
      .catch((error) => {
        console.error(error);
        setMessage('Unable to start checkout. Please try again later.');
      })
      .finally(() => setLoading(false));
  };

  const handleMockUpgrade = () => {
    setLoading(true);
    void api
      .post('/billing/webhook/mock-upgrade')
      .then(() => {
        setMessage('Premium activated! Enjoy unlimited stories.');
      })
      .catch((error) => {
        console.error(error);
        setMessage('Unable to activate premium.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <AppScaffold title="Unlock StoryNest Premium" subtitle="Unlimited stories, custom genres, and ongoing arcs" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.pricing, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            $3.99 <Text variant="titleMedium">/ month</Text>
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Enjoy limitless storytelling with exclusive tones, genres, and chapter continuations.
          </Text>
        </Surface>
        <Surface style={[styles.list, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Section>
            <List.Item
              title="Unlimited story generations"
              description="Dream up as many chapters as you like."
              left={(props) => <List.Icon {...props} icon="infinity" color={theme.colors.primary} />}
            />
            <List.Item
              title="Advanced tones & genres"
              description="Unlock whimsical palettes tailored to your mood."
              left={(props) => <List.Icon {...props} icon="palette" color={theme.colors.primary} />}
            />
            <List.Item
              title="Continue stories seamlessly"
              description="Keep adventures rolling with linked chapters."
              left={(props) => <List.Icon {...props} icon="timeline-text" color={theme.colors.primary} />}
            />
            <List.Item
              title="Save and share without limits"
              description="Collect favourites and share with friends."
              left={(props) => <List.Icon {...props} icon="share-variant" color={theme.colors.primary} />}
            />
          </List.Section>
        </Surface>
        <Button
          mode="contained"
          onPress={handleUpgrade}
          loading={loading}
          icon="crown"
          style={styles.primaryButton}
          contentStyle={styles.primaryContent}
        >
          Go Premium
        </Button>
        <Button mode="outlined" onPress={handleMockUpgrade} disabled={loading} style={styles.secondaryButton} icon="check-circle-outline">
          Activate mock premium
        </Button>
        <Text variant="labelSmall" style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}> 
          {user?.tier === 'PREMIUM'
            ? 'You already have unlimited access. Thank you!'
            : remaining === null
            ? 'Premium active.'
            : `Free tier: ${remaining ?? 3} stories left today.`}
        </Text>
        {message ? <Text style={[styles.message, { color: theme.colors.tertiary }]}>{message}</Text> : null}
      </ScrollView>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
    paddingTop: 8,
    gap: 20
  },
  pricing: {
    padding: 24,
    borderRadius: 24,
    gap: 12,
    alignItems: 'flex-start'
  },
  list: {
    borderRadius: 24,
    paddingVertical: 8
  },
  primaryButton: {
    borderRadius: 20
  },
  primaryContent: {
    paddingVertical: 6
  },
  secondaryButton: {
    borderRadius: 20
  },
  helper: {
    textAlign: 'center'
  },
  message: {
    textAlign: 'center',
    fontWeight: '600'
  }
});
