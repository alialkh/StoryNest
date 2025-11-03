import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GenreTile } from '../components/GenreTile';
import { LoadingModal } from '../components/LoadingModal';
import { genreThemes, getGenreTheme } from '../theme/genreBackgrounds';
import { generateNewSuggestion } from '../utils/text';

interface Props {
  onCancel: () => void;
  onSubmit: (payload: { prompt: string; genre?: string | null; tone?: string | null; archetype?: string | null }) => Promise<void>;
  disabled?: boolean;
  remaining?: number | null;
}

type ToneOption = 'Emotional' | 'Playful' | 'Dark' | 'Hopeful';
type ArchetypeOption = 'Hero' | 'Mentor' | 'Trickster' | 'Guardian' | 'Lover' | 'Creator';

const tones = ['Emotional', 'Playful', 'Dark', 'Hopeful'] as const;
const archetypes = ['Hero', 'Mentor', 'Trickster', 'Guardian', 'Lover', 'Creator'] as const;

export const NewStoryWizard: React.FC<Props> = ({ onCancel, onSubmit, disabled, remaining }) => {
  const theme = useTheme();
  const [step, setStep] = useState<'genre' | 'tone' | 'archetype' | 'prompt'>('genre');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneOption | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeOption | null>(null);
  const [customArchetype, setCustomArchetype] = useState('');
  const [isCustomArchetypeMode, setIsCustomArchetypeMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Determine the step safely
  const currentStep = step === 'genre' ? 'genre' : step === 'tone' ? 'tone' : step === 'archetype' ? 'archetype' : 'prompt';

  const genreList = Object.entries(genreThemes);
  const selectedGenreTheme = selectedGenre ? getGenreTheme(selectedGenre) : null;

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setStep('tone');
  };

  const handleToneSelect = (tone: string) => {
    setSelectedTone(tone as ToneOption);
    setStep('archetype');
  };

  const handleArchetypeSelect = (archetype: string) => {
    setSelectedArchetype(archetype as ArchetypeOption);
    setCustomArchetype('');
    setStep('prompt');
  };

  const handleCustomArchetypeSubmit = () => {
    if (!customArchetype.trim()) {
      setError('Please describe your character archetype.');
      return;
    }
    setSelectedArchetype(null);
    setStep('prompt');
  };

  const handlePromptSubmit = () => {
    if (!prompt.trim()) {
      setError('Please describe your story idea.');
      return;
    }
    setError('');
    setIsGenerating(true);
    void (async () => {
      await onSubmit({
        prompt: prompt.trim(),
        genre: selectedGenre,
        tone: selectedTone,
        archetype: customArchetype.trim() || selectedArchetype
      });
      // Hide loading modal after 1 second to show success state
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    })();
  };

  const progressText = currentStep === 'genre' ? '1/4' : currentStep === 'tone' ? '2/4' : currentStep === 'archetype' ? '3/4' : '4/4';
  const pageTitle =
    currentStep === 'genre'
      ? 'What kind of story?'
      : currentStep === 'tone'
        ? 'What tone?'
        : currentStep === 'archetype'
          ? 'Choose a character'
          : 'Your story spark';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <LoadingModal visible={isGenerating} message="Creating your story..." />
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {pageTitle}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Step {progressText}
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

      {/* Genre Step */}
      {currentStep === 'genre' && (
        <FlatList
          data={genreList}
          numColumns={2}
          contentContainerStyle={styles.genreGrid}
          keyExtractor={([g]) => g}
          renderItem={({ item: [genre, genreTheme] }) => (
            <GenreTile
              genre={genre}
              theme={genreTheme}
              selected={selectedGenre === genre}
              onPress={() => handleGenreSelect(genre)}
            />
          )}
          scrollEnabled
          nestedScrollEnabled
        />
      )}

      {/* Tone Step */}
      {currentStep === 'tone' && selectedGenreTheme && (
        <ScrollView contentContainerStyle={styles.toneContainer} showsVerticalScrollIndicator={false}>
          <Surface style={[styles.genreBadge, { backgroundColor: selectedGenreTheme.color }]} elevation={2}>
            <Text
              variant="titleMedium"
              style={{ color: '#FFFFFF', textAlign: 'center' }}
            >
              {selectedGenre}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}
            >
              {selectedGenreTheme.description}
            </Text>
          </Surface>

          <View style={styles.toneButtons}>
            {tones.map((tone) => (
              <Button
                key={tone}
                mode={selectedTone === tone ? 'contained' : 'outlined'}
                onPress={() => handleToneSelect(tone)}
                style={[
                  styles.toneButton,
                  selectedTone === tone && { backgroundColor: selectedGenreTheme.color }
                ]}
              >
                {tone}
              </Button>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Archetype Step */}
      {currentStep === 'archetype' && selectedGenreTheme && (
        <ScrollView contentContainerStyle={styles.archetypeContainer} showsVerticalScrollIndicator={false}>
          <Surface style={[styles.genreBadge, { backgroundColor: selectedGenreTheme.color }]} elevation={2}>
            <Text
              variant="titleMedium"
              style={{ color: '#FFFFFF', textAlign: 'center' }}
            >
              {selectedGenre} • {selectedTone}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8 }}
            >
              Who is your main character?
            </Text>
          </Surface>

          {!isCustomArchetypeMode ? (
            <>
              <View style={styles.archetypeGrid}>
                {archetypes.map((archetype) => (
                  <Button
                    key={archetype}
                    mode={selectedArchetype === archetype ? 'contained' : 'outlined'}
                    onPress={() => handleArchetypeSelect(archetype)}
                    style={[
                      styles.archetypeButton,
                      selectedArchetype === archetype && { backgroundColor: selectedGenreTheme.color }
                    ]}
                  >
                    {archetype}
                  </Button>
                ))}
              </View>
              <Button
                mode="text"
                onPress={() => setIsCustomArchetypeMode(true)}
                icon="pencil"
                style={styles.customArchetypeToggle}
              >
                Create Custom Archetype
              </Button>
            </>
          ) : (
            <>
              <TextInput
                label="Describe your character archetype"
                value={customArchetype}
                onChangeText={(t) => {
                  setCustomArchetype(t);
                  setError('');
                }}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.promptInput}
                placeholder="E.g., 'A cynical detective with a secret past' or 'A magical forest creature'"
              />
              {error ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
              ) : null}
              <Button
                mode="text"
                onPress={() => {
                  setIsCustomArchetypeMode(false);
                  setCustomArchetype('');
                  setError('');
                }}
              >
                ← Back to Presets
              </Button>
            </>
          )}
        </ScrollView>
      )}

      {/* Prompt Step */}
      {currentStep === 'prompt' && selectedGenreTheme && (
        <ScrollView contentContainerStyle={styles.promptContainer} showsVerticalScrollIndicator={false}>
          <Surface style={[styles.genreBadge, { backgroundColor: selectedGenreTheme.color }]} elevation={2}>
            <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
              {selectedGenre} • {selectedTone} • {selectedArchetype}
            </Text>
          </Surface>

          <TextInput
            label="Your story prompt"
            value={prompt}
            onChangeText={(t) => {
              setPrompt(t);
              setError('');
            }}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.promptInput}
            placeholder={generateNewSuggestion(undefined, selectedGenre)}
          />

          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
          ) : null}

          {remaining !== null ? (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {remaining > 0 ? `${remaining} stories remaining today.` : 'Daily limit reached.'}
            </Text>
          ) : (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Premium unlocked — unlimited stories.
            </Text>
          )}
        </ScrollView>
      )}
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Button
          mode="text"
          onPress={currentStep === 'genre' ? onCancel : () => {
            if (currentStep === 'tone') setStep('genre');
            else if (currentStep === 'archetype') setStep('tone');
            else if (currentStep === 'prompt') setStep('archetype');
          }}
          icon={currentStep === 'genre' ? 'close' : 'arrow-left'}
        >
          {currentStep === 'genre' ? 'Cancel' : 'Back'}
        </Button>
        <Button
          mode="contained"
          onPress={
            currentStep === 'tone'
              ? () => setStep('archetype')
              : currentStep === 'archetype'
                ? customArchetype.trim()
                  ? handleCustomArchetypeSubmit
                  : selectedArchetype
                    ? () => setStep('prompt')
                    : undefined
                : currentStep === 'prompt'
                  ? handlePromptSubmit
                  : undefined
          }
          disabled={
            currentStep === 'genre' || disabled || (currentStep === 'prompt' && !prompt.trim()) || (currentStep === 'archetype' && !selectedArchetype && !customArchetype.trim())
          }
          icon={currentStep === 'prompt' ? 'auto-fix' : 'arrow-right'}
        >
          {currentStep === 'prompt' ? 'Generate' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 4
  },
  genreGrid: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'flex-start',
    flexGrow: 1
  },
  toneContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
    flexGrow: 1
  },
  archetypeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
    flexGrow: 1
  },
  genreBadge: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 4,
    marginBottom: 20
  },
  toneButtons: {
    gap: 10
  },
  toneButton: {
    borderRadius: 12
  },
  archetypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  archetypeButton: {
    borderRadius: 12,
    width: '45%'
  },
  customArchetypeToggle: {
    marginTop: 12,
    alignSelf: 'center'
  },
  promptContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
    flexGrow: 1
  },
  promptInput: {
    backgroundColor: 'transparent'
  },
  error: {
    fontWeight: '600',
    textAlign: 'center'
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  }
});
