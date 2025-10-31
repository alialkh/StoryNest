import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { EnchantedBackground } from '../components/EnchantedBackground';

interface Props {
  story: Story;
  onBack: () => void;
}

export const ContinuationScreen: React.FC<Props> = ({ story, onBack }) => {
  const generateStory = useStoryStore((state) => state.generateStory);
  const remaining = useStoryStore((state) => state.remaining);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleContinue = () => {
    setLoading(true);
    void generateStory({ prompt: prompt || 'Continue the story', continuedFromId: story.id }).then((created) => {
      setLoading(false);
      if (created) {
        setMessage('Continuation generated!');
      }
    });
  };

  return (
    <EnchantedBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={onBack} mode="contained-tonal" style={styles.back}>
            Back
          </Button>
          <View>
            <Text variant="headlineSmall" style={styles.title}>
              Continue the tale
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Add a prompt or let StoryNest improvise the next chapter.
            </Text>
          </View>
        </View>
        <View style={styles.originalCard}>
          <Text variant="labelSmall" style={styles.originalLabel}>
            Previous chapter
          </Text>
          <Text variant="bodyMedium" style={styles.original}>
            {story.content}
          </Text>
        </View>
        <TextInput
          label="Direction for the next part"
          value={prompt}
          onChangeText={setPrompt}
          mode="outlined"
          multiline
          style={styles.input}
          placeholder="Introduce a new twist with an unexpected ally"
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.footer}>
          <Text variant="labelSmall" style={styles.reminder}>
            {remaining === null
              ? 'Unlimited continuations available.'
              : `${remaining ?? 3} stories remaining today.`}
          </Text>
          <Button mode="contained" onPress={handleContinue} loading={loading} icon="sparkles">
            Generate continuation
          </Button>
        </View>
      </ScrollView>
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingTop: 32,
    gap: 20
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
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
  originalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    padding: 20,
    gap: 8,
    shadowColor: '#1F2937',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  originalLabel: {
    color: '#5B21B6'
  },
  original: {
    color: '#312E81',
    lineHeight: 20
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)'
  },
  footer: {
    gap: 12
  },
  message: {
    color: '#10B981'
  },
  reminder: {
    color: '#433C68'
  }
});
