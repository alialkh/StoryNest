import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, useTheme, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export const BottomBar: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const onHome = () => navigation.navigate('Home');
  const onNewChat = () => {
    // Route to a screen with the prompt composer; default to Home
    navigation.navigate('Home', { focusComposer: true });
  };
  const onLibrary = () => navigation.navigate('Library');
  const onAccount = () => {
    // If there's no Account screen yet, fall back to Auth
    try {
      navigation.navigate('Account');
    } catch {
      navigation.navigate('Auth');
    }
  };

  return (
    <Surface style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: theme.colors.surface }]} elevation={3}>
      <View style={styles.row}>
        <View style={styles.item}>
          <View style={[styles.iconPill, { backgroundColor: theme.colors.primaryContainer }]} onTouchEnd={onHome}> 
            <MaterialCommunityIcons name="home-variant" size={22} color={theme.colors.onPrimaryContainer} accessibilityLabel="Home" />
          </View>
          <Text onPress={onHome} style={[styles.label, { color: theme.colors.onSurface }]} accessibilityLabel="Home">Home</Text>
        </View>
        <View style={styles.item}>
          <View style={[styles.iconPill, { backgroundColor: theme.colors.secondaryContainer }]} onTouchEnd={onNewChat}> 
            <MaterialCommunityIcons name="auto-fix" size={22} color={theme.colors.onSecondaryContainer} accessibilityLabel="Start a new chat" />
          </View>
          <Text onPress={onNewChat} style={[styles.label, { color: theme.colors.onSurface }]} accessibilityLabel="Start a new chat">New</Text>
        </View>
        <View style={styles.item}>
          <View style={[styles.iconPill, { backgroundColor: theme.colors.tertiaryContainer }]} onTouchEnd={onLibrary}> 
            <MaterialCommunityIcons name="bookshelf" size={22} color={theme.colors.onTertiaryContainer} accessibilityLabel="Chat library" />
          </View>
          <Text onPress={onLibrary} style={[styles.label, { color: theme.colors.onSurface }]} accessibilityLabel="Chat library">Library</Text>
        </View>
        <View style={styles.item}>
        <View style={[styles.iconPill, { backgroundColor: theme.colors.primary }]} onTouchEnd={onAccount}> 
        <MaterialCommunityIcons name="account-circle" size={22} color={theme.colors.onPrimary} accessibilityLabel="My account" />
        </View>
        <Text onPress={onAccount} style={[styles.label, { color: theme.colors.onSurface }]} accessibilityLabel="My account">Account</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  item: {
    alignItems: 'center',
    gap: 6,
  },
  iconPill: {
    width: 48,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  iconGlyph: {
    fontSize: 20,
  },
  label: {
    fontSize: 12,
  }
});
