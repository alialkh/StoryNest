import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { EnchantedBackground } from '../components/EnchantedBackground';

export const AuthScreen: React.FC = () => {
  const { login, register, loading, error } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (mode === 'login') {
      void login(email, password);
    } else {
      void register(email, password);
    }
  };

  return (
    <EnchantedBackground contentStyle={styles.container}>
      <View style={styles.card}>
        <Text variant="displaySmall" style={styles.title}>
          StoryNest
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
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
        {error ? (
          <Text variant="bodySmall" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.primaryButton}
          contentStyle={styles.primaryContent}
          icon="feather"
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
      </View>
    </EnchantedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  card: {
    padding: 28,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    gap: 16,
    shadowColor: '#1F1F46',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  title: {
    textAlign: 'center',
    color: '#4C1D95'
  },
  subtitle: {
    textAlign: 'center',
    color: '#4338CA'
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)'
  },
  error: {
    color: '#DC2626'
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
