import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Pressable, FlatList } from 'react-native';
import { Button, Menu, Surface, Text, TextInput as PaperTextInput, useTheme, SegmentedButtons, IconButton } from 'react-native-paper';
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
  const [wordCount, setWordCount] = useState(200);

  // start with an empty thread; rebuild from store on mount / when stories change
  const [parts, setParts] = useState<Story[]>([]);
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.mode);
  const [menuVisible, setMenuVisible] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const titleInputRef = useRef<any>(null);
  const wordCountScrollRef = useRef<FlatList<number> | null>(null);

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
    void generateStory({ prompt: prompt || 'Continue the story', wordCount, continuedFromId: story.id }).then((created) => {
      setLoading(false);
      if (created) {
        setMessage('Continuation generated!');
        // append locally so UI updates immediately
        setParts((prev) => [...prev, created]);
      }
    });
  };

  const handleToggleTitleEditing = useCallback(() => {
    setEditingTitle((prev) => {
      const next = !prev;
      if (!prev && next) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          titleInputRef.current?.focus();
        });
      }
      return next;
    });
  }, []);

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
          onPress: handleToggleTitleEditing
        }
      ]}
    >
      <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* Story Title Editing - Hidden, Moved to Header */}
          {editingTitle ? (
            <PaperTextInput
              ref={titleInputRef}
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
          {/* Word Count Selector */}
          <View style={styles.wordCountContainer}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 16 }}>
              Response length: <Text style={{ fontWeight: '600', color: theme.colors.primary }}>{wordCount} words</Text>
            </Text>
            <FlatList
              ref={wordCountScrollRef}
              horizontal
              data={[100, 200, 300, 400]}
              keyExtractor={(item) => item.toString()}
              scrollEventThrottle={16}
              contentContainerStyle={styles.wordCountScroll}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setWordCount(item)}
                  style={[
                    styles.wordCountButton,
                    {
                      backgroundColor: wordCount === item ? theme.colors.primary : theme.colors.surfaceVariant,
                      borderColor: wordCount === item ? theme.colors.primary : theme.colors.outlineVariant
                    }
                  ]}
                >
                  <Text
                    variant="labelMedium"
                    style={{
                      color: wordCount === item ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                      fontWeight: wordCount === item ? '600' : '500'
                    }}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>
          <PaperTextInput
            label="Next chapter direction (optional)"
            value={prompt}
            onChangeText={setPrompt}
            mode="outlined"
            multiline
            style={styles.input}
            placeholder={suggestion ?? 'Introduce a new twist with an unexpected ally'}
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
  },
  wordCountContainer: {
    gap: 8
  },
  wordCountScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4
  },
  wordCountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70
  }
});
