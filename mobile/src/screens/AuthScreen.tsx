import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

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
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        StoryNest
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Craft vivid 200-word stories with a single prompt.
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
      <Button mode="contained" onPress={handleSubmit} loading={loading}>
        {mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
      <Button onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F3FF'
  },
  title: {
    textAlign: 'center',
    marginBottom: 12
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32
  },
  input: {
    marginBottom: 12
  },
  error: {
    color: '#DC2626',
    marginBottom: 12
  }
});
