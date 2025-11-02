import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';

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
  const theme = useTheme();

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
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Craft a story spark
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Choose a tone or genre for a more magical result.
        </Text>
      </View>
      <SegmentedButtons
        value={mode}
        onValueChange={handleModeChange}
        style={[styles.segmented, { backgroundColor: theme.colors.surfaceVariant }]}
        buttons={[
          { value: 'standard', label: 'New story', icon: 'auto-fix' },
          { value: 'continuation', label: 'Continue later', icon: 'progress-pencil' }
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
      <HelperText type={error ? 'error' : 'info'} visible style={{ color: error ? theme.colors.error : theme.colors.secondary }}>
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
          style={[styles.segmented, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      </View>
      <View style={styles.row}>
        <SegmentedButtons
          value={genre ?? ''}
          onValueChange={(value) => setGenre(value || null)}
          buttons={genres.map((label) => ({ value: label, label }))}
          style={[styles.segmented, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      </View>
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={disabled}
        icon="auto-fix"
        contentStyle={styles.generateContent}
        style={styles.generateButton}
      >
        Generate story
      </Button>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    borderRadius: 24
  },
  header: {
    gap: 4
  },
  row: {
    marginVertical: 4
  },
  segmented: {
    marginBottom: 8,
    borderRadius: 16
  },
  input: {
    backgroundColor: 'transparent'
  },
  generateButton: {
    borderRadius: 18
  },
  generateContent: {
    paddingVertical: 6
  }
});
