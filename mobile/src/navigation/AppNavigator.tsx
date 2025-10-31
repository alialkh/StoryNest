import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, MD3LightTheme, Provider as PaperProvider, configureFonts } from 'react-native-paper';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ContinuationScreen } from '../screens/ContinuationScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { useAuthStore } from '../store/authStore';
import { createPaperTheme } from '../theme/createPaperTheme';
import type { Story } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Library: undefined;
  Continue: { story: Story };
  Upgrade: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const initialise = useAuthStore((state) => state.initialise);
  const [loading, setLoading] = useState(true);
  const [continuationStory, setContinuationStory] = useState<Story | null>(null);

  const paperTheme = useMemo(() => createPaperTheme(), []);

  useEffect(() => {
    void initialise().finally(() => setLoading(false));
  }, [initialise]);

  if (loading) {
    return <ActivityIndicator testID="app-loading-indicator" style={{ flex: 1 }} />;
  }

  const theme = useMemo(
    () => ({
      ...MD3LightTheme,
      roundness: 20,
      colors: {
        ...MD3LightTheme.colors,
        primary: '#7C3AED',
        secondary: '#F472B6',
        tertiary: '#FBBF24',
        surface: 'rgba(255,255,255,0.92)',
        surfaceVariant: '#ECE1FF',
        background: 'transparent',
        onPrimary: '#F8F8FF'
      },
      fonts: configureFonts({
        config: {
          displaySmall: { fontFamily: 'System', fontWeight: '700' },
          headlineMedium: { fontFamily: 'System', fontWeight: '700' },
          titleMedium: { fontFamily: 'System', fontWeight: '600' },
          bodyMedium: { fontFamily: 'System', fontWeight: '400' }
        }
      })
    }),
    []
  );

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Group>
              <Stack.Screen name="Home">
                {({ navigation }) => (
                  <HomeScreen
                    onContinueStory={(story) => {
                      setContinuationStory(story);
                      navigation.navigate('Continue', { story });
                    }}
                    onOpenLibrary={() => navigation.navigate('Library')}
                    onUpgrade={() => navigation.navigate('Upgrade')}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Library">
                {({ navigation }) => (
                  <LibraryScreen
                    onBack={() => navigation.goBack()}
                    onContinueStory={(story) => {
                      setContinuationStory(story);
                      navigation.navigate('Continue', { story });
                    }}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Continue">
                {({ navigation, route }) => (
                  <ContinuationScreen
                    story={continuationStory ?? route.params.story}
                    onBack={() => navigation.goBack()}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Upgrade">
                {({ navigation }) => <UpgradeScreen onBack={() => navigation.goBack()} />}
              </Stack.Screen>
            </Stack.Group>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};
