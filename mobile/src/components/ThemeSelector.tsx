import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme, ProgressBar, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGamificationStore } from '../store/gamificationStore';
import { THEMES } from '../theme/themes';

export const ThemeSelector: React.FC = () => {
  const theme = useTheme();
  const stats = useGamificationStore((state) => state.stats);
  const userXp = stats?.total_xp ?? 0;
  
  // Get sorted themes by XP threshold
  const sortedThemes = Object.values(THEMES).sort((a, b) => a.unlocksAtXp - b.unlocksAtXp);
  
  // Find next theme to unlock
  const nextTheme = sortedThemes.find(t => t.unlocksAtXp > userXp);
  const xpToNextTheme = nextTheme ? nextTheme.unlocksAtXp - userXp : 0;
  const maxXpForProgress = nextTheme ? nextTheme.unlocksAtXp : userXp;
  const progressToNext = nextTheme ? (userXp - (nextTheme.unlocksAtXp - (nextTheme.unlocksAtXp - (sortedThemes[sortedThemes.indexOf(nextTheme) - 1]?.unlocksAtXp ?? 0)))) / (nextTheme.unlocksAtXp - (sortedThemes[sortedThemes.indexOf(nextTheme) - 1]?.unlocksAtXp ?? 0)) : 1;

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
        🎨 Theme Progression
      </Text>
      
      {/* Progress to next theme */}
      {nextTheme && (
        <View style={styles.nextThemeSection}>
          <View style={styles.nextThemeHeader}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
              Next: {nextTheme.name}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {userXp} / {nextTheme.unlocksAtXp} XP
            </Text>
          </View>
          <ProgressBar 
            progress={Math.min(userXp / nextTheme.unlocksAtXp, 1)} 
            style={styles.progressBar}
            color={theme.colors.primary}
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {xpToNextTheme} XP to unlock
          </Text>
        </View>
      )}

      {/* All themes */}
      <View style={styles.themesList}>
        {sortedThemes.map((t) => {
          const isUnlocked = t.unlocksAtXp <= userXp;
          return (
            <Card 
              key={t.id} 
              style={[
                styles.themeCard,
                {
                  backgroundColor: isUnlocked ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                  opacity: isUnlocked ? 1 : 0.6
                }
              ]}
            >
              <Card.Content>
                <View style={styles.themeCardContent}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.themeTitle}>
                      <MaterialCommunityIcons
                        name={isUnlocked ? 'check-circle' : 'lock'}
                        size={20}
                        color={isUnlocked ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant}
                      />
                      <Text 
                        variant="titleSmall" 
                        style={{ 
                          color: isUnlocked ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                          marginLeft: 8,
                          fontWeight: '600'
                        }}
                      >
                        {t.name}
                      </Text>
                    </View>
                    <Text 
                      variant="bodySmall" 
                      style={{ 
                        color: isUnlocked ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                        marginTop: 4,
                        opacity: 0.8
                      }}
                    >
                      {t.description}
                    </Text>
                    {!isUnlocked && (
                      <Text 
                        variant="labelSmall" 
                        style={{ 
                          color: theme.colors.onSurfaceVariant,
                          marginTop: 4,
                          fontStyle: 'italic'
                        }}
                      >
                        Unlock at {t.unlocksAtXp} XP
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 24,
    gap: 12
  },
  nextThemeSection: {
    marginBottom: 16,
    gap: 8
  },
  nextThemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressBar: {
    height: 6,
    borderRadius: 3
  },
  themesList: {
    gap: 12
  },
  themeCard: {
    borderRadius: 16
  },
  themeCardContent: {
    gap: 8
  },
  themeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  themeRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  themeContent: {
    gap: 4
  }
});
