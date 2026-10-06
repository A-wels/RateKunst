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
} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

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

const Stack = createNativeStackNavigator();

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
  const syncGame = () =>
    setGameActive(navigationRef.current?.getCurrentRoute()?.name === 'Game');

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
          screenOptions={{
            headerStyle: {backgroundColor: colors.primaryContainer},
            headerTintColor: colors.onPrimaryContainer,
            headerShadowVisible: false,
            headerTitleStyle: {fontSize: 20, fontWeight: '500'},
            contentStyle: {backgroundColor: colors.background},
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
              animation: Platform.OS === 'android' ? 'none' : 'default',
            }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{headerShown: false, orientation: 'landscape'}}
          />
          <Stack.Screen
            name="CustomSets"
            component={CustomsetScreen}
            options={{
              title: t('customSets'),
              // Avoid RN 0.72 / screens 3.22's broken default Android transition.
              animation: Platform.OS === 'android' ? 'none' : 'default',
            }}
          />
          <Stack.Screen
            name="EditSet"
            component={EditPage}
            options={{
              title: t('editSet'),
              animation: Platform.OS === 'android' ? 'none' : 'default',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <AdBanner />
    </View>
  );
};

const App = (): JSX.Element => (
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
