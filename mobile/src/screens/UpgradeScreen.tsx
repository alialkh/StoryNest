import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import { useStoryStore } from '../store/storyStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { EnchantedBackground } from '../components/EnchantedBackground';

interface Props {
  onBack: () => void;
}

export const UpgradeScreen: React.FC<Props> = ({ onBack }) => {
  const user = useAuthStore((state) => state.user);
  const remaining = useStoryStore((state) => state.remaining);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    <EnchantedBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={onBack} mode="contained-tonal" style={styles.back}>
            Back
          </Button>
          <View style={styles.headerText}>
            <Text variant="headlineMedium" style={styles.title}>
              Unlock StoryNest Premium
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Unlimited stories, custom genres, and ongoing arcs for $3.99/month.
            </Text>
          </View>
        </View>
        <List.Section style={styles.list}>
          <List.Item
            title="Unlimited story generations"
            description="Dream up as many chapters as you like."
            left={(props) => <List.Icon {...props} icon="infinity" />}
          />
          <List.Item
            title="Advanced tones & genres"
            description="Unlock whimsical palettes tailored to your mood."
            left={(props) => <List.Icon {...props} icon="palette" />}
          />
          <List.Item
            title="Continue stories seamlessly"
            description="Keep adventures rolling with linked chapters."
            left={(props) => <List.Icon {...props} icon="timeline-text" />}
          />
          <List.Item
            title="Save and share without limits"
            description="Collect favourites and share with friends."
            left={(props) => <List.Icon {...props} icon="share-variant" />}
          />
        </List.Section>
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
        <Button mode="outlined" onPress={handleMockUpgrade} disabled={loading} style={styles.secondaryButton}>
          Activate mock premium
        </Button>
        <Text variant="labelSmall" style={styles.helper}>
          {user?.tier === 'PREMIUM'
            ? 'You already have unlimited access. Thank you!'
            : remaining === null
            ? 'Premium active.'
            : `Free tier: ${remaining ?? 3} stories left today.`}
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
    paddingTop: 32,
    gap: 20
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  headerText: {
    flex: 1,
    gap: 6
  },
  back: {
    alignSelf: 'flex-start'
  },
  title: {
    color: '#312E81'
  },
  subtitle: {
    color: '#433C68'
  },
  list: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: '#1F2937',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
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
    color: '#4B5563'
  },
  message: {
    color: '#2563EB'
  }
});
