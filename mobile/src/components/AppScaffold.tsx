import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Divider, IconButton, List, Modal, Portal, Surface, Text, useTheme, Menu } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useGamificationStore } from '../store/gamificationStore';
import { EnchantedBackground } from './EnchantedBackground';
import { BottomBar } from './BottomBar';
import { THEMES } from '../theme/themes';

export interface SidebarAction {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
}

export interface HeaderAction {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface Props {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  sidebarActions?: SidebarAction[];
  headerActions?: HeaderAction[];
  children: React.ReactNode;
}

export const AppScaffold: React.FC<Props> = ({ children, title, subtitle, onBack, sidebarActions, headerActions }) => {
  const theme = useTheme();
  const mode = useThemeStore((state) => state.mode);
  const colorTheme = useThemeStore((state) => state.colorTheme);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const setColorTheme = useThemeStore((state) => state.setColorTheme);
  const stats = useGamificationStore((state) => state.stats);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Calculate user's XP for theme unlocking
  const userXp = stats?.total_xp ?? 0;
  
  // Filter themes based on XP
  const unlockedThemes = useMemo(() => {
    return Object.values(THEMES).filter(t => t.unlocksAtXp <= userXp);
  }, [userXp]);

  const handleToggleTheme = useCallback(() => {
    void toggleMode();
  }, [toggleMode]);

  const handleSelectTheme = useCallback((themeId: string) => {
    void setColorTheme(themeId as any);
    setMenuVisible(false);
  }, [setColorTheme]);

  const actions = sidebarActions ?? [];

  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + 32 : 0;

  return (
    <EnchantedBackground>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <IconButton
              icon={onBack ? 'arrow-left' : 'menu'}
              mode="contained-tonal"
              onPress={onBack ?? (() => setSidebarVisible(true))}
              size={22}
            />
            <View style={styles.headerText}>
              {title ? (
                <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <IconButton
              icon="dots-horizontal"
              size={22}
              mode="contained-tonal"
              onPress={() => setMenuVisible(true)}
            />
          </Surface>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline, opacity: 0.2 }]} />
          <View style={styles.body}>{children}</View>
          <BottomBar />
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Portal>
        <Modal
          visible={sidebarVisible}
          onDismiss={() => setSidebarVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={[styles.sidebar, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={styles.sidebarHeader}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                StoryNest
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Tailor your experience
              </Text>
            </View>
            <List.Section style={styles.listSection}>
              <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>Quick links</List.Subheader>
              {actions.map((action) => (
                <List.Item
                  key={action.key}
                  title={action.label}
                  titleStyle={{ color: theme.colors.onSurface }}
                  left={(props) => <List.Icon {...props} icon={action.icon} color={theme.colors.primary} />}
                  onPress={() => {
                    setSidebarVisible(false);
                    action.onPress();
                  }}
                />
              ))}
            </List.Section>
          </Surface>
        </Modal>
        <Modal
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          contentContainerStyle={styles.menuModalContainer}
        >
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setMenuVisible(false)}
          />
          <Surface style={[styles.menuPopup, { backgroundColor: theme.colors.surface }]} elevation={2}>
            {headerActions && headerActions.length > 0 && (
              <>
                <List.Section style={styles.listSection}>
                  <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>Actions</List.Subheader>
                  {headerActions.map((action) => (
                    <List.Item
                      key={action.key}
                      title={action.label}
                      titleStyle={{ color: theme.colors.onSurface }}
                      left={(props) => <List.Icon {...props} icon={action.icon} color={theme.colors.primary} />}
                      onPress={() => {
                        setMenuVisible(false);
                        action.onPress();
                      }}
                    />
                  ))}
                </List.Section>
                <Divider style={{ marginVertical: 4 }} />
              </>
            )}
            <List.Section style={styles.listSection}>
              <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>Display</List.Subheader>
              <List.Item
                title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
                titleStyle={{ color: theme.colors.onSurface }}
                left={(props) => (
                  <List.Icon 
                    {...props} 
                    icon={mode === 'dark' ? 'white-balance-sunny' : 'weather-night'} 
                    color={theme.colors.primary}
                  />
                )}
                onPress={() => {
                  handleToggleTheme();
                  setMenuVisible(false);
                }}
              />
            </List.Section>
            <Divider style={{ marginVertical: 4 }} />
            <List.Section style={styles.listSection}>
              <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>Themes</List.Subheader>
              {Object.values(THEMES).map((t) => {
                const isUnlocked = t.unlocksAtXp <= userXp;
                return (
                  <List.Item
                    key={t.id}
                    title={`${t.name}${isUnlocked ? '' : ` (Unlock at ${t.unlocksAtXp} XP)`}`}
                    titleStyle={{ color: theme.colors.onSurface, opacity: isUnlocked ? 1 : 0.6 }}
                    left={(props) => (
                      <List.Icon 
                        {...props} 
                        icon={isUnlocked ? 'palette' : 'lock'} 
                        color={isUnlocked ? theme.colors.primary : theme.colors.outline}
                      />
                    )}
                    right={() => colorTheme === t.id ? <List.Icon icon="check" color={theme.colors.primary} /> : undefined}
                    onPress={() => isUnlocked && handleSelectTheme(t.id)}
                    disabled={!isUnlocked}
                  />
                );
              })}
            </List.Section>
          </Surface>
        </Modal>
      </Portal>
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  keyboardAvoider: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 12
  },
  headerText: {
    flex: 1,
    marginHorizontal: 16
  },
  title: {
    letterSpacing: 0.3
  },
  subtitle: {
    marginTop: 4
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 16,
    marginHorizontal: 32
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 88,
    paddingTop: 16
  },
  modalContainer: {
    justifyContent: 'flex-start'
  },
  menuModalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  menuPopup: {
    borderRadius: 24,
    paddingVertical: 8,
    overflow: 'hidden',
    maxWidth: '85%',
    maxHeight: '80%'
  },
  sidebar: {
    marginHorizontal: 24,
    marginTop: 0,
    borderRadius: 28,
    paddingVertical: 16,
    overflow: 'hidden'
  },
  sidebarHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 4
  },
  listSection: {
    paddingHorizontal: 12
  }
});
