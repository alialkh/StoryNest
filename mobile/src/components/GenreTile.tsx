import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { GenreTheme } from '../theme/genreBackgrounds';

interface Props {
  genre: string;
  theme: GenreTheme;
  selected?: boolean;
  onPress: () => void;
}

export const GenreTile: React.FC<Props> = ({ genre, theme, selected, onPress }) => {
  const paperTheme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.tile, selected && styles.tileSelected]}>
      <Surface
        style={[
          styles.surface,
          {
            backgroundColor: selected ? theme.color : paperTheme.colors.surface,
            borderColor: theme.color,
            borderWidth: selected ? 0 : 2
          }
        ]}
        elevation={selected ? 4 : 1}
      >
        <View style={[styles.iconContainer, { opacity: selected ? 1 : 0.7 }]}>
          <MaterialCommunityIcons
            name={theme.icon as any}
            size={32}
            color={selected ? '#FFFFFF' : theme.color}
          />
        </View>
        <Text
          variant="labelMedium"
          style={[
            styles.label,
            { color: selected ? '#FFFFFF' : paperTheme.colors.onSurface }
          ]}
          numberOfLines={1}
        >
          {genre}
        </Text>
        <Text
          variant="bodySmall"
          style={[
            styles.description,
            { color: selected ? 'rgba(255,255,255,0.85)' : paperTheme.colors.onSurfaceVariant }
          ]}
          numberOfLines={2}
        >
          {theme.description}
        </Text>
      </Surface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '48%',
    margin: 6
  },
  tileSelected: {
    transform: [{ scale: 1.02 }]
  },
  surface: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 140
  },
  iconContainer: {
    marginBottom: 4
  },
  label: {
    fontWeight: '600',
    textAlign: 'center'
  },
  description: {
    textAlign: 'center',
    marginTop: 4
  }
});
