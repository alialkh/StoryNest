import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Menu, Surface, Text, TextInput, useTheme, SegmentedButtons, IconButton } from 'react-native-paper';
import { stripSuggestion, extractSuggestion } from '../utils/text';
import { getGenreTheme } from '../theme/genreBackgrounds';
import { useStoryStore } from '../store/storyStore';
import type { Story } from '../types';
import { AppScaffold, type HeaderAction } from '../components/AppScaffold';
import { FormattedText } from '../components/FormattedText';
import { ZoomableText } from '../components/ZoomableText';
import { useThemeStore } from '../store/themeStore';

interface Props {
  story: Story;
  onBack: () => void;
}


export const ContinuationScreen: React.FC<Props> = ({ story, onBack }) => {
  const generateStory = useStoryStore((state) => state.generateStory);
  const remaining = useStoryStore((state) => state.remaining);
  const fetchStories = useStoryStore((state) => state.fetchStories);
  const allStories = useStoryStore((state) => state.stories);
  const updateStoryTitle = useStoryStore((state) => state.updateStoryTitle);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(story?.title || '');

  // start with an empty thread; rebuild from store on mount / when stories change
  const [parts, setParts] = useState<Story[]>([]);
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.mode);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    // ensure store is up-to-date
    void fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    // rebuild the conversation thread from the global stories list
    if (!story) {
      setParts([]);
      return;
    }

    // Prefer the authoritative persisted record from the store if available
    const root = allStories.find((s) => s.id === story.id) ?? story;

    const thread: Story[] = [root];
    // walk forward: find continuations whose continued_from_id === last.id
    let next = allStories.find((s) => s.continued_from_id === thread[thread.length - 1].id);
    while (next) {
      thread.push(next);
      next = allStories.find((s) => s.continued_from_id === thread[thread.length - 1].id);
    }

    setParts(thread);
    // Update title text whenever parts change
    if (thread[0]?.title) {
      setTitleText(thread[0].title);
    }
  }, [allStories, story?.id]);

  // suggestion extracted from the latest part
  const suggestion = useMemo(() => extractSuggestion(parts[parts.length - 1]?.content), [parts]);
  
  // Get the root story's genre for themed header color
  const rootStory = useMemo(() => parts[0] ?? story, [parts, story]);
  const genreTheme = useMemo(() => getGenreTheme(rootStory?.genre), [rootStory?.genre]);

  const handleContinue = () => {
    setLoading(true);
    void generateStory({ prompt: prompt || 'Continue the story', continuedFromId: story.id }).then((created) => {
      setLoading(false);
      if (created) {
        setMessage('Continuation generated!');
        // append locally so UI updates immediately
        setParts((prev) => [...prev, created]);
      }
    });
  };

  return (
    <AppScaffold 
      title={parts[0]?.title || 'Story'} 
      subtitle="Continue your tale" 
      onBack={onBack}
      headerActions={[
        {
          key: 'edit-title',
          icon: 'pencil',
          label: 'Edit title',
          onPress: () => setEditingTitle(!editingTitle)
        }
      ]}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Story Title Editing - Hidden, Moved to Header */}
        {editingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={titleText}
            onChangeText={setTitleText}
            placeholder="Edit title..."
            mode="outlined"
            onBlur={() => {
              if (titleText && titleText !== story?.title) {
                updateStoryTitle(story!.id, titleText);
              }
              setEditingTitle(false);
            }}
          />
        ) : null}

        {/* Story Parts */}
        {parts.map((part, idx) => (
          <Surface key={part.id ?? idx} style={[styles.originalCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {idx === 0 ? (part.prompt || 'Original prompt') : (part.prompt || 'Continuation')}
            </Text>
            <ZoomableText 
              content={stripSuggestion(part.content)} 
              variant="bodyMedium" 
              style={[styles.original, { color: theme.colors.onSurface }]}
            />
          </Surface>
        ))}
        <TextInput
          label="Next chapter direction (optional)"
          value={prompt}
          onChangeText={setPrompt}
          mode="outlined"
          multiline
          style={styles.input}
          // show the AI suggestion as a placeholder (grayed) but don't fill the value
          placeholder={prompt.trim() ? '' : (suggestion ?? 'Introduce a new twist with an unexpected ally')}
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
      </KeyboardAvoidingView>
    </AppScaffold>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingTop: 8,
    gap: 20,
    paddingHorizontal: 0
  },
  titleWithMenuContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden'
  },
  titleCard: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    gap: 4
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleInput: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 12
  },
  originalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    marginHorizontal: 16
  },
  original: {
    lineHeight: 20
  },
  input: {
    backgroundColor: 'transparent',
    marginHorizontal: 16
  },
  footer: {
    gap: 12,
    marginHorizontal: 16
  },
  message: {
    fontWeight: '600'
  },
  themePicker: {
    borderRadius: 16,
    padding: 12,
    gap: 8
  }
});
