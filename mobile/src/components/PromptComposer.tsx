import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, SegmentedButtons } from 'react-native-paper';

type Mode = 'standard' | 'continuation';

interface Props {
  onSubmit: (payload: { prompt: string; genre?: string | null; tone?: string | null }) => void;
  disabled?: boolean;
  remaining?: number | null;
  onModeChange?: (mode: Mode) => void;
}

const tones = ['Emotional', 'Playful', 'Dark', 'Hopeful'];
const genres = ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery'];

export const PromptComposer: React.FC<Props> = ({ onSubmit, disabled, remaining, onModeChange }) => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('standard');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!prompt.trim()) {
      setError('Please describe your story idea.');
      return;
    }
    setError('');
    onSubmit({ prompt: prompt.trim(), tone, genre });
    setPrompt('');
  };

  const handleModeChange = (value: string) => {
    const next = (value || 'standard') as Mode;
    setMode(next);
    onModeChange?.(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.heading}>
          Craft a story spark
        </Text>
        <Text variant="bodySmall" style={styles.caption}>
          Choose a tone or genre for a more magical result.
        </Text>
      </View>
      <SegmentedButtons
        value={mode}
        onValueChange={handleModeChange}
        style={styles.segmented}
        buttons={[
          { value: 'standard', label: 'New story' },
          { value: 'continuation', label: 'Continue later' }
        ]}
      />
      <TextInput
        label="Your prompt"
        value={prompt}
        onChangeText={setPrompt}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        placeholder="A detective who realizes he's investigating himself"
      />
      <HelperText type={error ? 'error' : 'info'} visible style={styles.helper}>
        {error ||
          (remaining === null
            ? 'Premium unlocked — unlimited stories.'
            : `${remaining ?? 3} stories remaining today.`)}
      </HelperText>
      <View style={styles.row}>
        <SegmentedButtons
          value={tone ?? ''}
          onValueChange={(value) => setTone(value || null)}
          buttons={tones.map((label) => ({ value: label, label }))}
          style={styles.segmented}
        />
      </View>
      <View style={styles.row}>
        <SegmentedButtons
          value={genre ?? ''}
          onValueChange={(value) => setGenre(value || null)}
          buttons={genres.map((label) => ({ value: label, label }))}
          style={styles.segmented}
        />
      </View>
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={disabled}
        icon="sparkles"
        contentStyle={styles.generateContent}
        style={styles.generateButton}
      >
        Generate story
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    shadowColor: '#1F1F46',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  header: {
    gap: 4
  },
  heading: {
    color: '#312E81'
  },
  caption: {
    color: '#433C68'
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)'
  },
  row: {
    marginVertical: 4
  },
  segmented: {
    marginBottom: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: 16
  },
  helper: {
    color: '#4C1D95'
  },
  generateButton: {
    borderRadius: 18
  },
  generateContent: {
    paddingVertical: 6
  }
});
