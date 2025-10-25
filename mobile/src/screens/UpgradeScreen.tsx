import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import { useStoryStore } from '../store/storyStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

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
    <ScrollView contentContainerStyle={styles.container}>
      <Button icon="arrow-left" onPress={onBack} style={styles.back}>
        Back
      </Button>
      <Text variant="headlineMedium" style={styles.title}>
        Unlock StoryNest Premium
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Unlimited stories, custom genres, and ongoing story arcs for $3.99/month.
      </Text>
      <List.Section>
        <List.Item title="Unlimited story generations" left={(props) => <List.Icon {...props} icon="infinity" />} />
        <List.Item title="Advanced tones & genres" left={(props) => <List.Icon {...props} icon="palette" />} />
        <List.Item title="Continue stories seamlessly" left={(props) => <List.Icon {...props} icon="timeline-text" />} />
        <List.Item title="Save and share without limits" left={(props) => <List.Icon {...props} icon="share-variant" />} />
      </List.Section>
      <Button mode="contained" onPress={handleUpgrade} loading={loading} icon="crown">
        Go Premium
      </Button>
      <Button mode="outlined" onPress={handleMockUpgrade} disabled={loading}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16
  },
  back: {
    alignSelf: 'flex-start'
  },
  title: {
    marginBottom: 8
  },
  subtitle: {
    marginBottom: 16
  },
  helper: {
    color: '#4B5563'
  },
  message: {
    color: '#2563EB'
  }
});
