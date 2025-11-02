import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, IconButton, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { EnchantedBackground } from '../components/EnchantedBackground';

export const AuthScreen: React.FC = () => {
  const { login, register, loading, error } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggleMode);
  const themeMode = useThemeStore((state) => state.mode);

  const handleSubmit = () => {
    if (mode === 'login') {
      void login(email, password);
    } else {
      void register(email, password);
    }
  };

  return (
    <EnchantedBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.themeToggle}>
          <IconButton
            icon={themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'}
            mode="contained-tonal"
            onPress={() => void toggleTheme()}
            accessibilityLabel="Toggle color scheme"
          />
        </View>
        <View style={styles.container}>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={3}>
            <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onSurface }]}> 
              StoryNest
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Your pocket-sized storyteller for whimsical, 200-word adventures.
            </Text>
            <TextInput
              label="Email"
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              label="Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              style={styles.input}
            />
            <HelperText type={error ? 'error' : 'info'} visible style={styles.helper}>
              {error ?? 'Sign in or create an account to begin your storytelling session.'}
            </HelperText>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              style={styles.primaryButton}
              contentStyle={styles.primaryContent}
              icon={mode === 'login' ? 'login' : 'account-plus'}
            >
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
            <Button
              mode="text"
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={styles.secondaryButton}
            >
              {mode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
            </Button>
          </Surface>
        </View>
      </SafeAreaView>
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  themeToggle: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48
  },
  card: {
    padding: 28,
    borderRadius: 32,
    gap: 16
  },
  title: {
    textAlign: 'center'
  },
  subtitle: {
    textAlign: 'center'
  },
  input: {
    backgroundColor: 'transparent'
  },
  helper: {
    textAlign: 'center'
  },
  primaryButton: {
    borderRadius: 20
  },
  primaryContent: {
    paddingVertical: 6
  },
  secondaryButton: {
    alignSelf: 'center'
  }
});
