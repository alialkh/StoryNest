import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Surface, Text, useTheme } from 'react-native-paper';

interface Props {
  visible: boolean;
  message?: string;
}

export const LoadingModal: React.FC<Props> = ({ visible, message = 'Creating your story...' }) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
          <Text variant="titleMedium" style={[styles.message, { color: theme.colors.onSurface }]}>
            {message}
          </Text>
          <Text variant="bodySmall" style={[styles.subtext, { color: theme.colors.onSurfaceVariant }]}>
            The AI is weaving your tale...
          </Text>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320
  },
  spinner: {
    marginBottom: 20
  },
  message: {
    textAlign: 'center',
    marginBottom: 8
  },
  subtext: {
    textAlign: 'center'
  }
});
