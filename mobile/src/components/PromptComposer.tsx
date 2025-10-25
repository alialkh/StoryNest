import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput, SegmentedButtons } from 'react-native-paper';

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
      <HelperText type={error ? 'error' : 'info'} visible>
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
      <Button mode="contained" onPress={handleSubmit} disabled={disabled} icon="sparkles">
        Generate story
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  input: {
    backgroundColor: 'white'
  },
  row: {
    marginVertical: 4
  },
  segmented: {
    marginBottom: 8
  }
});
