import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Portal, Modal, Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CelebrationModalProps {
  visible: boolean;
  xpGained: number;
  onDismiss: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ visible, xpGained, onDismiss }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // Auto-dismiss after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ]).start(() => {
          onDismiss();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, scaleAnim, opacityAnim, onDismiss]);

  return (
    <Portal>
      <Modal visible={visible} dismissable={false}>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Surface style={styles.card} elevation={3}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="star-circle" size={80} color="#FFD700" />
              </View>

              <Text variant="headlineLarge" style={styles.title}>
                Shared! 🎉
              </Text>

              <View style={styles.xpContainer}>
                <Text variant="displaySmall" style={styles.xpAmount}>
                  +{xpGained}
                </Text>
                <Text variant="bodyLarge" style={styles.xpLabel}>
                  XP Earned
                </Text>
              </View>

              <Text variant="bodyMedium" style={styles.subtitle}>
                Your story is now visible to the community!
              </Text>

              <Button
                mode="contained"
                onPress={onDismiss}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                Awesome!
              </Button>
            </Surface>
          </Animated.View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  content: {
    width: '80%',
    maxWidth: 400
  },
  card: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: 16
  },
  title: {
    marginBottom: 16,
    textAlign: 'center'
  },
  xpContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  xpAmount: {
    fontWeight: '600',
    color: '#FFD700'
  },
  xpLabel: {
    marginTop: 4,
    opacity: 0.7
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8
  },
  button: {
    marginTop: 8
  },
  buttonLabel: {
    fontSize: 16
  }
});
