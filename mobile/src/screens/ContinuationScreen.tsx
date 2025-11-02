import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { AppScaffold } from '../components/AppScaffold';

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
  const theme = useTheme();

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
    <AppScaffold title="Continue the tale" subtitle="Add a prompt or let StoryNest improvise the next chapter" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.originalCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
            Previous chapter
          </Text>
          <Text variant="bodyMedium" style={[styles.original, { color: theme.colors.onSurface }]}> 
            {story.content}
          </Text>
        </Surface>
        <TextInput
          label="Direction for the next part"
          value={prompt}
          onChangeText={setPrompt}
          mode="outlined"
          multiline
          style={styles.input}
          placeholder="Introduce a new twist with an unexpected ally"
        />
        {message ? (
          <Text style={[styles.message, { color: theme.colors.tertiary }]}>{message}</Text>
        ) : null}
        <View style={styles.footer}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {remaining === null ? 'Unlimited continuations available.' : `${remaining ?? 3} stories remaining today.`}
          </Text>
          <Button mode="contained" onPress={handleContinue} loading={loading} icon="auto-fix">
            Generate continuation
          </Button>
        </View>
      </ScrollView>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingTop: 8,
    gap: 20
  },
  originalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12
  },
  original: {
    lineHeight: 20
  },
  input: {
    backgroundColor: 'transparent'
  },
  footer: {
    gap: 12
  },
  message: {
    fontWeight: '600'
  }
});
