import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Provider as PaperProvider } from 'react-native-paper';
import { EnchantedBackground } from '../components/EnchantedBackground';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ContinuationScreen } from '../screens/ContinuationScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { AllAchievementsScreen } from '../screens/AllAchievementsScreen';
import { NewStoryWizard } from '../screens/NewStoryWizard';
import { PublicFeedScreen } from '../screens/PublicFeedScreen';
import { StoryDetailScreen } from '../screens/StoryDetailScreen';
import { useAuthStore } from '../store/authStore';
import { useStoryStore } from '../store/storyStore';
import { createPaperTheme } from '../theme/createPaperTheme';
import type { Story } from '../types';
import { useThemeStore } from '../store/themeStore';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Library: undefined;
  Continue: { story: Story };
  Upgrade: undefined;
  Account: undefined;
  AllAchievements: undefined;
  NewStoryWizard: undefined;
  PublicFeed: undefined;
  StoryDetail: { storyId: string; story: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const initialise = useAuthStore((state) => state.initialise);
  const [loading, setLoading] = useState(true);
  const [continuationStory, setContinuationStory] = useState<Story | null>(null);
  const themeMode = useThemeStore((state) => state.mode);
  const colorTheme = useThemeStore((state) => state.colorTheme);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const generateStory = useStoryStore((state) => state.generateStory);
  const remaining = useStoryStore((state) => state.remaining);

  const paperTheme = useMemo(() => createPaperTheme(themeMode, colorTheme), [themeMode, colorTheme]);

  const navigationTheme = useMemo(
    () => ({
      ...(themeMode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
      colors: {
        ...(themeMode === 'dark' ? NavigationDarkTheme.colors : NavigationDefaultTheme.colors),
        background: paperTheme.colors.background,
        card: paperTheme.colors.surface,
        text: paperTheme.colors.onSurface,
        border: paperTheme.colors.outline
      }
    }),
    [paperTheme, themeMode]
  );

  useEffect(() => {
    void initialise().finally(() => setLoading(false));
  }, [initialise]);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  if (loading || !themeHydrated) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
          <EnchantedBackground>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator testID="app-loading-indicator" size="large" />
            </View>
          </EnchantedBackground>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <View style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: paperTheme.colors.background }
            }}
          >
          {user ? (
            <>
              <Stack.Group>
                <Stack.Screen name="Home">
                  {({ navigation }) => (
                    <HomeScreen
                      onContinueStory={(story) => {
                        setContinuationStory(story);
                        navigation.navigate('Continue', { story });
                      }}
                      onOpenLibrary={() => navigation.navigate('Library')}
                      onOpenAccount={() => navigation.navigate('Account')}
                      onUpgrade={() => navigation.navigate('Upgrade')}
                      onCreateStory={() => navigation.navigate('NewStoryWizard')}
                      onOpenPublicFeed={() => navigation.navigate('PublicFeed')}
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
                      onViewStory={(story) => {
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
                <Stack.Screen name="Account">
                  {({ navigation }) => <AccountScreen onBack={() => navigation.goBack()} onOpenAllAchievements={() => navigation.navigate('AllAchievements')} />}
                </Stack.Screen>
                <Stack.Screen name="AllAchievements">
                  {({ navigation }) => <AllAchievementsScreen onBack={() => navigation.goBack()} />}
                </Stack.Screen>
                <Stack.Screen name="PublicFeed">
                  {({ navigation }) => (
                    <PublicFeedScreen navigation={navigation} route={{key: 'PublicFeed', name: 'PublicFeed', params: undefined}} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="StoryDetail">
                  {({ navigation, route }) => (
                    <StoryDetailScreen navigation={navigation} route={route as any} />
                  )}
                </Stack.Screen>
              </Stack.Group>
              <Stack.Group
                screenOptions={{
                  presentation: 'modal',
                }}
              >
                <Stack.Screen name="NewStoryWizard">
                  {({ navigation, route }) => (
                    <NewStoryWizard
                      onCancel={() => navigation.goBack()}
                      onSubmit={async (payload) => {
                        const createdStory = await generateStory(payload);
                        if (createdStory) {
                          setContinuationStory(createdStory);
                          navigation.navigate('Continue', { story: createdStory });
                        }
                      }}
                      remaining={remaining}
                    />
                  )}
                </Stack.Screen>
              </Stack.Group>
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
        </NavigationContainer>
      </View>
    </PaperProvider>
  );
};
