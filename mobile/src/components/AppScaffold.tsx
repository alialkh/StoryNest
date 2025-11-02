import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, IconButton, List, Modal, Portal, Surface, Switch, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { EnchantedBackground } from './EnchantedBackground';

export interface SidebarAction {
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
  children: React.ReactNode;
}

export const AppScaffold: React.FC<Props> = ({ children, title, subtitle, onBack, sidebarActions }) => {
  const theme = useTheme();
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleToggleTheme = () => {
    void toggleMode();
  };

  const actions = sidebarActions ?? [];

  return (
    <EnchantedBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
            icon={mode === 'dark' ? 'weather-night' : 'white-balance-sunny'}
            size={22}
            mode="contained-tonal"
            onPress={handleToggleTheme}
            accessibilityLabel="Toggle color scheme"
          />
        </Surface>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline, opacity: 0.2 }]} />
        <View style={styles.body}>{children}</View>
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
            <Divider style={{ marginHorizontal: 24, opacity: 0.3 }} />
            <List.Section style={styles.listSection}>
              <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>Appearance</List.Subheader>
              <List.Item
                title={mode === 'dark' ? 'Dark mode' : 'Light mode'}
                description="Switch between cozy night hues and bright daylight."
                titleStyle={{ color: theme.colors.onSurface }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={mode === 'dark' ? 'weather-night' : 'white-balance-sunny'}
                    color={theme.colors.tertiary}
                  />
                )}
                right={() => <Switch value={mode === 'dark'} onValueChange={handleToggleTheme} />}
                onPress={handleToggleTheme}
              />
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
    paddingBottom: 24,
    paddingTop: 16
  },
  modalContainer: {
    justifyContent: 'flex-start'
  },
  sidebar: {
    marginHorizontal: 24,
    marginTop: 80,
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
