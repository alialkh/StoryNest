import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, useTheme, Text, TouchableRipple } from 'react-native-paper';
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

  const items = [
    {
      key: 'home',
      label: 'Home',
      icon: 'home-variant' as const,
      containerColor: theme.colors.primaryContainer,
      iconColor: theme.colors.onPrimaryContainer,
      onPress: onHome,
      accessibilityLabel: 'Home'
    },
    {
      key: 'new',
      label: 'New',
      icon: 'auto-fix' as const,
      containerColor: theme.colors.secondaryContainer,
      iconColor: theme.colors.onSecondaryContainer,
      onPress: onNewChat,
      accessibilityLabel: 'Start a new story'
    },
    {
      key: 'library',
      label: 'Library',
      icon: 'bookshelf' as const,
      containerColor: theme.colors.tertiaryContainer,
      iconColor: theme.colors.onTertiaryContainer,
      onPress: onLibrary,
      accessibilityLabel: 'Story library'
    },
    {
      key: 'account',
      label: 'Account',
      icon: 'account-circle' as const,
      containerColor: theme.colors.primary,
      iconColor: theme.colors.onPrimary,
      onPress: onAccount,
      accessibilityLabel: 'My account'
    }
  ];

  return (
    <Surface
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: theme.colors.surface }]}
      elevation={3}
    >
      <View style={styles.row}>
        {items.map(({ key, label, icon, containerColor, iconColor, onPress, accessibilityLabel }) => (
          <TouchableRipple
            key={key}
            onPress={onPress}
            style={styles.touchable}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            borderless
          >
            <View style={styles.item}>
              <View style={[styles.iconPill, { backgroundColor: containerColor }]}>
                <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
              </View>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>{label}</Text>
            </View>
          </TouchableRipple>
        ))}
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
    paddingTop: 8
  },
  touchable: {
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  item: {
    alignItems: 'center',
    gap: 6
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
