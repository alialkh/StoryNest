import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';

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
    <ScrollView contentContainerStyle={styles.container}>
      <Button icon="arrow-left" onPress={onBack} style={styles.back}>
        Back
      </Button>
      <Text variant="headlineSmall" style={styles.title}>
        Continue story
      </Text>
      <Text variant="bodyMedium" style={styles.original}>
        {story.content}
      </Text>
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
        <Text variant="labelSmall">
          {remaining === null
            ? 'Unlimited continuations available.'
            : `${remaining ?? 3} stories remaining today.`}
        </Text>
        <Button mode="contained" onPress={handleContinue} loading={loading}>
          Generate continuation
        </Button>
      </View>
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
  original: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 8
  },
  input: {
    backgroundColor: 'white'
  },
  footer: {
    gap: 12
  },
  message: {
    color: '#10B981'
  }
});
