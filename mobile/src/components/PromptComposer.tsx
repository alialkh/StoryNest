import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { generateNewSuggestion } from '../utils/text';

type Mode = 'standard' | 'continuation';

interface Props {
  onSubmit: (payload: { prompt: string; genre?: string | null; tone?: string | null }) => void;
  disabled?: boolean;
  remaining?: number | null;
  onModeChange?: (mode: Mode) => void;
  suggestion?: string | null;
}

const tones = ['Emotional', 'Playful', 'Dark', 'Hopeful'] as const;
const genres = ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Adventure', 'Journey', 'Medieval', 'Historical', 'Thriller', 'Horror'] as const;

type ToneOption = (typeof tones)[number];
type GenreOption = (typeof genres)[number];

const defaultPlaceholder = "A detective who realizes he's investigating himself.";

const genreExamples: Record<GenreOption, string> = {
  Fantasy: 'An apprentice mage forging a peace treaty between dragons and humans.',
  'Sci-Fi': 'A shuttle mechanic uncovering a glitchy AI haunting the station.',
  Romance: 'Two rival bakers anonymously swapping love-soaked recipes.',
  Mystery: 'A sleepwalking witness piecing together a crime scene from dreams.',
  Adventure: 'A map arrives with a route that changes each sunrise.',
  Journey: 'A traveler collects stories from every tavern on the road.',
  Medieval: 'A squire hides a secret that could topple a throne.',
  Historical: 'A forgotten telegram reshapes a town’s legacy.',
  Thriller: 'A stranger leaves a breadcrumb trail only you can see.',
  Horror: 'A lullaby hums from rooms that should be empty.'
};

const toneDescriptors: Record<ToneOption, string> = {
  Emotional: 'Told through tender diary entries.',
  Playful: 'Sprinkled with mischievous asides and witty banter.',
  Dark: 'Shrouded in ominous whispers and creeping dread.',
  Hopeful: 'Ending with a quiet promise of brighter tomorrows.'
};

export const PromptComposer: React.FC<Props> = ({ onSubmit, disabled, remaining, onModeChange, suggestion }) => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<ToneOption | null>(null);
  const [genre, setGenre] = useState<GenreOption | null>(null);
  const [mode, setMode] = useState<Mode>('standard');
  const [error, setError] = useState('');
  const theme = useTheme();

  const placeholder = useMemo(() => {
    // If an external suggestion is provided and the user hasn't typed anything, show it as the placeholder
    if (suggestion && !prompt.trim()) return suggestion;

    // If the user selected a genre and hasn't typed anything, offer a genre-specific suggestion
    if (genre && !prompt.trim()) {
      return generateNewSuggestion(undefined, genre as string);
    }

    const base = genre ? genreExamples[genre] : defaultPlaceholder;
    if (!tone) {
      return base;
    }

    const descriptor = toneDescriptors[tone];
    return `${base} ${descriptor}`;
  }, [genre, tone, suggestion, prompt]);

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

  // Note: suggestions are shown as placeholders only — we don't auto-fill the input value.

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
        placeholder={placeholder}
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
          onValueChange={(value) => setTone((value || null) as ToneOption | null)}
          buttons={tones.map((label) => ({ value: label, label }))}
          style={[styles.segmented, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      </View>
      <View style={styles.row}>
        <SegmentedButtons
          value={genre ?? ''}
          onValueChange={(value) => setGenre((value || null) as GenreOption | null)}
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
