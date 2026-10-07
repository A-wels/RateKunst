import React from 'react';
import AdBanner from './components/AdBanner';
import {
  MonetizationProvider,
  useMonetization,
} from './monetization/MonetizationContext';
import {
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  Platform,
  NativeModules,
} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import StartScreen from './pages/screens/StartScreen';
import GameScreen from './pages/screens/GameScreen';
import CustomsetScreen from './pages/screens/CustomsetScreen';
import EditPage from './pages/screens/EditPage';
import {
  Language,
  LocalizationProvider,
  useLocalization,
} from './i18n/LocalizationContext';
import {ThemeColors} from './constants/theme';
import {ThemeProvider, useTheme, useThemedStyles} from './theme/ThemeContext';
import SettingsScreen from './pages/screens/SettingsScreen';
import {InputRecoveryProvider} from './hooks/useInputRecovery';

// Avoid the old Android Fragment/CoordinatorLayout input path. Ordinary React
// views keep header and content in the same navigation layout.
const AndroidStack = createStackNavigator();
const NativeStack = createNativeStackNavigator();

const LanguageSwitch = () => {
  const {language, setLanguage} = useLocalization();
  const {colors} = useTheme();
  const styles = useThemedStyles(createStyles);
  const option = (value: Language) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value === 'de' ? 'Deutsch' : 'English'}
      accessibilityState={{selected: language === value}}
      android_ripple={{color: colors.outlineVariant}}
      onPress={() => setLanguage(value)}
      style={[
        styles.languageOption,
        language === value && styles.languageOptionActive,
      ]}>
      <Text
        style={[
          styles.languageText,
          language === value && styles.languageTextActive,
        ]}>
        {value.toUpperCase()}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.languageSwitch}>
      {option('de')}
      {option('en')}
    </View>
  );
};

const AppNavigator = () => {
  const Stack = Platform.OS === 'android' ? AndroidStack : NativeStack;
  const {t} = useLocalization();
  const {colors, mode} = useTheme();
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.primaryContainer,
      text: colors.onSurface,
      primary: colors.primary,
      border: colors.outlineVariant,
      notification: colors.error,
    },
  };
  const {setGameActive} = useMonetization();
  const navigationRef = React.useRef<any>(null);
  const syncGame = () => {
    const active = navigationRef.current?.getCurrentRoute()?.name === 'Game';
    setGameActive(active);
    if (Platform.OS === 'android') {
      // Screen orientation belongs to the route, not the temporary ad break.
      NativeModules.RateKunstDisplay?.setGameActive(active);
    }
  };

  return (
    <View style={layoutStyles.app}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onReady={syncGame}
        onStateChange={syncGame}>
        <StatusBar
          barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.primaryContainer}
        />
        <Stack.Navigator
          {...(Platform.OS === 'android' ? {detachInactiveScreens: false} : {})}
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primaryContainer,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTintColor: colors.onPrimaryContainer,
            headerShadowVisible: false,
            headerTitleStyle: {fontSize: 20, fontWeight: '500'},
            ...(Platform.OS === 'android'
              ? {
                  animationEnabled: false,
                  gestureEnabled: false,
                  cardOverlayEnabled: false,
                  cardShadowEnabled: false,
                  cardStyle: {backgroundColor: colors.background},
                  headerTitleAlign: 'left' as const,
                  headerBackAccessibilityLabel: t('previous'),
                }
              : {contentStyle: {backgroundColor: colors.background}}),
          }}>
          <Stack.Screen
            name="Home"
            component={StartScreen}
            options={{
              title: t('appName'),
              headerRight: LanguageSwitch,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: t('settings'),
            }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              headerShown: false,
              ...(Platform.OS === 'android'
                ? {}
                : {orientation: 'landscape' as const}),
            }}
          />
          <Stack.Screen
            name="CustomSets"
            component={CustomsetScreen}
            options={{
              title: t('customSets'),
            }}
          />
          <Stack.Screen
            name="EditSet"
            component={EditPage}
            options={{
              title: t('editSet'),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <AdBanner />
    </View>
  );
};

const App = (): JSX.Element => (
  <GestureHandlerRootView style={layoutStyles.app}>
    <SafeAreaProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <MonetizationProvider>
            <InputRecoveryProvider>
              <AppNavigator />
            </InputRecoveryProvider>
          </MonetizationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

const layoutStyles = StyleSheet.create({app: {flex: 1}});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    languageSwitch: {flexDirection: 'row'},
    languageOption: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    languageOptionActive: {borderBottomColor: colors.primary},
    languageText: {color: colors.onPrimaryContainer, fontSize: 14},
    languageTextActive: {color: colors.onPrimaryContainer, fontWeight: '500'},
  });

export default App;
